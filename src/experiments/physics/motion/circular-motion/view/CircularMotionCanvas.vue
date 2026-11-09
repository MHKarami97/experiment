<template>
  <div class="canvas-wrapper">
    <canvas ref="canvasRef" class="simulation-canvas"></canvas>

    <!-- Top Floating HUD -->
    <div class="canvas-hud">
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('circularMotion.outputs.speed') }}:</span>
        <span class="hud-val">{{ state.speed.toFixed(2) }} m/s</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('circularMotion.outputs.centripetalAcc') }}:</span>
        <span class="hud-val">{{ state.centripetalAcc.toFixed(1) }} m/s²</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('circularMotion.outputs.tension') }}:</span>
        <span class="hud-val" :class="{ 'warning-tension': state.tension > params.maxTension * 0.8 }">
          {{ state.tension.toFixed(1) }} N
        </span>
      </div>
      <div v-if="state.isSnapped" class="hud-stat-pill snap-badge">
        <span class="hud-val">⚠️ {{ $t('circularMotion.outputs.statusSnapped') }}</span>
      </div>
      <div class="hud-controls">
        <label class="hud-toggle">
          <input v-model="showVectors" type="checkbox" />
          <span>{{ $t('common.vectors') }}</span>
        </label>
        <button type="button" class="btn-hud-icon" title="Reset View" @click="resetView">
          🔍
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { CircularMotionState, CircularMotionParams } from '../model/circularMotion';
import { useAppStore } from '@/app/store';

const props = defineProps<{
  state: CircularMotionState;
  params: CircularMotionParams;
  mode: 'ideal' | 'real';
}>();

const store = useAppStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const showVectors = ref(true);

let animId: number | null = null;
const scale = ref(65); // pixels per meter
const offsetX = ref(0);
const offsetY = ref(0);

// Trail of past positions
const trailPoints = ref<{ x: number; y: number }[]>([]);

function resetView() {
  scale.value = 65;
  offsetX.value = 0;
  offsetY.value = 0;
  trailPoints.value = [];
  render();
}

