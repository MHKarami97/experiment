<template>
  <div class="canvas-wrapper">
    <canvas ref="canvasRef" class="simulation-canvas"></canvas>

    <!-- Top Floating Telemetry HUD -->
    <div class="canvas-hud">
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('skatePark.speed') }}:</span>
        <span class="hud-val">{{ state.speed.toFixed(2) }} m/s</span>
        <span class="hud-sub">({{ (state.speed * 3.6).toFixed(1) }} km/h)</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('skatePark.height') }}:</span>
        <span class="hud-val">{{ state.y.toFixed(2) }} m</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('skatePark.totalEnergy') }}:</span>
        <span class="hud-val">{{ state.totalEnergy.toFixed(0) }} J</span>
      </div>
      <div class="hud-controls">
        <button
          type="button"
          class="btn-hud-icon"
          :title="showBarChart ? 'Hide Bar Chart' : 'Show Bar Chart'"
          :class="{ active: showBarChart }"
          @click="showBarChart = !showBarChart"
        >
          📊
        </button>
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
import type { SkateParkState, SkateParkParams } from '../model/skatePark';
import { getTrackGeometry } from '../model/skatePark';
import { useAppStore } from '@/app/store';

const props = defineProps<{
  state: SkateParkState;
  params: SkateParkParams;
  mode: 'ideal' | 'real';
}>();

const store = useAppStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);

const showVectors = ref(true);
const showBarChart = ref(true);

let resizeObserver: ResizeObserver | null = null;
let animId: number | null = null;

