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
        <span class="hud-val">{{ formatVal(state.x, 2) }} m</span>
        <span class="hud-label">y:</span>
        <span class="hud-val">{{ formatVal(state.y, 2) }} m</span>
        <span class="hud-label">v:</span>
        <span class="hud-val">{{ formatVal(state.v, 2) }} m/s</span>
        <span class="hud-label">a:</span>
        <span class="hud-val">{{ formatVal(state.a, 2) }} m/s²</span>
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
        <button
          type="button"
          class="btn-hud-icon touch-target"
          @click="resetCamera"
          :title="$t('common.resetCamera')"
        >
          🎯 {{ $t('common.overview') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { KinematicsState, KinematicsParams } from '../model/kinematics';
import { formatScientificValue } from '@/core/units';
import { useAppStore } from '@/app/store';

const props = defineProps<{
  params: KinematicsParams;
  state: KinematicsState;
  trailPoints: { x: number; y: number }[];
  mode: 'ideal' | 'real';
}>();

const store = useAppStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);

const showVectors = ref(true);
const showTrail = ref(true);

// Camera transform (world coordinates to screen)
const scale = ref(12); // pixels per meter
const offsetX = ref(100);
const offsetY = ref(300);

let isDragging = false;
let startMouseX = 0;
let startMouseY = 0;
let animFrameId: number | null = null;

function formatVal(v: number, decimals: number = 2): string {
  return formatScientificValue(v, {
    usePersianDigits: store.usePersianDigits,
    decimals
  });
}

function resetCamera() {
  scale.value = 12;
  offsetX.value = 100;
  if (canvasRef.value) {
    offsetY.value = canvasRef.value.clientHeight / 2;
  }
}

function startPan(e: MouseEvent) {
  isDragging = true;
  startMouseX = e.clientX - offsetX.value;
  startMouseY = e.clientY - offsetY.value;
  window.addEventListener('mousemove', onPan);
  window.addEventListener('mouseup', stopPan);
}

function onPan(e: MouseEvent) {
  if (!isDragging) return;
  offsetX.value = e.clientX - startMouseX;
  offsetY.value = e.clientY - startMouseY;
}

function stopPan() {
  isDragging = false;
  window.removeEventListener('mousemove', onPan);
  window.removeEventListener('mouseup', stopPan);
}

function startPanTouch(e: TouchEvent) {
  if (e.touches.length === 1) {
    const t = e.touches[0];
    isDragging = true;
    startMouseX = t.clientX - offsetX.value;
    startMouseY = t.clientY - offsetY.value;
    window.addEventListener('touchmove', onPanTouch, { passive: true });
    window.addEventListener('touchend', stopPanTouch);
  }
}

function onPanTouch(e: TouchEvent) {
  if (!isDragging || e.touches.length !== 1) return;
  const t = e.touches[0];
  offsetX.value = t.clientX - startMouseX;
  offsetY.value = t.clientY - startMouseY;
}

function stopPanTouch() {
  isDragging = false;
  window.removeEventListener('touchmove', onPanTouch);
  window.removeEventListener('touchend', stopPanTouch);
}

function onWheel(e: WheelEvent) {
  const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
  const newScale = Math.min(60, Math.max(3, scale.value * zoomFactor));

  if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    offsetX.value = mouseX - ((mouseX - offsetX.value) * (newScale / scale.value));
    offsetY.value = mouseY - ((mouseY - offsetY.value) * (newScale / scale.value));
  }

  scale.value = newScale;
}

