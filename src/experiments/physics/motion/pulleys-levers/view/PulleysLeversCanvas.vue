<template>
  <div class="canvas-wrapper">
    <canvas ref="canvasRef" class="simulation-canvas"></canvas>

    <!-- Top Floating HUD -->
    <div class="canvas-hud">
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('pulleysLevers.outputs.acceleration') }}:</span>
        <span class="hud-val">{{ state.a.toFixed(2) }} m/s²</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('pulleysLevers.outputs.tension1') }}:</span>
        <span class="hud-val">{{ state.tension1.toFixed(1) }} N</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('pulleysLevers.outputs.tension2') }}:</span>
        <span class="hud-val">{{ state.tension2.toFixed(1) }} N</span>
      </div>
      <div class="hud-controls">
        <label class="hud-toggle">
          <input v-model="showVectors" type="checkbox" />
          <span>{{ $t('common.vectors') }}</span>
        </label>
        <button type="button" class="btn-hud-icon" title="Reset Zoom" @click="resetView">
          🔍
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { PulleysLeversState, PulleysLeversParams } from '../model/pulleysLevers';
import { useAppStore } from '@/app/store';

const props = defineProps<{
  state: PulleysLeversState;
  params: PulleysLeversParams;
  mode: 'ideal' | 'real';
}>();

const store = useAppStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const showVectors = ref(true);

let animId: number | null = null;
const scale = ref(120); // pixels per meter
const offsetX = ref(0);
const offsetY = ref(0);