function resetView() {
  render();
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

  // 1. Sky & Park Background
  ctx.fillStyle = isDark ? '#0f172a' : '#f0fdf4';
  ctx.fillRect(0, 0, w, h);

  // Ground plane
  const groundY = h - 60;
  const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
  groundGrad.addColorStop(0, isDark ? '#1e293b' : '#bbf7d0');
  groundGrad.addColorStop(1, isDark ? '#0b1120' : '#86efac');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, groundY, w, 60);

  // Ground line
  ctx.strokeStyle = isDark ? '#334155' : '#4ade80';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();

  // World to screen mapping:
  // Center x=0 near canvas middle
  const originX = w * 0.48;
  // Datum y=0 aligns with groundY
  const originY = groundY;
  const scale = 58; // pixels per meter

  const toScreenX = (x: number) => originX + x * scale;
  const toScreenY = (y: number) => originY - y * scale;

  // 2. Draw Track Profile
  const xMin = (0 - originX) / scale - 0.5;
  const xMax = (w - originX) / scale + 0.5;
  const step = 0.05;

  // Track support fill
  ctx.beginPath();
  let firstPt = true;
  for (let x = xMin; x <= xMax; x += step) {
    const geom = getTrackGeometry(x, props.params.trackShape);
    const sx = toScreenX(x);
    const sy = toScreenY(geom.y);
    if (firstPt) {
      ctx.moveTo(sx, sy);
      firstPt = false;
    } else {
      ctx.lineTo(sx, sy);
    }
  }
  ctx.lineTo(toScreenX(xMax), groundY);
  ctx.lineTo(toScreenX(xMin), groundY);
  ctx.closePath();
  ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(220, 252, 231, 0.6)';
  ctx.fill();

  // Track rail extrusion
  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  firstPt = true;
  for (let x = xMin; x <= xMax; x += step) {
    const geom = getTrackGeometry(x, props.params.trackShape);
    const sx = toScreenX(x);
    const sy = toScreenY(geom.y);
    if (firstPt) {
      ctx.moveTo(sx, sy);
      firstPt = false;
    } else {
      ctx.lineTo(sx, sy);
    }
  }
  ctx.stroke();

  // 3. Draw Skater
  const sx = toScreenX(props.state.x);
  const sy = toScreenY(props.state.y);
  const geom = getTrackGeometry(props.state.x, props.params.trackShape);

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(-geom.theta); // Align with track tangent

  // Skateboard Deck
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-18, -6, 36, 4);

  // Wheels
  ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
  ctx.beginPath();
  ctx.arc(-11, -2, 3, 0, Math.PI * 2);
  ctx.arc(11, -2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Skater Body (Stylized Figure)
  // Legs
  ctx.strokeStyle = isDark ? '#93c5fd' : '#1d4ed8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(-4, -20);
  ctx.lineTo(0, -28);
  ctx.moveTo(6, -6);
  ctx.lineTo(4, -20);
  ctx.lineTo(0, -28);
  ctx.stroke();

  // Torso
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(props.state.vTangential > 0 ? 3 : -3, -44);
  ctx.stroke();

  // Head with helmet
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(props.state.vTangential > 0 ? 5 : -5, -49, 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 4. Force & Velocity Vectors
  if (showVectors.value) {
    // Velocity vector (Green)
    if (props.state.speed > 0.1) {
      const vScale = 4.5;
      const vScreenX = sx + props.state.vx * vScale;
      const vyWorld = props.state.vx * geom.slope;
      const vScreenY = sy - vyWorld * vScale;
      drawArrow(ctx, sx, sy - 24, vScreenX, vScreenY - 24, '#22c55e', 2.5, 'v');
    }

    // Gravity vector (Red pointing straight down)
    drawArrow(ctx, sx, sy - 24, sx, sy + 25, '#ef4444', 2, 'mg');
  }

  // 5. Live Energy Bar Chart HUD (Top-right corner)
  if (showBarChart.value) {
    drawEnergyBars(ctx, w - 170, 60, props.state);
  }

  ctx.restore();
}

function drawEnergyBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: SkateParkState
) {
  const chartW = 150;
  const chartH = 130;

  // Background panel
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, chartW, chartH, 8);
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('Energy (Joules)', x + 10, y + 18);

  const maxE = Math.max(100, state.totalEnergy);
  const barMaxH = 75;
  const colW = 24;
  const gap = 10;
  const baseY = y + 105;

  // Bar 1: Kinetic Energy (KE - Green)
  const keH = (state.kineticEnergy / maxE) * barMaxH;
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x + 12, baseY - keH, colW, keH);

  // Bar 2: Potential Energy (PE - Blue)
  const peH = (state.potentialEnergy / maxE) * barMaxH;
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x + 12 + colW + gap, baseY - peH, colW, peH);

  // Bar 3: Thermal Energy (Thermal - Orange)
  const thH = (state.thermalEnergy / maxE) * barMaxH;
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x + 12 + (colW + gap) * 2, baseY - thH, colW, thH);

  // Bar 4: Total Energy (Total - Yellow)
  const totH = (state.totalEnergy / maxE) * barMaxH;
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x + 12 + (colW + gap) * 3, baseY - totH, colW, totH);

  // Labels under bars
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('KE', x + 12 + colW / 2, baseY + 14);
  ctx.fillText('PE', x + 12 + colW + gap + colW / 2, baseY + 14);
  ctx.fillText('Th', x + 12 + (colW + gap) * 2 + colW / 2, baseY + 14);
  ctx.fillText('Tot', x + 12 + (colW + gap) * 3 + colW / 2, baseY + 14);
  ctx.textAlign = 'start';
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
  () => [props.state.x, props.state.y, props.state.speed],
  () => {
    render();
  }
);

watch(
  () => [
    props.params.trackShape,
    props.params.skaterMass,
    props.params.gravity,
    props.mode,
    store.theme,
    showVectors.value,
    showBarChart.value,
  ],
  () => {
    render();
  }
);

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  resizeObserver = new ResizeObserver(() => {
    render();
  });
  resizeObserver.observe(canvas);

  render();
});

onBeforeUnmount(() => {
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
  background: rgba(15, 23, 42, 0.78);
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

.hud-sub {
  font-size: 0.75rem;
  color: #22c55e;
  font-family: monospace;
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
