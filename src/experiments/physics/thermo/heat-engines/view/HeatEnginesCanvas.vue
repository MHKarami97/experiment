<template>
  <div class="canvas-container" ref="containerRef">
    <canvas ref="canvasRef"></canvas>

    <!-- Top Overlay HUD -->
    <div class="hud-overlay">
      <div class="hud-badge stroke-badge">
        <span class="stroke-dot" :class="{ 'pulse-active': isRunning }"></span>
        <span class="stroke-text">{{ currentStrokeDescription }}</span>
      </div>

      <div class="hud-controls">
        <button
          class="view-toggle-btn"
          :class="{ active: activeDiagram === 'pv' }"
          @click="activeDiagram = 'pv'"
          title="Pressure-Volume Diagram"
        >
          PV
        </button>
        <button
          class="view-toggle-btn"
          :class="{ active: activeDiagram === 'ts' }"
          @click="activeDiagram = 'ts'"
          title="Temperature-Entropy Diagram"
        >
          TS
        </button>
      </div>
    </div>

    <!-- Bottom Readout Bar -->
    <div class="bottom-metrics-bar">
      <div class="metric-item">
        <span class="metric-label">P:</span>
        <span class="metric-value ltr-island">{{ (instantState.pressure / 1000).toFixed(1) }} kPa</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">V:</span>
        <span class="metric-value ltr-island">{{ (instantState.volume * 1000).toFixed(2) }} L</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">T:</span>
        <span class="metric-value ltr-island">{{ instantState.temperature.toFixed(0) }} K</span>
      </div>
      <div class="metric-item highlight">
        <span class="metric-label">η:</span>
        <span class="metric-value ltr-island">{{ (currentEfficiency * 100).toFixed(1) }}%</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">W:</span>
        <span class="metric-value ltr-island">{{ currentWork.toFixed(1) }} J</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CycleMetrics, InstantaneousState, EngineParams } from '../model/heat-engines';
import { generateCycleCurvePoints } from '../model/heat-engines';

const props = defineProps<{
  metrics: CycleMetrics;
  instantState: InstantaneousState;
  params: EngineParams;
  isRunning: boolean;
  isDark: boolean;
}>();

const { t } = useI18n();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const activeDiagram = ref<'pv' | 'ts'>('pv');

let animationFrameId: number | null = null;

const currentStrokeDescription = computed(() => {
  const cType = props.params.cycleType;
  const sIdx = props.instantState.strokeIndex;
  const key = `heatEngines.${cType}_stroke${sIdx}`;
  return t(key);
});

const currentEfficiency = computed(() => {
  return props.params.realMode
    ? props.metrics.thermalEfficiencyReal
    : props.metrics.thermalEfficiencyIdeal;
});

const currentWork = computed(() => {
  return props.params.realMode
    ? props.metrics.workNetReal
    : props.metrics.workNetIdeal;
});

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(dpr, dpr);

  const isDark = props.isDark;
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';

  // Layout: split into two viewports
  // If wide screen: Left = Engine Mechanism, Right = Diagram
  // If tall screen (mobile): Top = Engine Mechanism, Bottom = Diagram
  const isSplitHorizontal = width >= 680;

  if (isSplitHorizontal) {
    const leftW = Math.floor(width * 0.44);
    const rightW = width - leftW;

    // Viewport 1: Engine Mechanical Cylinder
    drawEngineMechanism(ctx, 0, 0, leftW, height, isDark, textColor);

    // Vertical Divider
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftW, 16);
    ctx.lineTo(leftW, height - 16);
    ctx.stroke();

    // Viewport 2: PV / TS Diagram
    drawIndicatorDiagram(ctx, leftW, 0, rightW, height, isDark, textColor, textMuted, gridColor);
  } else {
    const topH = Math.floor(height * 0.46);
    const bottomH = height - topH;

    drawEngineMechanism(ctx, 0, 0, width, topH, isDark, textColor);

    // Horizontal Divider
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, topH);
    ctx.lineTo(width - 16, topH);
    ctx.stroke();

    drawIndicatorDiagram(ctx, 0, topH, width, bottomH, isDark, textColor, textMuted, gridColor);
  }

  ctx.restore();
}

