<template>
  <div class="canvas-wrapper">
    <canvas ref="canvasRef" class="simulation-canvas"></canvas>

    <!-- Top Floating Telemetry HUD -->
    <div class="canvas-hud">
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('workPower.displacement') }}:</span>
        <span class="hud-val">{{ state.x.toFixed(2) }} m</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('workPower.speed') }}:</span>
        <span class="hud-val">{{ state.v.toFixed(2) }} m/s</span>
      </div>
      <div class="hud-stat-pill highlight-pill">
        <span class="hud-label">{{ $t('workPower.workNet') }}:</span>
        <span class="hud-val">{{ state.workNet.toFixed(1) }} J</span>
        <span class="hud-sub">(= ΔK)</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('workPower.instantPower') }}:</span>
        <span class="hud-val">{{ state.instantaneousPower.toFixed(1) }} W</span>
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
          :title="showForcePlot ? 'Hide F(x) Graph' : 'Show F(x) Graph'"
          :class="{ active: showForcePlot }"
          @click="showForcePlot = !showForcePlot"
        >
          📈
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
import type { WorkPowerState, WorkPowerParams } from '../model/workPower';
import { useAppStore } from '@/app/store';

const props = defineProps<{
  state: WorkPowerState;
  params: WorkPowerParams;
  mode: 'ideal' | 'real';
}>();

const store = useAppStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);

const showVectors = ref(true);
const showForcePlot = ref(true);

let resizeObserver: ResizeObserver | null = null;
let animId: number | null = null;

// History of F(x) data points for the mini work integral area
const forceHistory = ref<{ x: number; f: number }[]>([]);

