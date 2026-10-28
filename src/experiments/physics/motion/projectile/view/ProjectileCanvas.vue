<template>
  <div class="canvas-wrapper">
    <canvas
      ref="canvasRef"
      class="simulation-canvas"
      @mousedown="startPan"
      @touchstart.passive="startPanTouch"
      @wheel.prevent="onWheel"
    ></canvas>

    <!-- Canvas HUD Overlay -->
    <div class="canvas-hud">
      <div class="hud-stat-pill ltr">
        <span class="hud-label">x:</span>
        <span class="hud-val">{{ formatVal(state.x, 1) }} m</span>
        <span class="hud-label">y:</span>
        <span class="hud-val">{{ formatVal(state.y, 1) }} m</span>
        <span class="hud-label">v:</span>
        <span class="hud-val">{{ formatVal(state.v, 1) }} m/s</span>
      </div>

      <div class="hud-controls">
        <label class="hud-toggle">
          <input type="checkbox" v-model="showVectors" />
          <span>{{ $t('common.vectors') }}</span>
        </label>
        <label class="hud-toggle">
          <input type="checkbox" v-model="showTrail" />
          <span>{{ $t('common.trail') }}</span>
        </label>
        <button type="button" class="btn-hud-icon touch-target" @click="resetCamera" :title="$t('common.resetCamera')">
          🎯 {{ $t('common.overview') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { ProjectileState, ProjectileParams } from '../model/projectile';
import { formatScientificValue } from '@/core/units';
import { useAppStore } from '@/app/store';

const props = defineProps<{
  params: ProjectileParams;
  state: ProjectileState;
  trailPoints: { x: number; y: number }[];
  mode: 'ideal' | 'real';
}>();

const store = useAppStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);

const showVectors = ref(true);
const showTrail = ref(true);

// Camera transform (world to screen)
const scale = ref(10); // pixels per meter
const offsetX = ref(60); // origin x in screen pixels
const offsetY = ref(60); // origin y margin from bottom in screen pixels

let isPanning = false;
let startX = 0;
let startY = 0;
let animId: number | null = null;

function formatVal(v: number, decimals: number): string {
  return formatScientificValue(v, {
    decimals,
    usePersianDigits: store.usePersianDigits
  });
}

function resetCamera() {
  scale.value = 10;
  offsetX.value = 80;
  offsetY.value = 80;
  render();
}

function onWheel(e: WheelEvent) {
  const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
  scale.value = Math.max(2, Math.min(60, scale.value * zoomFactor));
  render();
}

function startPan(e: MouseEvent) {
  isPanning = true;
  startX = e.clientX - offsetX.value;
  startY = e.clientY - offsetY.value;

  const onMouseMove = (ev: MouseEvent) => {
    if (!isPanning) return;
    offsetX.value = ev.clientX - startX;
    offsetY.value = ev.clientY - startY;
    render();
  };

  const onMouseUp = () => {
    isPanning = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function startPanTouch(e: TouchEvent) {
  const t = e.touches[0];
  if (!t) return;
  isPanning = true;
  startX = t.clientX - offsetX.value;
  startY = t.clientY - offsetY.value;

  const onTouchMove = (ev: TouchEvent) => {
    if (!isPanning) return;
    const touch = ev.touches[0];
    if (touch) {
      offsetX.value = touch.clientX - startX;
      offsetY.value = touch.clientY - startY;
      render();
    }
  };

  const onTouchEnd = () => {
    isPanning = false;
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
  };

  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchend', onTouchEnd);
}

function worldToScreen(x: number, y: number, height: number): [number, number] {
  const sx = offsetX.value + x * scale.value;
  const sy = height - offsetY.value - y * scale.value;
  return [sx, sy];
}

function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const wrapper = canvas.parentElement;
  const width = wrapper ? wrapper.clientWidth : (canvas.clientWidth || 600);
  const height = wrapper ? wrapper.clientHeight : (canvas.clientHeight || 450);

  const targetWidth = Math.round(width * dpr);
  const targetHeight = Math.round(height * dpr);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  const isDark = store.theme === 'dark';

  // Background Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (isDark) {
    skyGrad.addColorStop(0, '#090d16');
    skyGrad.addColorStop(1, '#111827');
  } else {
    skyGrad.addColorStop(0, '#e0f2fe');
    skyGrad.addColorStop(1, '#f8fafc');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Background Grid
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
  ctx.lineWidth = 1;
  const gridMeters = 10;
  const gridPx = gridMeters * scale.value;

  const [originX, originY] = worldToScreen(0, 0, height);

  ctx.beginPath();
  for (let x = originX; x < width; x += gridPx) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let x = originX; x > 0; x -= gridPx) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = originY; y < height; y += gridPx) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  for (let y = originY; y > 0; y -= gridPx) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // Ground Grass/Soil
  ctx.fillStyle = isDark ? '#1e293b' : '#cbd5e1';
  ctx.fillRect(0, originY, width, height - originY);

  ctx.strokeStyle = isDark ? '#334155' : '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(width, originY);
  ctx.stroke();

  // Ground distance ticks
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = '10px var(--font-mono)';
  ctx.textAlign = 'center';

  const maxMeters = Math.ceil((width - originX) / scale.value);
  for (let m = 0; m <= maxMeters; m += 10) {
    const [tx, ty] = worldToScreen(m, 0, height);
    if (tx >= 0 && tx <= width) {
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx, ty + (m % 50 === 0 ? 10 : 5));
      ctx.stroke();

      if (m % 20 === 0) {
        ctx.fillText(`${m}m`, tx, ty + 22);
      }
    }
  }

  // Trajectory Trail
  if (showTrail.value && props.trailPoints.length > 1) {
    ctx.strokeStyle = props.mode === 'real' ? '#f59e0b' : '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();

    const [firstX, firstY] = worldToScreen(props.trailPoints[0].x, props.trailPoints[0].y, height);
    ctx.moveTo(firstX, firstY);

    for (let i = 1; i < props.trailPoints.length; i++) {
      const [ptX, ptY] = worldToScreen(props.trailPoints[i].x, props.trailPoints[i].y, height);
      ctx.lineTo(ptX, ptY);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Cannon base platform at h0
  const [cannonBaseX, cannonBaseY] = worldToScreen(0, props.params.h0, height);

  if (props.params.h0 > 0) {
    // Platform tower
    const [groundX, groundY] = worldToScreen(0, 0, height);
    ctx.fillStyle = isDark ? '#334155' : '#94a3b8';
    ctx.fillRect(groundX - 12, cannonBaseY, 24, groundY - cannonBaseY);
    ctx.strokeStyle = isDark ? '#475569' : '#64748b';
    ctx.strokeRect(groundX - 12, cannonBaseY, 24, groundY - cannonBaseY);
  }

  // Cannon barrel
  ctx.save();
  ctx.translate(cannonBaseX, cannonBaseY);
  const rad = (-props.params.angle * Math.PI) / 180;
  ctx.rotate(rad);

  // Barrel cylinder
  const barrelGrad = ctx.createLinearGradient(0, -7, 0, 7);
  barrelGrad.addColorStop(0, '#475569');
  barrelGrad.addColorStop(0.5, '#64748b');
  barrelGrad.addColorStop(1, '#334155');
  ctx.fillStyle = barrelGrad;
  ctx.fillRect(0, -6, 32, 12);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, -6, 32, 12);

  // Muzzle rim
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(30, -7, 3, 14);

  ctx.restore();

  // Cannon pivot mount
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(cannonBaseX, cannonBaseY, 8, 0, Math.PI * 2);
  ctx.fill();

  // Projectile
  const [ballX, ballY] = worldToScreen(props.state.x, props.state.y, height);
  const ballRadius = Math.max(4, Math.min(10, scale.value * 0.4));

  // Ball shadow on ground
  const [shadowX, shadowY] = worldToScreen(props.state.x, 0, height);
  const shadowDist = Math.max(0, props.state.y);
  const shadowAlpha = Math.max(0.1, 0.5 - shadowDist * 0.015);
  ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
  ctx.beginPath();
  ctx.ellipse(shadowX, shadowY, ballRadius * 1.2, ballRadius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball sphere
  const ballGrad = ctx.createRadialGradient(
    ballX - ballRadius * 0.3,
    ballY - ballRadius * 0.3,
    ballRadius * 0.1,
    ballX,
    ballY,
    ballRadius
  );
  if (props.mode === 'real') {
    ballGrad.addColorStop(0, '#fbbf24');
    ballGrad.addColorStop(1, '#b45309');
  } else {
    ballGrad.addColorStop(0, '#60a5fa');
    ballGrad.addColorStop(1, '#1d4ed8');
  }
  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Vectors overlay
  if (showVectors.value && !props.state.isLanded) {
    // 1. Velocity vector (Green)
    const vScale = 1.2;
    drawArrow(
      ctx,
      ballX,
      ballY,
      ballX + props.state.vx * vScale,
      ballY - props.state.vy * vScale,
      '#10b981',
      'v'
    );

    // 2. Gravity vector (Blue)
    const gScale = 2.0;
    drawArrow(
      ctx,
      ballX,
      ballY,
      ballX,
      ballY + props.params.gravity * gScale,
      '#38bdf8',
      'Fg'
    );

    // 3. Drag force vector in Real mode (Red)
    if (props.mode === 'real') {
      const dScale = 2.0;
      const dragAx = props.state.ax;
      const dragAy = props.state.ay + props.params.gravity;
      drawArrow(
        ctx,
        ballX,
        ballY,
        ballX + dragAx * dScale,
        ballY - dragAy * dScale,
        '#ef4444',
        'Fd'
      );
    }
  }

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
  const headLen = 7;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  ctx.font = 'bold 9px var(--font-mono)';
  ctx.fillText(label, toX + 4, toY - 4);
}

function animate() {
  render();
  animId = requestAnimationFrame(animate);
}

defineExpose({
  getCanvas: () => canvasRef.value
});

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
  height: 480px;
  min-height: 380px;
  max-height: 520px;
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
  top: var(--space-3);
  left: var(--space-3);
  right: var(--space-3);
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
</style>
