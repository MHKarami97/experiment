<template>
  <div class="canvas-wrapper">
    <canvas ref="canvasRef" class="simulation-canvas"></canvas>

    <!-- Top Floating Telemetry HUD -->
    <div class="canvas-hud">
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('orbitalGravity.speed') }}:</span>
        <span class="hud-val">{{ (state.speed / 1000).toFixed(2) }} km/s</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('orbitalGravity.altitude') }}:</span>
        <span class="hud-val">{{ Math.max(0, (state.r - 6.371e6) / 1000).toFixed(0) }} km</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('orbitalGravity.orbitalPeriod') }}:</span>
        <span class="hud-val">{{ formatPeriod(state.period) }}</span>
      </div>
      <div class="hud-controls">
        <button
          type="button"
          class="btn-hud-icon"
          :title="showVectors ? 'Hide Vectors' : 'Show Vectors'"
          :class="{ active: showVectors }"
          @click="showVectors = !showVectors"
        >
          ➔
        </button>
        <button
          type="button"
          class="btn-hud-icon"
          :title="showApsides ? 'Hide Apsides' : 'Show Apsides'"
          :class="{ active: showApsides }"
          @click="showApsides = !showApsides"
        >
          🎯
        </button>
        <button
          type="button"
          class="btn-hud-icon"
          title="Zoom In"
          @click="zoom(1.2)"
        >
          +
        </button>
        <button
          type="button"
          class="btn-hud-icon"
          title="Zoom Out"
          @click="zoom(0.8)"
        >
          −
        </button>
        <button
          type="button"
          class="btn-hud-icon"
          title="Reset View"
          @click="resetView"
        >
          🔍
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { OrbitState, OrbitParams } from '../model/orbital';
import { useAppStore } from '@/app/store';

const props = defineProps<{
  state: OrbitState;
  params: OrbitParams;
  mode: 'ideal' | 'real';
}>();

const store = useAppStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);

const showVectors = ref(true);
const showApsides = ref(true);

const EARTH_RADIUS = 6.371e6; // meters
let animId: number | null = null;
let resizeObserver: ResizeObserver | null = null;

// View transform: pan & scale (pixels per meter)
const scale = ref(1e-5); // will be auto-calculated to fit orbit
const panX = ref(0);
const panY = ref(0);

// Interaction dragging
let isDragging = false;
let startDragX = 0;
let startDragY = 0;

// Trajectory history trail
const trail = ref<{ x: number; y: number }[]>([]);
const maxTrail = 300;

function formatPeriod(seconds: number): string {
  if (seconds < 3600) {
    return `${(seconds / 60).toFixed(1)} min`;
  }
  const hours = seconds / 3600;
  return `${hours.toFixed(2)} h`;
}

function zoom(factor: number) {
  scale.value = Math.max(1e-7, Math.min(1e-3, scale.value * factor));
  render();
}

function autoFitScale() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const apoapsis = props.params.semiMajorAxis * (1 + props.params.eccentricity);
  const minDim = Math.min(rect.width, rect.height) || 400;
  // Fit 2.4 * apoapsis inside minDim
  scale.value = (minDim * 0.42) / (apoapsis || 1e7);
  panX.value = 0;
  panY.value = 0;
}

function resetView() {
  trail.value = [];
  autoFitScale();
  render();
}

function handlePointerDown(e: MouseEvent | TouchEvent) {
  isDragging = true;
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  startDragX = clientX - panX.value;
  startDragY = clientY - panY.value;
}

function handlePointerMove(e: MouseEvent | TouchEvent) {
  if (!isDragging) return;
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  panX.value = clientX - startDragX;
  panY.value = clientY - startDragY;
  render();
}

function handlePointerUp() {
  isDragging = false;
}

function handleWheel(e: WheelEvent) {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
  zoom(zoomFactor);
}