/**
 * Draws the reciprocating engine piston, connecting rod, flywheel crankshaft,
 * and live thermodynamic gas glow in the cylinder chamber.
 */
function drawEngineMechanism(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isDark: boolean,
  textColor: string
) {
  ctx.save();
  ctx.translate(x, y);

  const cx = w / 2;
  const cylinderW = Math.min(w * 0.52, 120);
  const cylinderTop = 32;
  const cylinderStrokeLen = Math.min(h * 0.20, 65);
  const cylinderH = cylinderStrokeLen + 50;

  const pistonH = 24;
  const normPos = props.instantState.pistonPosition; // 0 = TDC (top), 1 = BDC (bottom)
  const pistonY = cylinderTop + 18 + normPos * cylinderStrokeLen;

  // 1. Draw Gas Chamber background with temperature-dependent glow
  const chamberH = pistonY - cylinderTop;
  const temp = props.instantState.temperature;
  const flame = props.instantState.flameIntensity;

  // Temperature color interpolation:
  // Cool (300K) -> Blueish
  // Warm (600K) -> Amber
  // Hot (1200K+) -> Fiery Red-Orange
  let gasR = 59;
  let gasG = 130;
  let gasB = 246;
  let gasAlpha = 0.25;

  if (temp > 350) {
    const tNorm = Math.min(1, (temp - 350) / 850);
    gasR = Math.round(59 + tNorm * (245 - 59));
    gasG = Math.round(130 + tNorm * (90 - 130));
    gasB = Math.round(246 + tNorm * (20 - 246));
    gasAlpha = 0.3 + tNorm * 0.45;
  }

  if (flame > 0.1) {
    // High combustion intensity
    gasR = 255;
    gasG = Math.round(140 - flame * 40);
    gasB = 20;
    gasAlpha = Math.min(0.9, 0.4 + flame * 0.5);
  }

  // Draw gas fill inside cylinder
  const gasGrad = ctx.createLinearGradient(cx - cylinderW / 2, cylinderTop, cx - cylinderW / 2, pistonY);
  gasGrad.addColorStop(0, `rgba(${gasR}, ${gasG}, ${gasB}, ${gasAlpha * 1.1})`);
  gasGrad.addColorStop(1, `rgba(${gasR}, ${gasG}, ${gasB}, ${gasAlpha * 0.65})`);
  ctx.fillStyle = gasGrad;
  ctx.fillRect(cx - cylinderW / 2 + 5, cylinderTop + 6, cylinderW - 10, chamberH - 6);

  // Spark / Combustion Flame Effect
  if (flame > 0.05) {
    ctx.save();
    const flameGrad = ctx.createRadialGradient(cx, cylinderTop + 14, 2, cx, cylinderTop + 28, cylinderW * 0.45);
    flameGrad.addColorStop(0, `rgba(255, 255, 220, ${flame})`);
    flameGrad.addColorStop(0.4, `rgba(255, 160, 20, ${flame * 0.85})`);
    flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cylinderTop + 22, cylinderW * 0.42, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Exhaust puff if active
  if (props.instantState.exhaustActive) {
    ctx.save();
    ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.35)';
    ctx.beginPath();
    ctx.arc(cx + cylinderW / 2 + 18, cylinderTop + 12, 10, 0, Math.PI * 2);
    ctx.arc(cx + cylinderW / 2 + 32, cylinderTop + 8, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. Draw Cylinder Steel Wall & Bore
  ctx.strokeStyle = isDark ? '#64748b' : '#475569';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Left wall
  ctx.beginPath();
  ctx.moveTo(cx - cylinderW / 2, cylinderTop);
  ctx.lineTo(cx - cylinderW / 2, cylinderTop + cylinderH);
  ctx.stroke();

  // Right wall
  ctx.beginPath();
  ctx.moveTo(cx + cylinderW / 2, cylinderTop);
  ctx.lineTo(cx + cylinderW / 2, cylinderTop + cylinderH);
  ctx.stroke();

  // Cylinder Head (Top closure)
  ctx.beginPath();
  ctx.moveTo(cx - cylinderW / 2 - 4, cylinderTop);
  ctx.lineTo(cx + cylinderW / 2 + 4, cylinderTop);
  ctx.stroke();

  // Cylinder cooling fins on exterior
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.35)';
  const finCount = 5;
  for (let i = 0; i < finCount; i++) {
    const finY = cylinderTop + 16 + i * 14;
    // Left fin
    ctx.beginPath();
    ctx.moveTo(cx - cylinderW / 2, finY);
    ctx.lineTo(cx - cylinderW / 2 - 12, finY);
    ctx.stroke();
    // Right fin
    ctx.beginPath();
    ctx.moveTo(cx + cylinderW / 2, finY);
    ctx.lineTo(cx + cylinderW / 2 + 12, finY);
    ctx.stroke();
  }

  // Spark Plug / Fuel Injector at top center
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.fillRect(cx - 7, cylinderTop - 15, 14, 15);
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(cx, cylinderTop - 15, 4, 0, Math.PI * 2);
  ctx.fill();

  // 3. Crankshaft Flywheel & Crankpin
  const crankY = cylinderTop + cylinderH + 42;
  const crankR = 26;
  const crankAngle = props.instantState.phase; // 0 to 2π

  // Crankcase circle outline
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx, crankY, crankR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Crankpin position (rotating)
  const pinX = cx + crankR * Math.sin(crankAngle);
  const pinY = crankY - crankR * Math.cos(crankAngle);

  // Crankshaft counterweight / arm
  ctx.strokeStyle = isDark ? '#0284c7' : '#0369a1';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(cx, crankY);
  ctx.lineTo(pinX, pinY);
  ctx.stroke();

  // Central crankshaft axis hub
  ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
  ctx.beginPath();
  ctx.arc(cx, crankY, 8, 0, Math.PI * 2);
  ctx.fill();

  // 4. Connecting Rod (Connecting Piston Wristpin to Crankpin)
  const wristPinX = cx;
  const wristPinY = pistonY + pistonH / 2;

  ctx.strokeStyle = isDark ? '#94a3b8' : '#475569';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(wristPinX, wristPinY);
  ctx.lineTo(pinX, pinY);
  ctx.stroke();

  // Connecting rod joint pins
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(wristPinX, wristPinY, 4.5, 0, Math.PI * 2);
  ctx.arc(pinX, pinY, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // 5. Piston Body
  const pistonW = cylinderW - 8;
  const pistonGrad = ctx.createLinearGradient(cx - pistonW / 2, pistonY, cx + pistonW / 2, pistonY);
  pistonGrad.addColorStop(0, isDark ? '#334155' : '#cbd5e1');
  pistonGrad.addColorStop(0.3, isDark ? '#64748b' : '#f1f5f9');
  pistonGrad.addColorStop(0.7, isDark ? '#475569' : '#e2e8f0');
  pistonGrad.addColorStop(1, isDark ? '#1e293b' : '#94a3b8');

  ctx.fillStyle = pistonGrad;
  ctx.strokeStyle = isDark ? '#0f172a' : '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cx - pistonW / 2, pistonY, pistonW, pistonH, 4);
  ctx.fill();
  ctx.stroke();

  // Piston Rings (2 sealing compression rings)
  ctx.strokeStyle = isDark ? '#0f172a' : '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - pistonW / 2, pistonY + 6);
  ctx.lineTo(cx + pistonW / 2, pistonY + 6);
  ctx.moveTo(cx - pistonW / 2, pistonY + 12);
  ctx.lineTo(cx + pistonW / 2, pistonY + 12);
  ctx.stroke();

  // Piston Label
  ctx.fillStyle = textColor;
  ctx.font = '600 11px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t('heatEngines.piston'), cx, pistonY + 22);

  // Direction rotation arrow around crankcase
  ctx.save();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, crankY, crankR + 10, -Math.PI / 4, Math.PI / 4);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * Draws high-precision PV or TS thermodynamic indicator diagram with state curves,
 * state vertices, shaded enclosed net-work area, and live tracking dot.
 */
function drawIndicatorDiagram(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isDark: boolean,
  textColor: string,
  textMuted: string,
  gridColor: string
) {
  ctx.save();
  ctx.translate(x, y);

  const padLeft = 56;
  const padRight = 36;
  const padTop = 38;
  const padBottom = 46;

  const plotW = Math.max(80, w - padLeft - padRight);
  const plotH = Math.max(80, h - padTop - padBottom);

  const isPV = activeDiagram.value === 'pv';

  // Compute curve points
  const curvePoints = generateCycleCurvePoints(props.metrics, props.params, 40);

  // Compute bounding box for scales
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  if (isPV) {
    for (const pt of curvePoints) {
      const vLiters = pt.v * 1000;
      const pKPa = pt.p / 1000;
      if (vLiters < minX) minX = vLiters;
      if (vLiters > maxX) maxX = vLiters;
      if (pKPa < minY) minY = pKPa;
      if (pKPa > maxY) maxY = pKPa;
    }
  } else {
    // TS Diagram
    const states = props.metrics.states;
    for (const st of states) {
      if (st.entropy < minX) minX = st.entropy;
      if (st.entropy > maxX) maxX = st.entropy;
      if (st.temperature < minY) minY = st.temperature;
      if (st.temperature > maxY) maxY = st.temperature;
    }
    // Margin for TS
    minX = Math.min(0, minX);
    maxX = Math.max(1, maxX * 1.15);
  }

  // Add scale margins
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const plotMinX = Math.max(0, minX - spanX * 0.12);
  const plotMaxX = maxX + spanX * 0.14;
  const plotMinY = Math.max(0, minY - spanY * 0.12);
  const plotMaxY = maxY + spanY * 0.16;

  function toScreenX(valX: number) {
    return padLeft + ((valX - plotMinX) / (plotMaxX - plotMinX)) * plotW;
  }

  function toScreenY(valY: number) {
    return padTop + plotH - ((valY - plotMinY) / (plotMaxY - plotMinY)) * plotH;
  }

  // 1. Grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  const xDivs = 4;
  for (let i = 0; i <= xDivs; i++) {
    const gx = padLeft + (i / xDivs) * plotW;
    ctx.beginPath();
    ctx.moveTo(gx, padTop);
    ctx.lineTo(gx, padTop + plotH);
    ctx.stroke();

    const val = plotMinX + (i / xDivs) * (plotMaxX - plotMinX);
    ctx.fillStyle = textMuted;
    ctx.font = '10px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(val.toFixed(1), gx, padTop + plotH + 15);
  }

  const yDivs = 4;
  for (let j = 0; j <= yDivs; j++) {
    const gy = padTop + (j / yDivs) * plotH;
    ctx.beginPath();
    ctx.moveTo(padLeft, gy);
    ctx.lineTo(padLeft + plotW, gy);
    ctx.stroke();

    const val = plotMaxY - (j / yDivs) * (plotMaxY - plotMinY);
    ctx.fillStyle = textMuted;
    ctx.font = '10px Vazirmatn, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val >= 100 ? val.toFixed(0) : val.toFixed(1), padLeft - 6, gy + 3);
  }

  // 2. Axes
  ctx.strokeStyle = isDark ? '#94a3b8' : '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop);
  ctx.lineTo(padLeft, padTop + plotH);
  ctx.lineTo(padLeft + plotW, padTop + plotH);
  ctx.stroke();

  // Axis Labels
  ctx.fillStyle = textColor;
  ctx.font = '600 11px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  const xLabel = isPV ? `${t('heatEngines.volume')} (L)` : `${t('heatEngines.entropy')} (J/K)`;
  ctx.fillText(xLabel, padLeft + plotW / 2, padTop + plotH + 32);

  ctx.save();
  ctx.translate(14, padTop + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  const yLabel = isPV ? `${t('heatEngines.pressure')} (kPa)` : `${t('heatEngines.temperature')} (K)`;
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  // 3. Shaded Enclosed Loop Area (Net Work or Heat)
  if (isPV && curvePoints.length > 2) {
    ctx.save();
    ctx.beginPath();
    const firstPt = curvePoints[0];
    ctx.moveTo(toScreenX(firstPt.v * 1000), toScreenY(firstPt.p / 1000));
    for (let i = 1; i < curvePoints.length; i++) {
      const pt = curvePoints[i];
      ctx.lineTo(toScreenX(pt.v * 1000), toScreenY(pt.p / 1000));
    }
    ctx.closePath();

    const loopGrad = ctx.createLinearGradient(padLeft, padTop, padLeft + plotW, padTop + plotH);
    loopGrad.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
    loopGrad.addColorStop(1, 'rgba(59, 130, 246, 0.16)');
    ctx.fillStyle = loopGrad;
    ctx.fill();
    ctx.restore();
  }

  // 4. Draw Path Strokes with process colors
  if (isPV) {
    // Process colors per stroke:
    // 1: Expansion / Compression
    // 2: Heat addition (Flame orange/red)
    // 3: Power expansion (Emerald green)
    // 4: Heat rejection (Cyan/blue)
    const strokeColors: Record<1 | 2 | 3 | 4, string> = {
      1: '#3b82f6',
      2: '#ef4444',
      3: '#10b981',
      4: '#06b6d4'
    };

    for (let s: 1 | 2 | 3 | 4 = 1; s <= 4; s = (s + 1) as 1 | 2 | 3 | 4) {
      const segPoints = curvePoints.filter(p => p.stroke === s);
      if (segPoints.length > 1) {
        ctx.strokeStyle = strokeColors[s];
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(toScreenX(segPoints[0].v * 1000), toScreenY(segPoints[0].p / 1000));
        for (let i = 1; i < segPoints.length; i++) {
          ctx.lineTo(toScreenX(segPoints[i].v * 1000), toScreenY(segPoints[i].p / 1000));
        }
        ctx.stroke();

        // Direction arrowhead at middle of stroke
        const midIdx = Math.floor(segPoints.length / 2);
        if (midIdx > 0 && midIdx < segPoints.length - 1) {
          const pPrev = segPoints[midIdx - 1];
          const pNext = segPoints[midIdx + 1];
          const sx1 = toScreenX(pPrev.v * 1000);
          const sy1 = toScreenY(pPrev.p / 1000);
          const sx2 = toScreenX(pNext.v * 1000);
          const sy2 = toScreenY(pNext.p / 1000);
          drawArrowHead(ctx, sx1, sy1, sx2, sy2, strokeColors[s]);
        }
      }
    }
  } else {
    // TS diagram curve connecting the 4 states
    const states = props.metrics.states;
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(toScreenX(states[0].entropy), toScreenY(states[0].temperature));
    for (let i = 1; i < states.length; i++) {
      ctx.lineTo(toScreenX(states[i].entropy), toScreenY(states[i].temperature));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.fill();
    ctx.stroke();
  }

  // 5. State Vertices (1, 2, 3, 4)
  const states = props.metrics.states;
  states.forEach(st => {
    const sx = isPV ? toScreenX(st.volume * 1000) : toScreenX(st.entropy);
    const sy = isPV ? toScreenY(st.pressure / 1000) : toScreenY(st.temperature);

    // Outer circle
    ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sx, sy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Index number
    ctx.fillStyle = textColor;
    ctx.font = 'bold 10px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.index.toString(), sx, sy + 0.5);
  });

  // 6. Live Current Indicator Dot tracing the cycle
  const curV = props.instantState.volume * 1000;
  const curP = props.instantState.pressure / 1000;
  const curT = props.instantState.temperature;

  let curX = toScreenX(curV);
  let curY = toScreenY(curP);

  if (!isPV) {
    // Approximate entropy along current stroke
    const sIdx = props.instantState.strokeIndex;
    const sStart = states[sIdx - 1];
    const sEnd = states[sIdx % 4];
    const frac = (props.instantState.phase % (Math.PI / 2)) / (Math.PI / 2);
    const curS = sStart.entropy + frac * (sEnd.entropy - sStart.entropy);
    curX = toScreenX(curS);
    curY = toScreenY(curT);
  }

  // Glow ring
  ctx.save();
  const ringGrad = ctx.createRadialGradient(curX, curY, 2, curX, curY, 14);
  ringGrad.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
  ringGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)');
  ringGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(curX, curY, 14, 0, Math.PI * 2);
  ctx.fill();

  // Solid center dot
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(curX, curY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Diagram Title
  ctx.fillStyle = textColor;
  ctx.font = '600 12px Vazirmatn, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    isPV ? `P-V (${props.params.cycleType.toUpperCase()})` : `T-S (${props.params.cycleType.toUpperCase()})`,
    padLeft + 4,
    padTop - 12
  );

  ctx.restore();
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headLen = 7;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function handleResize() {
  const container = containerRef.value;
  const canvas = canvasRef.value;
  if (!container || !canvas) return;

  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.floor(rect.width);
  const h = Math.floor(rect.height);

  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }
  draw();
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  handleResize();
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.value);
  }

  function loop() {
    draw();
    animationFrameId = requestAnimationFrame(loop);
  }
  animationFrameId = requestAnimationFrame(loop);
});