function resetView() {
  scale.value = 120;
  offsetX.value = 0;
  offsetY.value = 0;
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

  // Background grid
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
  ctx.lineWidth = 1;
  const gridSpacing = 30;
  for (let x = 0; x < width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const centerX = width / 2 + offsetX.value;
  const topY = 60 + offsetY.value;
  const pulleyRadiusPx = Math.max(25, props.params.atwood.pulleyRadius * scale.value);

  // 1. Structural Stand Mount
  ctx.fillStyle = isDark ? '#334155' : '#94a3b8';
  ctx.fillRect(centerX - 8, 0, 16, topY);
  ctx.strokeStyle = isDark ? '#475569' : '#64748b';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - 8, 0, 16, topY);

  // Ceiling fixture bar
  ctx.fillStyle = isDark ? '#1e293b' : '#cbd5e1';
  ctx.fillRect(centerX - 60, 0, 120, 12);
  ctx.strokeRect(centerX - 60, 0, 120, 12);

  // Pulley axle pin
  const axleX = centerX;
  const axleY = topY;

  // 2. Pulley Wheel
  ctx.save();
  ctx.translate(axleX, axleY);
  ctx.rotate(props.state.pulleyAngle);

  // Outer groove rim
  const rimGrad = ctx.createRadialGradient(0, 0, pulleyRadiusPx * 0.7, 0, 0, pulleyRadiusPx);
  rimGrad.addColorStop(0, isDark ? '#475569' : '#94a3b8');
  rimGrad.addColorStop(1, isDark ? '#1e293b' : '#64748b');
  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.arc(0, 0, pulleyRadiusPx, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isDark ? '#64748b' : '#475569';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Internal spokes
  ctx.strokeStyle = isDark ? '#94a3b8' : '#cbd5e1';
  ctx.lineWidth = 3;
  const numSpokes = 6;
  for (let i = 0; i < numSpokes; i++) {
    const spokeAngle = (i * Math.PI * 2) / numSpokes;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(spokeAngle) * (pulleyRadiusPx - 4), Math.sin(spokeAngle) * (pulleyRadiusPx - 4));
    ctx.stroke();
  }

  // Pulley center hub
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 3. Ropes & Suspended Masses
  const ropeLeftX = axleX - pulleyRadiusPx;
  const ropeRightX = axleX + pulleyRadiusPx;

  // Mass 1 position (left): state.y1 is distance above floor (or reference)
  // Let ceiling to floor distance = height * 2 + 1m
  const maxTravel = props.params.atwood.height * 2;
  const floorY = height - 40;
  const travelRangePx = floorY - axleY - 60;

  // Position of masses in pixels
  const leftMassY = floorY - (props.state.y1 / Math.max(0.1, maxTravel)) * travelRangePx;
  const rightMassY = floorY - (props.state.y2 / Math.max(0.1, maxTravel)) * travelRangePx;

  // Draw Ropes
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2.5;

  // Left vertical rope
  ctx.beginPath();
  ctx.moveTo(ropeLeftX, axleY);
  ctx.lineTo(ropeLeftX, leftMassY);
  ctx.stroke();

  // Right vertical rope
  ctx.beginPath();
  ctx.moveTo(ropeRightX, axleY);
  ctx.lineTo(ropeRightX, rightMassY);
  ctx.stroke();

  // Arc over pulley top
  ctx.beginPath();
  ctx.arc(axleX, axleY, pulleyRadiusPx, Math.PI, 0);
  ctx.stroke();

  // Draw Ground Floor
  ctx.fillStyle = isDark ? '#1e293b' : '#cbd5e1';
  ctx.fillRect(0, floorY + 30, width, height - floorY - 30);
  ctx.strokeStyle = isDark ? '#334155' : '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floorY + 30);
  ctx.lineTo(width, floorY + 30);
  ctx.stroke();

  // 4. Draw Masses
  drawHangingMass(ctx, ropeLeftX, leftMassY, props.params.atwood.m1, 'm₁', isDark, '#3b82f6');
  drawHangingMass(ctx, ropeRightX, rightMassY, props.params.atwood.m2, 'm₂', isDark, '#f59e0b');

  // 5. Vectors Overlay (FBD)
  if (showVectors.value) {
    const forceScale = 1.2;

    // Mass 1: Tension T1 (Upwards - Green), Gravity Fg1 (Downwards - Sky blue)
    drawArrow(
      ctx,
      ropeLeftX,
      leftMassY,
      ropeLeftX,
      leftMassY - props.state.tension1 * forceScale,
      '#10b981',
      `T₁ = ${props.state.tension1.toFixed(1)} N`
    );
    const fg1 = props.params.atwood.m1 * props.params.atwood.gravity;
    drawArrow(
      ctx,
      ropeLeftX,
      leftMassY + 40,
      ropeLeftX,
      leftMassY + 40 + fg1 * forceScale,
      '#38bdf8',
      `F_g1 = ${fg1.toFixed(1)} N`
    );

    // Mass 2: Tension T2 (Upwards - Green), Gravity Fg2 (Downwards - Sky blue)
    drawArrow(
      ctx,
      ropeRightX,
      rightMassY,
      ropeRightX,
      rightMassY - props.state.tension2 * forceScale,
      '#10b981',
      `T₂ = ${props.state.tension2.toFixed(1)} N`
    );
    const fg2 = props.params.atwood.m2 * props.params.atwood.gravity;
    drawArrow(
      ctx,
      ropeRightX,
      rightMassY + 40,
      ropeRightX,
      rightMassY + 40 + fg2 * forceScale,
      '#38bdf8',
      `F_g2 = ${fg2.toFixed(1)} N`
    );
  }

  ctx.restore();
}

function drawHangingMass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  mass: number,
  label: string,
  isDark: boolean,
  accentColor: string
) {
  const w = 46;
  const h = 42;

  // Brass top hook
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y + 6, 6, -Math.PI / 2, Math.PI / 2, false);
  ctx.stroke();

  // Block body
  const blockGrad = ctx.createLinearGradient(x - w / 2, y + 12, x + w / 2, y + 12 + h);
  blockGrad.addColorStop(0, accentColor);
  blockGrad.addColorStop(1, isDark ? '#0f172a' : '#1e293b');

  ctx.fillStyle = blockGrad;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y + 12, w, h, 6);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Text label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${label}`, x, y + 30);
  ctx.font = '10px var(--font-mono)';
  ctx.fillText(`${mass.toFixed(1)}kg`, x, y + 45);
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
  const headLen = 8;
  const dx = toX - fromX;
  const dy = toY - fromY;
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
  ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  ctx.font = 'bold 10px var(--font-mono)';
  ctx.fillText(label, toX + 8, toY + (dy > 0 ? 12 : -6));
}

function animate() {
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
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f8fafc;
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-full);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  box-shadow: var(--shadow-md);
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
  background: rgba(15, 23, 42, 0.75);
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