function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const wrapper = canvas.parentElement;
  if (!wrapper) return;

  const dpr = window.devicePixelRatio || 1;
  const displayWidth = wrapper.clientWidth;
  const displayHeight = wrapper.clientHeight;

  if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.scale(dpr, dpr);

  const w = displayWidth;
  const h = displayHeight;

  // Background
  const isDark = store.theme !== 'light';
  ctx.fillStyle = isDark ? '#0b1120' : '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  const ox = offsetX.value;
  const oy = offsetY.value;
  const s = scale.value;

  // World to Screen transformation: Y-axis points upward
  const toScreenX = (x: number) => ox + x * s;
  const toScreenY = (y: number) => oy - y * s;

  // Draw Grid Lines
  const gridStepMeters = s > 25 ? 5 : s > 10 ? 10 : 25;
  ctx.lineWidth = 1;
  ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.35)' : 'rgba(226, 232, 240, 0.8)';
  ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
  ctx.font = '10px Vazirmatn, sans-serif';

  // Vertical Grid
  const startXMeter = Math.floor((-ox) / (gridStepMeters * s)) * gridStepMeters;
  const endXMeter = Math.ceil((w - ox) / (gridStepMeters * s)) * gridStepMeters;

  for (let xm = startXMeter; xm <= endXMeter; xm += gridStepMeters) {
    const sx = toScreenX(xm);
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, h);
    ctx.stroke();

    ctx.fillText(`${xm}m`, sx + 4, oy + 14);
  }

  // Horizontal Grid
  const startYMeter = Math.floor((oy - h) / (gridStepMeters * s)) * gridStepMeters;
  const endYMeter = Math.ceil(oy / (gridStepMeters * s)) * gridStepMeters;

  for (let ym = startYMeter; ym <= endYMeter; ym += gridStepMeters) {
    const sy = toScreenY(ym);
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(w, sy);
    ctx.stroke();

    if (ym !== 0) {
      ctx.fillText(`${ym}m`, ox + 4, sy - 4);
    }
  }

  // Primary Axes (X and Y = 0)
  ctx.lineWidth = 2;
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.4)';

  // X Axis
  ctx.beginPath();
  ctx.moveTo(0, oy);
  ctx.lineTo(w, oy);
  ctx.stroke();

  // Y Axis
  ctx.beginPath();
  ctx.moveTo(ox, 0);
  ctx.lineTo(ox, h);
  ctx.stroke();

  // Draw Motion Track Bar along Y=0
  const trackHeightPx = 6;
  ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
  ctx.fillRect(0, oy - trackHeightPx / 2, w, trackHeightPx);

  // Draw Trajectory Trail
  if (showTrail.value && props.trailPoints.length > 1) {
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3b82f6';
    ctx.setLineDash([4, 4]);

    for (let i = 0; i < props.trailPoints.length; i++) {
      const pt = props.trailPoints[i];
      const sx = toScreenX(pt.x);
      const sy = toScreenY(pt.y);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Current Body Position
  const cartX = toScreenX(props.state.x);
  const cartY = toScreenY(props.state.y);

  // Draw Dynamics Cart Body
  const cartWidth = 44;
  const cartHeight = 22;
  const wheelRadius = 5;

  ctx.save();
  ctx.translate(cartX, cartY);

  // Cart shadow
  ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 8, cartWidth / 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cart Chassis
  const grad = ctx.createLinearGradient(-cartWidth / 2, -cartHeight, cartWidth / 2, 0);
  grad.addColorStop(0, '#3b82f6');
  grad.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(-cartWidth / 2, -cartHeight, cartWidth, cartHeight - 4, 4);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#60a5fa';
  ctx.stroke();

  // Flag/Indicator
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(0, -cartHeight / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // Wheels
  ctx.fillStyle = isDark ? '#475569' : '#334155';
  ctx.beginPath();
  ctx.arc(-cartWidth / 3, -wheelRadius / 2, wheelRadius, 0, Math.PI * 2);
  ctx.arc(cartWidth / 3, -wheelRadius / 2, wheelRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();

  // Draw Velocity & Acceleration Vectors
  if (showVectors.value) {
    const vectorScale = 2.5; // px per m/s

    // Velocity Vector (Green)
    if (props.state.v > 0.05) {
      drawArrow(
        ctx,
        cartX,
        cartY - cartHeight / 2,
        cartX + props.state.vx * vectorScale,
        cartY - cartHeight / 2 - props.state.vy * vectorScale,
        '#10b981',
        'v'
      );
    }

    // Acceleration Vector (Orange)
    if (props.state.a > 0.05) {
      drawArrow(
        ctx,
        cartX,
        cartY - cartHeight / 2,
        cartX + props.state.ax * vectorScale * 1.5,
        cartY - cartHeight / 2 - props.state.ay * vectorScale * 1.5,
        '#f59e0b',
        'a'
      );
    }
  }

  ctx.restore();

  animFrameId = requestAnimationFrame(render);
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

  ctx.font = 'bold 12px Vazirmatn, sans-serif';
  ctx.fillText(label, toX + 6, toY + 4);
}

defineExpose({
  getCanvas: () => canvasRef.value
});

onMounted(() => {
  if (canvasRef.value?.parentElement) {
    offsetY.value = canvasRef.value.parentElement.clientHeight / 2;
  }
  animFrameId = requestAnimationFrame(render);
});

onBeforeUnmount(() => {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
  }
});
</script>

<style scoped>
.canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-glass);
}

.simulation-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.canvas-hud {
  position: absolute;
  top: var(--space-3);
  inset-inline-end: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  z-index: 10;
  pointer-events: none;
}

.hud-stat-pill {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--surface-card);
  backdrop-filter: var(--glass-backdrop);
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
}

.hud-label {
  color: var(--text-muted);
}

.hud-val {
  color: var(--color-physics);
}

.hud-controls {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--surface-card);
  backdrop-filter: var(--glass-backdrop);
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  width: fit-content;
  margin-inline-start: auto;
}

.hud-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}

.btn-hud-icon {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  padding: 0.15rem 0.4rem;
  border-radius: var(--radius-sm);
  background: var(--surface-hover);
  transition: all var(--transition-fast);
}

.btn-hud-icon:hover {
  background: var(--surface-active);
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