onUnmounted(() => {
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
  if (resizeObserver) resizeObserver.disconnect();
});

watch(
  () => [props.metrics, props.instantState, props.params, props.isDark, activeDiagram.value],
  () => draw(),
  { deep: true }
);

defineExpose({
  getCanvas: () => canvasRef.value
});
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 380px;
  background: var(--bg-page);
  overflow: hidden;
  border-radius: var(--radius-lg, 12px);
  display: flex;
  flex-direction: column;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.hud-overlay {
  position: absolute;
  top: 10px;
  inset-inline: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
  z-index: 10;
}

.hud-badge {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-primary);
  backdrop-filter: blur(8px);
}

.stroke-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-physics, #3b82f6);
  flex-shrink: 0;
}

.pulse-active {
  animation: pulse-ring 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-ring {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.35);
    opacity: 0.65;
  }
}

.hud-controls {
  pointer-events: auto;
  display: flex;
  gap: 6px;
}

.view-toggle-btn {
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: var(--surface-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.view-toggle-btn.active {
  background: var(--accent-physics, #3b82f6);
  color: #ffffff;
  border-color: var(--accent-physics, #3b82f6);
}

.bottom-metrics-bar {
  position: absolute;
  bottom: 8px;
  inset-inline: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  align-items: center;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 12px;
  backdrop-filter: blur(8px);
  z-index: 10;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-item.highlight {
  color: #10b981;
  font-weight: 700;
}

.metric-label {
  color: var(--text-secondary);
  font-size: 11px;
}

.metric-value {
  color: var(--text-primary);
  font-weight: 600;
}

.ltr-island {
  direction: ltr;
  display: inline-block;
}

@media (max-width: 680px) {
  .bottom-metrics-bar {
    font-size: 11px;
    padding: 4px 8px;
    gap: 6px;
  }
  .hud-badge {
    font-size: 10.5px;
    padding: 4px 8px;
  }
}
</style>
