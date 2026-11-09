<template>
  <div class="canvas-wrapper">
    <canvas ref="canvasRef" class="simulation-canvas"></canvas>

    <!-- Top Floating Telemetry HUD -->
    <div class="canvas-hud">
      <div class="hud-stat-pill highlight-pill">
        <span class="hud-label">{{ $t('pressureDensity.measuredPressure') }}:</span>
        <span class="hud-val">{{ (state.measuredPressure / 1000).toFixed(2) }} kPa</span>
        <span class="hud-sub">({{ (state.measuredPressure / 101325).toFixed(3) }} atm)</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('pressureDensity.depth') }}:</span>
        <span class="hud-val">{{ state.depth.toFixed(2) }} m</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('pressureDensity.effectiveDensity') }}:</span>
        <span class="hud-val">{{ state.density.toFixed(1) }} kg/m³</span>
      </div>
      <div class="hud-controls">
        <button
          type="button"
          class="btn-hud-icon"
          :title="showVectors ? 'Hide Pressure Vectors' : 'Show Pressure Vectors'"
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
import type { FluidPressureState, FluidPressureParams } from '../model/fluidPressure';
import { useAppStore } from '@/app/store';

const props = defineProps<{
  state: FluidPressureState;
  params: FluidPressureParams;
  mode: 'ideal' | 'real';
}>();

const store = useAppStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const showVectors = ref(true);

let resizeObserver: ResizeObserver | null = null;
let animId: number | null = null;

function resetView() {
  render();
}

function getFluidColor(type: string): { fill: string; stroke: string; surface: string } {
  switch (type) {
    case 'gasoline':
      return {
        fill: 'rgba(250, 204, 21, 0.45)',
        stroke: '#eab308',
        surface: 'rgba(253, 224, 71, 0.8)',
      };
    case 'seawater':
      return {
        fill: 'rgba(14, 165, 233, 0.55)',
        stroke: '#0284c7',
        surface: 'rgba(56, 189, 248, 0.8)',
      };
    case 'honey':
      return {
        fill: 'rgba(217, 119, 6, 0.65)',
        stroke: '#b45309',
        surface: 'rgba(245, 158, 11, 0.85)',
      };
    case 'mercury':
      return {
        fill: 'rgba(148, 163, 184, 0.85)',
        stroke: '#64748b',
        surface: 'rgba(226, 232, 240, 0.95)',
      };
    case 'water':
    default:
      return {
        fill: 'rgba(56, 189, 248, 0.45)',
        stroke: '#0284c7',
        surface: 'rgba(125, 211, 252, 0.8)',
      };
  }
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

  // 1. Background
  ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  if (props.params.tankMode === 'u-tube') {
    renderUTube(ctx, w, h, isDark);
  } else {
    renderTank(ctx, w, h, isDark);
  }

  ctx.restore();
}