function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const isDark = store.theme === 'dark';

  // 1. Deep Space Background
  ctx.fillStyle = isDark ? '#080c16' : '#f0f4fa';
  ctx.fillRect(0, 0, w, h);

  // Background stars for space realism
  if (isDark) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    const seed = 42;
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137.5 + seed * 19) % w);
      const sy = ((i * 243.7 + seed * 37) % h);
      const sr = (i % 3 === 0) ? 1.5 : 0.8;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // World Origin: Center of primary body
  const originX = w / 2 + panX.value;
  const originY = h / 2 + panY.value;
  const sc = scale.value;

  // 2. Draw Distance Coordinate Grid Rings
  const ringStep = props.params.semiMajorAxis > 2e7 ? 1e7 : 5e6;
  ctx.lineWidth = 1;
  for (let rDist = ringStep; rDist <= props.params.semiMajorAxis * 2.5; rDist += ringStep) {
    const pxR = rDist * sc;
    if (pxR > 10 && pxR < Math.max(w, h)) {
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)';
      ctx.beginPath();
      ctx.arc(originX, originY, pxR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.3)';
      ctx.font = '10px monospace';
      ctx.fillText(`${(rDist / 1000).toLocaleString()} km`, originX + pxR + 4, originY - 4);
    }
  }

  // 3. Draw Orbit Ellipse Path
  const a = props.params.semiMajorAxis;
  const e = props.params.eccentricity;
  const b = a * Math.sqrt(Math.max(0.001, 1 - e * e));
  const c = a * e; // Distance from center of ellipse to primary focus at (0, 0)

  // Ellipse center in screen coordinates (primary is at (originX, originY), periapsis at +X)
  // For standard orientation with periapsis on +X:
  // r(theta=0) = a*(1-e) on +X. Ellipse center is at x = -c from primary.
  const ellipseCenterX = originX - c * sc;
  const ellipseCenterY = originY;

  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.5)' : 'rgba(2, 132, 199, 0.6)';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.ellipse(ellipseCenterX, ellipseCenterY, a * sc, b * sc, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4. Line of Apsides & Markers (Apoapsis & Periapsis)
  if (showApsides.value) {
    const periX = originX + a * (1 - e) * sc;
    const apoX = originX - a * (1 + e) * sc;

    // Line of apsides
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(apoX - 15, originY);
    ctx.lineTo(periX + 15, originY);
    ctx.stroke();

    // Periapsis marker (P)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(periX, originY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('Periapsis (P)', periX + 8, originY - 8);

    // Apoapsis marker (A)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(apoX, originY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('Apoapsis (A)', apoX - 80, originY - 8);
  }

  // 5. Draw Central Planet (Earth)
  const earthScreenRadius = Math.max(6, EARTH_RADIUS * sc);
  const planetGrad = ctx.createRadialGradient(
    originX - earthScreenRadius * 0.3,
    originY - earthScreenRadius * 0.3,
    earthScreenRadius * 0.1,
    originX,
    originY,
    earthScreenRadius
  );
  planetGrad.addColorStop(0, '#60a5fa');
  planetGrad.addColorStop(0.6, '#2563eb');
  planetGrad.addColorStop(0.9, '#1d4ed8');
  planetGrad.addColorStop(1, '#1e3a8a');

  // Atmosphere Glow
  const glowGrad = ctx.createRadialGradient(
    originX, originY, earthScreenRadius * 0.9,
    originX, originY, earthScreenRadius * 1.35
  );
  glowGrad.addColorStop(0, 'rgba(96, 165, 250, 0.35)');
  glowGrad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(originX, originY, earthScreenRadius * 1.35, 0, Math.PI * 2);
  ctx.fill();

  // Planet body
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(originX, originY, earthScreenRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⊕', originX, originY + 4);
  ctx.textAlign = 'start';

  // 6. Draw Trajectory Trail
  if (trail.value.length > 1) {
    ctx.lineWidth = 2.5;
    for (let i = 1; i < trail.value.length; i++) {
      const alpha = i / trail.value.length;
      ctx.strokeStyle = isDark
        ? `rgba(245, 158, 11, ${alpha * 0.8})`
        : `rgba(217, 119, 6, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.moveTo(originX + trail.value[i - 1].x * sc, originY + trail.value[i - 1].y * sc);
      ctx.lineTo(originX + trail.value[i].x * sc, originY + trail.value[i].y * sc);
      ctx.stroke();
    }
  }

  // 7. Satellite / Spacecraft Position
  const satX = originX + props.state.x * sc;
  const satY = originY + props.state.y * sc;

  // Vectors
  if (showVectors.value) {
    // 7a. Velocity Vector (Green)
    const velScale = 0.005; // px per m/s
    const vxPix = props.state.vx * velScale;
    const vyPix = props.state.vy * velScale;
    drawArrow(ctx, satX, satY, satX + vxPix, satY + vyPix, '#22c55e', 2, 'v');

    // 7b. Gravitational Force Vector (Red/Amber pointing to Earth center)
    const gravDirX = originX - satX;
    const gravDirY = originY - satY;
    const gravDist = Math.hypot(gravDirX, gravDirY) || 1;
    const gravLen = 45; // fixed visible arrow length
    const fGx = satX + (gravDirX / gravDist) * gravLen;
    const fGy = satY + (gravDirY / gravDist) * gravLen;
    drawArrow(ctx, satX, satY, fGx, fGy, '#f43f5e', 2, 'Fg');
  }

  // Satellite Body (gold core with cyan solar panels)
  ctx.save();
  ctx.translate(satX, satY);
  // Orient with velocity direction
  const angle = Math.atan2(props.state.vy, props.state.vx);
  ctx.rotate(angle);

  // Solar panels
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(-3, -11, 6, 6);
  ctx.fillRect(-3, 5, 6, 6);

  // Spacecraft bus
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Glow beacon
  ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();

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
  width: number,
  label?: string
) {
  const headlen = 8;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headlen * Math.cos(angle - Math.PI / 6),
    toY - headlen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - headlen * Math.cos(angle + Math.PI / 6),
    toY - headlen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();

  if (label) {
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(label, toX + 6, toY - 4);
  }

  ctx.restore();
}

watch(
  () => props.state.t,
  () => {
    trail.value.push({ x: props.state.x, y: props.state.y });
    if (trail.value.length > maxTrail) {
      trail.value.shift();
    }
    render();
  }
);

watch(
  () => [props.params.semiMajorAxis, props.params.eccentricity],
  () => {
    autoFitScale();
    trail.value = [];
    render();
  }
);

watch(() => [props.mode, store.theme, showVectors.value, showApsides.value], () => {
  render();
});

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  canvas.addEventListener('mousedown', handlePointerDown);
  window.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('mouseup', handlePointerUp);

  canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
  window.addEventListener('touchmove', handlePointerMove, { passive: true });
  window.addEventListener('touchend', handlePointerUp);

  canvas.addEventListener('wheel', handleWheel, { passive: false });

  resizeObserver = new ResizeObserver(() => {
    autoFitScale();
    render();
  });
  resizeObserver.observe(canvas);

  autoFitScale();
  render();
});

onBeforeUnmount(() => {
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.removeEventListener('mousedown', handlePointerDown);
    canvas.removeEventListener('touchstart', handlePointerDown);
    canvas.removeEventListener('wheel', handleWheel);
  }
  window.removeEventListener('mousemove', handlePointerMove);
  window.removeEventListener('mouseup', handlePointerUp);
  window.removeEventListener('touchmove', handlePointerMove);
  window.removeEventListener('touchend', handlePointerUp);

  if (resizeObserver) resizeObserver.disconnect();
  if (animId) cancelAnimationFrame(animId);
});

defineExpose({
  getCanvas: () => canvasRef.value,
});
</script>

<style scoped>
.canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;
  background-color: var(--color-surface, #0f172a);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  display: flex;
  cursor: grab;
}

.canvas-wrapper:active {
  cursor: grabbing;
}

.simulation-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.canvas-hud {
  position: absolute;
  top: 12px;
  inset-inline-start: 12px;
  inset-inline-end: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  pointer-events: none;
}

.hud-stat-pill {
  pointer-events: auto;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 4px 10px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #e2e8f0;
}

.hud-label {
  color: #94a3b8;
}

.hud-val {
  font-weight: 600;
  font-family: monospace;
  color: #38bdf8;
}

.hud-controls {
  pointer-events: auto;
  margin-inline-start: auto;
  display: flex;
  gap: 6px;
}

.btn-hud-icon {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f1f5f9;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-hud-icon:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: #38bdf8;
}

.btn-hud-icon.active {
  background: #0284c7;
  border-color: #38bdf8;
  color: #ffffff;
}
</style>