function resetView() {
  forceHistory.value = [];
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

  // 1. Background
  ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  // Floor plane
  const floorY = h - 90;
  ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
  ctx.fillRect(0, floorY, w, 90);

  // Floor surface line
  ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(w, floorY);
  ctx.stroke();

  // Metre scale ticks on floor
  const originX = 60;
  const scale = 55; // 55 px per meter
  ctx.fillStyle = isDark ? '#64748b' : '#64748b';
  ctx.font = '10px monospace';
  for (let meter = 0; meter <= 12; meter++) {
    const tickX = originX + meter * scale;
    if (tickX < w) {
      ctx.beginPath();
      ctx.moveTo(tickX, floorY);
      ctx.lineTo(tickX, floorY + (meter % 5 === 0 ? 12 : 6));
      ctx.stroke();
      if (meter % 2 === 0) {
        ctx.fillText(`${meter}m`, tickX - 8, floorY + 24);
      }
    }
  }

  // 2. Crate Dimensions & Screen Position
  const crateW = 56;
  const crateH = 48;
  const crateScreenX = originX + props.state.x * scale;
  const crateScreenY = floorY - crateH;

  // Pulling cable & winch motor
  const thetaRad = (props.params.forceAngle * Math.PI) / 180;
  const cableLen = 140;
  const cableEndX = crateScreenX + crateW + cableLen * Math.cos(thetaRad);
  const cableEndY = crateScreenY + crateH / 2 - cableLen * Math.sin(thetaRad);

  // Winch mount post
  ctx.strokeStyle = isDark ? '#64748b' : '#475569';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cableEndX, floorY);
  ctx.lineTo(cableEndX, cableEndY);
  ctx.stroke();

  // Winch motor drum
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(cableEndX, cableEndY, 12, 0, Math.PI * 2);
  ctx.fill();

  // Pulling Cable Line
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(crateScreenX + crateW, crateScreenY + crateH / 2);
  ctx.lineTo(cableEndX, cableEndY);
  ctx.stroke();

  // 3. Sliding Crate
  // Crate body with wood / metallic texture
  ctx.fillStyle = isDark ? '#334155' : '#d97706';
  ctx.fillRect(crateScreenX, crateScreenY, crateW, crateH);
  ctx.strokeStyle = isDark ? '#64748b' : '#b45309';
  ctx.lineWidth = 2;
  ctx.strokeRect(crateScreenX, crateScreenY, crateW, crateH);

  // Cross brace on crate
  ctx.beginPath();
  ctx.moveTo(crateScreenX, crateScreenY);
  ctx.lineTo(crateScreenX + crateW, crateScreenY + crateH);
  ctx.moveTo(crateScreenX + crateW, crateScreenY);
  ctx.lineTo(crateScreenX, crateScreenY + crateH);
  ctx.stroke();

  // Mass label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${props.params.payloadMass} kg`, crateScreenX + crateW / 2, crateScreenY + crateH / 2 + 4);
  ctx.textAlign = 'start';

  // 4. Force Vectors & FBD
  if (showVectors.value) {
    const cx = crateScreenX + crateW / 2;
    const cy = crateScreenY + crateH / 2;

    // 4a. Applied Force Vector F (Cyan)
    const fArrowLen = Math.min(65, (props.state.appliedForce / 300) * 65 + 15);
    const fxEnd = crateScreenX + crateW + fArrowLen * Math.cos(thetaRad);
    const fyEnd = cy - fArrowLen * Math.sin(thetaRad);
    drawArrow(ctx, crateScreenX + crateW, cy, fxEnd, fyEnd, '#38bdf8', 2.5, `F = ${props.state.appliedForce.toFixed(0)}N`);

    // Force Angle Arc
    if (props.params.forceAngle > 0) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(crateScreenX + crateW, cy, 26, -thetaRad, 0);
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${props.params.forceAngle}°`, crateScreenX + crateW + 30, cy - 6);
    }

    // 4b. Friction Force Vector f_k (Amber pointing left)
    if (props.state.frictionForce > 0.1) {
      const fFricLen = Math.min(45, (props.state.frictionForce / 100) * 45 + 10);
      drawArrow(ctx, crateScreenX, floorY - 3, crateScreenX - fFricLen, floorY - 3, '#f59e0b', 2, `f = ${props.state.frictionForce.toFixed(0)}N`);
    }

    // 4c. Velocity Vector v (Green)
    if (props.state.v > 0.05) {
      const vLen = Math.min(50, props.state.v * 10);
      drawArrow(ctx, cx, crateScreenY - 10, cx + vLen, crateScreenY - 10, '#22c55e', 2.5, 'v');
    }
  }

  // 5. Mini F(x) Work Integral Plot (Top-right inset)
  if (showForcePlot.value) {
    drawWorkIntegralGraph(ctx, w - 210, 60, forceHistory.value, props.state.workApplied);
  }

  ctx.restore();
}

function drawWorkIntegralGraph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  history: { x: number; f: number }[],
  totalWork: number
) {
  const gw = 190;
  const gh = 135;

  // Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, gw, gh, 8);
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('W = ∫ F(x) dx (Work Area)', x + 10, y + 18);

  const plotX = x + 30;
  const plotY = y + 30;
  const plotW = gw - 40;
  const plotH = gh - 55;
  const baseLineY = plotY + plotH;

  // Axes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY);
  ctx.lineTo(plotX, baseLineY);
  ctx.lineTo(plotX + plotW, baseLineY);
  ctx.stroke();

  // Labels
  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px monospace';
  ctx.fillText('F (N)', plotX - 24, plotY + 10);
  ctx.fillText('x (m)', plotX + plotW - 15, baseLineY + 12);

  if (history.length > 1) {
    const maxHistX = Math.max(2.0, history[history.length - 1].x);
    const maxHistF = 250;

    // Shaded Area under F(x) curve
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.moveTo(plotX, baseLineY);
    for (const pt of history) {
      const px = plotX + (pt.x / maxHistX) * plotW;
      const py = baseLineY - (pt.f / maxHistF) * plotH;
      ctx.lineTo(px, py);
    }
    const lastPx = plotX + (history[history.length - 1].x / maxHistX) * plotW;
    ctx.lineTo(lastPx, baseLineY);
    ctx.closePath();
    ctx.fill();

    // Curve stroke
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let first = true;
    for (const pt of history) {
      const px = plotX + (pt.x / maxHistX) * plotW;
      const py = baseLineY - (pt.f / maxHistF) * plotH;
      if (first) {
        ctx.moveTo(px, py);
        first = false;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

  // Live Work Sum value
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 10px monospace';
  ctx.fillText(`Area = ${totalWork.toFixed(0)} J`, x + 10, gh + y - 8);
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
  () => [props.state.x, props.state.v],
  () => {
    // Record F(x) history for the mini integral plot
    if (forceHistory.value.length === 0 || props.state.x - forceHistory.value[forceHistory.value.length - 1].x > 0.05) {
      forceHistory.value.push({ x: props.state.x, f: props.state.appliedForce });
      if (forceHistory.value.length > 200) {
        forceHistory.value.shift();
      }
    }
    render();
  }
);

watch(
  () => [
    props.params.forceProfile,
    props.params.appliedForceMax,
    props.params.forceAngle,
    props.params.payloadMass,
    props.mode,
    store.theme,
    showVectors.value,
    showForcePlot.value,
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
  color: #10b981;
  font-family: monospace;
  font-weight: 600;
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