function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const isDark = store.theme === 'dark';
  const centerX = width / 2 + offsetX.value;
  const centerY = height / 2 + offsetY.value;

  // 1. Draw Polar Coordinate Grid (Concentric Circles & Rays)
  ctx.save();
  ctx.translate(centerX, centerY);

  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  ctx.lineWidth = 1;

  // Concentric Rings for each 1 meter
  for (let m = 1; m <= 6; m++) {
    const rPx = m * scale.value;
    ctx.beginPath();
    ctx.arc(0, 0, rPx, 0, Math.PI * 2);
    ctx.stroke();

    // Distance Label
    ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
    ctx.font = '10px var(--font-mono)';
    ctx.fillText(`${m}m`, rPx + 4, -4);
  }

  // 8 Angle Rays
  for (let deg = 0; deg < 360; deg += 45) {
    const rad = (deg * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(rad) * 400, Math.sin(rad) * 400);
    ctx.stroke();
  }

  // 2. Ideal Nominal Circular Track (Dashed Orbit)
  if (!props.state.isSnapped) {
    ctx.strokeStyle = isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, props.params.radius * scale.value, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 3. Trajectory Trail
  if (trailPoints.value.length > 1) {
    ctx.strokeStyle = props.state.isSnapped ? '#ef4444' : (props.mode === 'real' ? '#f59e0b' : '#3b82f6');
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < trailPoints.value.length; i++) {
      const pt = trailPoints.value[i];
      const px = pt.x * scale.value;
      const py = -pt.y * scale.value;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Current body coordinate in pixels (world y is up, canvas y is down)
  const bodyX = props.state.x * scale.value;
  const bodyY = -props.state.y * scale.value;

  // 4. Central Pivot Post / Motor
  const pivotGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 16);
  pivotGrad.addColorStop(0, '#94a3b8');
  pivotGrad.addColorStop(0.5, '#475569');
  pivotGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = pivotGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Central axle dot
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  // 5. String / Tether Line
  if (!props.state.isSnapped) {
    // Dynamic color depending on tension load
    const tensionRatio = Math.min(1.0, props.state.tension / Math.max(1, props.params.maxTension));
    let ropeColor = '#38bdf8';
    if (tensionRatio > 0.85) {
      ropeColor = '#ef4444';
    } else if (tensionRatio > 0.6) {
      ropeColor = '#f59e0b';
    }

    ctx.strokeStyle = ropeColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(bodyX, bodyY);
    ctx.stroke();

    // Small strain rings on string in real mode if stretching
    if (props.mode === 'real' && tensionRatio > 0.5) {
      const midX = bodyX * 0.5;
      const midY = bodyY * 0.5;
      ctx.fillStyle = ropeColor;
      ctx.beginPath();
      ctx.arc(midX, midY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Snapped tether: draw torn frayed end at pivot
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(props.state.theta) * 20, -Math.sin(props.state.theta) * 20);
    ctx.stroke();
  }

  // 6. Rotating Mass Body (Shaded Sphere)
  const massRadius = Math.max(8, Math.min(20, 9 + Math.cbrt(props.params.mass) * 4));
  const massGrad = ctx.createRadialGradient(
    bodyX - massRadius * 0.35,
    bodyY - massRadius * 0.35,
    massRadius * 0.1,
    bodyX,
    bodyY,
    massRadius
  );

  if (props.state.isSnapped) {
    massGrad.addColorStop(0, '#fca5a5');
    massGrad.addColorStop(1, '#b91c1c');
  } else if (props.mode === 'real') {
    massGrad.addColorStop(0, '#fde68a');
    massGrad.addColorStop(1, '#d97706');
  } else {
    massGrad.addColorStop(0, '#93c5fd');
    massGrad.addColorStop(1, '#1d4ed8');
  }

  ctx.fillStyle = massGrad;
  ctx.beginPath();
  ctx.arc(bodyX, bodyY, massRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Mass weight label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${props.params.mass.toFixed(1)}kg`, bodyX, bodyY + 4);

  // 7. Force and Velocity Vectors
  if (showVectors.value) {
    // Tangential Velocity Vector (Green)
    const vScale = 3.5;
    const vxPx = props.state.vx * vScale;
    const vyPx = -props.state.vy * vScale; // invert y for canvas
    drawArrow(
      ctx,
      bodyX,
      bodyY,
      bodyX + vxPx,
      bodyY + vyPx,
      '#10b981',
      `v = ${props.state.speed.toFixed(1)} m/s`
    );

    // Centripetal Acceleration / Tension Force Vector (Orange/Red) pointing towards (0,0)
    if (!props.state.isSnapped && props.state.centripetalAcc > 0.1) {
      const fcScale = Math.min(0.5, 50 / Math.max(1, props.state.tension));
      const arrowLen = Math.min(props.state.radius * scale.value * 0.8, props.state.tension * fcScale);
      const angleToCenter = Math.atan2(-bodyY, -bodyX);
      const toX = bodyX + Math.cos(angleToCenter) * arrowLen;
      const toY = bodyY + Math.sin(angleToCenter) * arrowLen;

      drawArrow(
        ctx,
        bodyX,
        bodyY,
        toX,
        toY,
        '#f43f5e',
        `F_c = ${props.state.tension.toFixed(0)} N`
      );
    }
  }

  ctx.restore();
  ctx.restore();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  label: string
) {
  const headlen = 8;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 4) return;

  const angle = Math.atan2(dy, dx);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  ctx.font = 'bold 10px var(--font-mono)';
  ctx.fillText(label, toX + 6, toY + 4);
}

function animate() {
  // Update trail
  if (!props.state.isStopped) {
    trailPoints.value.push({ x: props.state.x, y: props.state.y });
    if (trailPoints.value.length > 100) {
      trailPoints.value.shift();
    }
  }
  render();
  animId = requestAnimationFrame(animate);
}

defineExpose({
  getCanvas: () => canvasRef.value
});

watch(() => [props.state, props.params, props.mode], render, { deep: true });

onMounted(() => {
  render();
  animate();
  window.addEventListener('resize', render);
});

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId);
  window.removeEventListener('resize', render);
});
</script>

<style scoped>
.canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 260px;
  background: var(--bg-page-secondary);
  overflow: hidden;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-subtle);
}

.simulation-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.canvas-hud {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  right: var(--space-2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.hud-stat-pill {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f8fafc;
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-full);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  box-shadow: var(--shadow-md);
}

.hud-stat-pill.snap-badge {
  background: rgba(185, 28, 28, 0.9);
  border-color: #ef4444;
}

.warning-tension {
  color: #f87171 !important;
  font-weight: 800;
}

.hud-label {
  color: #94a3b8;
  font-weight: 600;
}

.hud-val {
  color: #38bdf8;
  font-weight: 700;
}

.hud-controls {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  color: #f8fafc;
}

.hud-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
}

.btn-hud-icon {
  background: transparent;
  color: #f8fafc;
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
  border-radius: var(--radius-sm);
}

.btn-hud-icon:hover {
  background: rgba(255, 255, 255, 0.1);
}

@media (max-width: 640px) {
  .hud-stat-pill {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    gap: 4px;
  }
  .hud-controls {
    font-size: 0.7rem;
    padding: 0.2rem 0.45rem;
    gap: 4px;
  }
}
</style>