function renderTank(ctx: CanvasRenderingContext2D, w: number, h: number, isDark: boolean) {
  // Tank Dimensions
  const tankW = Math.min(380, w * 0.62);
  const tankH = Math.min(380, h * 0.68);
  const tankX = (w - tankW) / 2;
  const tankY = h - tankH - 45;

  const maxDepthMeters = 5.0;
  const scale = tankH / maxDepthMeters; // px per meter

  const fluidColors = getFluidColor(props.params.fluidType);

  // 1. Fluid Column Fill
  const fluidSurfaceY = tankY + 20; // 20px freeboard
  const fluidHeight = tankH - 20;

  ctx.fillStyle = fluidColors.fill;
  ctx.fillRect(tankX + 4, fluidSurfaceY, tankW - 8, fluidHeight - 4);

  // Fluid Surface Line with meniscus waves
  ctx.strokeStyle = fluidColors.surface;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tankX + 4, fluidSurfaceY);
  ctx.lineTo(tankX + tankW - 4, fluidSurfaceY);
  ctx.stroke();

  // 2. Glass Tank Walls & Lip
  ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(tankX, tankY);
  ctx.lineTo(tankX, tankY + tankH);
  ctx.lineTo(tankX + tankW, tankY + tankH);
  ctx.lineTo(tankX + tankW, tankY);
  ctx.stroke();

  // Glass highlight sheen
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tankX + 12, tankY + 10);
  ctx.lineTo(tankX + 12, tankY + tankH - 10);
  ctx.stroke();

  // 3. Depth Scale on Left Glass Wall
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  for (let d = 0; d <= maxDepthMeters; d += 0.5) {
    const tickY = fluidSurfaceY + d * scale;
    if (tickY <= tankY + tankH - 5) {
      ctx.beginPath();
      ctx.moveTo(tankX + 4, tickY);
      ctx.lineTo(tankX + (d % 1 === 0 ? 18 : 12), tickY);
      ctx.stroke();
      if (d % 1 === 0) {
        ctx.fillText(`${d}m`, tankX - 4, tickY + 3);
      }
    }
  }
  ctx.textAlign = 'start';

  // 4. Submersible Pressure Sensor Probe
  const probeY = fluidSurfaceY + props.state.depth * scale;
  const probeX = tankX + tankW * 0.55;
  const probeRadius = 14;

  // Signal Cable running up from probe to top boom
  ctx.strokeStyle = isDark ? '#cbd5e1' : '#334155';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(probeX, probeY - probeRadius);
  ctx.bezierCurveTo(probeX - 10, probeY - 50, probeX + 10, fluidSurfaceY - 30, probeX, fluidSurfaceY - 45);
  ctx.stroke();

  // Probe Body (Brass / Steel bell with diaphragm)
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(probeX, probeY, probeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Sensor diaphragm center
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(probeX, probeY, 5, 0, Math.PI * 2);
  ctx.fill();

  // 5. Isotropic Pressure Force Vectors (Inward pointing arrows around probe)
  if (showVectors.value) {
    const arrowLen = 18;
    const arrowDist = probeRadius + arrowLen;
    const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
    for (const ang of angles) {
      const fromX = probeX + arrowDist * Math.cos(ang);
      const fromY = probeY + arrowDist * Math.sin(ang);
      const toX = probeX + probeRadius * Math.cos(ang);
      const toY = probeY + probeRadius * Math.sin(ang);
      drawArrow(ctx, fromX, fromY, toX, toY, '#ef4444', 1.8);
    }
  }

  // 6. Live Reading Callout Tag right next to the probe
  const tagX = probeX + probeRadius + 22;
  const tagY = probeY - 12;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(tagX, tagY, 115, 30, 6);
  ctx.fill();
  ctx.stroke();

  // Pointer line from tag to probe
  ctx.strokeStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(tagX, tagY + 15);
  ctx.lineTo(probeX + probeRadius + 3, probeY);
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`${(props.state.measuredPressure / 1000).toFixed(1)} kPa`, tagX + 8, tagY + 19);
}

function renderUTube(ctx: CanvasRenderingContext2D, w: number, h: number, isDark: boolean) {
  const uW = 200;
  const uH = 260;
  const uX = (w - uW) / 2;
  const uY = (h - uH) / 2 + 20;
  const tubeDia = 36;

  // Glass U-tube outer path
  ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  // Left arm
  ctx.moveTo(uX, uY);
  ctx.lineTo(uX, uY + uH - tubeDia);
  ctx.arc(uX + uW / 2, uY + uH - tubeDia, uW / 2, Math.PI, 0, true);
  ctx.lineTo(uX + uW, uY);
  ctx.stroke();

  // Left fluid column
  const h1Px = Math.min(uH - 40, props.state.fluidColumnHeight1 * 400);
  const leftSurfaceY = uY + uH - tubeDia - h1Px;

  ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
  ctx.fillRect(uX + 3, leftSurfaceY, tubeDia - 6, h1Px + tubeDia / 2);

  // Right fluid column
  const h2Px = Math.min(uH - 40, props.state.fluidColumnHeight2 * 400);
  const rightSurfaceY = uY + uH - tubeDia - h2Px;

  ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
  ctx.fillRect(uX + uW - tubeDia + 3, rightSurfaceY, tubeDia - 6, h2Px + tubeDia / 2);

  // Datum balance line
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(uX - 20, uY + uH - tubeDia);
  ctx.lineTo(uX + uW + 20, uY + uH - tubeDia);
  ctx.stroke();
  ctx.setLineDash([]);

  // Delta h marker
  if (Math.abs(leftSurfaceY - rightSurfaceY) > 5) {
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    const markX = uX + uW / 2;
    ctx.beginPath();
    ctx.moveTo(markX, leftSurfaceY);
    ctx.lineTo(markX, rightSurfaceY);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Δh = ${(props.state.manometerDeltaH * 100).toFixed(1)} cm`, markX, (leftSurfaceY + rightSurfaceY) / 2 - 4);
    ctx.textAlign = 'start';
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  width: number
) {
  const headlen = 5;
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

  ctx.restore();
}

watch(
  () => [props.state.depth, props.state.measuredPressure],
  () => {
    render();
  }
);

watch(
  () => [
    props.params.tankMode,
    props.params.fluidType,
    props.params.includeAtmosphere,
    props.mode,
    store.theme,
    showVectors.value,
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

.hud-stat-pill.highlight-pill {
  border-color: #38bdf8;
  background: rgba(2, 132, 199, 0.35);
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
  color: #a855f7;
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
