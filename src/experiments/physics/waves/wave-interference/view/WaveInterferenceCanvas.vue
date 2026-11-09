<template>
  <div class="canvas-container" ref="containerRef">
    <canvas
      ref="canvasRef"
      @mousedown="onPointerDown"
      @mousemove="onPointerMove"
      @mouseup="onPointerUp"
      @mouseleave="onPointerUp"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onPointerUp"
    ></canvas>

    <!-- Top Overlay Badge -->
    <div class="hud-overlay">
      <div class="hud-badge mode-badge">
        <span class="badge-dot" :class="{ 'pulse-active': isRunning }"></span>
        <span class="badge-text">{{ modeLabel }}</span>
      </div>

      <div class="hud-badge probe-status-badge" v-if="params.mode === 'ripple2d'">
        <span
          class="status-indicator"
          :class="{
            constructive: probeInfo.isConstructive,
            destructive: probeInfo.isDestructive
          }"
        ></span>
        <span class="status-text">
          {{ probeInterferenceText }} (Δr = {{ probeInfo.pathDifference.toFixed(1) }} cm = {{ probeInfo.pathDiffInWavelengths.toFixed(2) }}λ)
        </span>
      </div>
    </div>

    <!-- Bottom Readout Bar -->
    <div class="bottom-metrics-bar">
      <div class="metric-item">
        <span class="metric-label">λ:</span>
        <span class="metric-value ltr-island">{{ constants.wavelength.toFixed(1) }} cm</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">f:</span>
        <span class="metric-value ltr-island">{{ params.frequency.toFixed(1) }} Hz</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">v:</span>
        <span class="metric-value ltr-island">{{ params.waveSpeed.toFixed(0) }} cm/s</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">T:</span>
        <span class="metric-value ltr-island">{{ constants.period.toFixed(2) }} s</span>
      </div>
      <div class="metric-item highlight" v-if="params.mode === 'ripple2d'">
        <span class="metric-label">y_probe:</span>
        <span class="metric-value ltr-island">{{ probeInfo.totalDisplacement.toFixed(2) }} cm</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type WaveInterferenceParams,
  type WaveDerivedConstants,
  type ProbeMeasurement,
  calculateWaveConstants,
  evaluate2DRippleField,
  calculateProbeMeasurement,
  calculate1DTransverseField,
  calculate1DLongitudinalField
} from '../model/wave-interference';

const props = defineProps<{
  params: WaveInterferenceParams;
  simTime: number;
  isRunning: boolean;
  isDark: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:probe', coords: { x: number; y: number }): void;
}>();

const { t } = useI18n();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const constants = computed<WaveDerivedConstants>(() => calculateWaveConstants(props.params));
const probeInfo = computed<ProbeMeasurement>(() =>
  calculateProbeMeasurement(props.simTime, props.params, constants.value)
);

const modeLabel = computed(() => {
  if (props.params.mode === 'ripple2d') return t('waveInterference.mode_ripple2d');
  if (props.params.mode === 'transverse1d') return t('waveInterference.mode_transverse1d');
  return t('waveInterference.mode_longitudinal1d');
});

const probeInterferenceText = computed(() => {
  if (probeInfo.value.isConstructive) return t('waveInterference.constructive');
  if (probeInfo.value.isDestructive) return t('waveInterference.destructive');
  return t('waveInterference.intermediate');
});

let isDraggingProbe = false;
let animationFrameId: number | null = null;

function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(dpr, dpr);

  const isDark = props.isDark;
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  if (props.params.mode === 'ripple2d') {
    render2DRippleTank(ctx, w, h, isDark, textColor, textMuted);
  } else if (props.params.mode === 'transverse1d') {
    render1DTransverse(ctx, w, h, isDark);
  } else {
    render1DLongitudinal(ctx, w, h, isDark, textMuted);
  }

  ctx.restore();
}

/**
 * 2D Ripple Tank Renderer:
 * - Concentric interference wavefield rasterized via low-overhead block sampling
 * - Two glowing pulsating source pins
 * - Movable probe with telemetry rays connecting to both sources
 */
function render2DRippleTank(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isDark: boolean,
  textColor: string,
  textMuted: string
) {
  const cx = w / 2;
  const cy = h / 2 - 10;
  // Scale: let tank width be 60 cm wide
  const fieldWidthCm = 50;
  const scale = w / fieldWidthCm; // pixels per cm

  // Fast block-based rasterization (step 5px)
  const step = 5;
  const t = props.simTime;
  const maxAmp = props.params.amplitude1 + props.params.amplitude2;

  // Render background wavefield
  for (let px = 0; px < w; px += step) {
    const worldX = (px - cx) / scale;
    for (let py = 35; py < h - 40; py += step) {
      const worldY = (py - cy) / scale;
      const { yTot } = evaluate2DRippleField(worldX, worldY, t, props.params, constants.value);

      const norm = Math.max(-1, Math.min(1, yTot / (maxAmp * 0.5)));

      let fill = '';
      if (norm > 0) {
        // Crest: Cyan glow
        const alpha = Math.min(0.9, norm * 0.85);
        fill = isDark
          ? `rgba(56, 189, 248, ${alpha})`
          : `rgba(2, 132, 199, ${alpha * 0.8})`;
      } else {
        // Trough: Deep blue / violet
        const alpha = Math.min(0.9, -norm * 0.85);
        fill = isDark
          ? `rgba(129, 140, 248, ${alpha})`
          : `rgba(99, 102, 241, ${alpha * 0.75})`;
      }

      ctx.fillStyle = fill;
      ctx.fillRect(px, py, step, step);
    }
  }

  // Draw Source 1 and Source 2
  const d = props.params.sourceSeparation;
  const s1x = cx + (-d / 2) * scale;
  const s1y = cy;
  const s2x = cx + (d / 2) * scale;
  const s2y = cy;

  drawSourcePin(ctx, s1x, s1y, 'S1', '#f59e0b', props.simTime, isDark);
  drawSourcePin(ctx, s2x, s2y, 'S2', '#ef4444', props.simTime + (props.params.phaseDifferenceDeg * Math.PI) / 180 / constants.value.angularFrequency, isDark);

  // Draw Probe Detector Tool
  const probePx = cx + props.params.probeX * scale;
  const probePy = cy + props.params.probeY * scale;

  // Rays from S1 and S2 to Probe
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;

  // Ray 1
  ctx.strokeStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(s1x, s1y);
  ctx.lineTo(probePx, probePy);
  ctx.stroke();

  // Ray 2
  ctx.strokeStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(s2x, s2y);
  ctx.lineTo(probePx, probePy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ray distance labels
  ctx.font = '10px Vazirmatn, sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(`r1 = ${probeInfo.value.r1.toFixed(1)} cm`, (s1x + probePx) / 2 - 10, (s1y + probePy) / 2 - 6);
  ctx.fillStyle = '#ef4444';
  ctx.fillText(`r2 = ${probeInfo.value.r2.toFixed(1)} cm`, (s2x + probePx) / 2 + 10, (s2y + probePy) / 2 - 6);

  // Probe Target Marker
  const isConst = probeInfo.value.isConstructive;
  const isDest = probeInfo.value.isDestructive;
  const probeColor = isConst ? '#10b981' : isDest ? '#ef4444' : '#3b82f6';

  ctx.strokeStyle = probeColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(probePx, probePy, 14, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = probeColor;
  ctx.beginPath();
  ctx.arc(probePx, probePy, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Crosshairs
  ctx.beginPath();
  ctx.moveTo(probePx - 18, probePy);
  ctx.lineTo(probePx + 18, probePy);
  ctx.moveTo(probePx, probePy - 18);
  ctx.lineTo(probePx, probePy + 18);
  ctx.stroke();

  // Telemetry Badge next to Probe
  const badgeX = Math.min(w - 110, Math.max(10, probePx + 18));
  const badgeY = Math.min(h - 55, Math.max(50, probePy - 22));

  ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)';
  ctx.strokeStyle = probeColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, 105, 36, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.font = 'bold 10px Vazirmatn, sans-serif';
  ctx.fillText(probeInterferenceText.value, badgeX + 8, badgeY + 14);
  ctx.fillStyle = textMuted;
  ctx.font = '9.5px Vazirmatn, sans-serif';
  ctx.fillText(`Δr = ${probeInfo.value.pathDifference.toFixed(1)} cm`, badgeX + 8, badgeY + 28);

  ctx.restore();
}

function drawSourcePin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  color: string,
  time: number,
  isDark: boolean
) {
  // Pulsing ripples
  const phase = (time * 3) % 1;
  const pulseR = 8 + phase * 20;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * (1 - phase);
  ctx.beginPath();
  ctx.arc(x, y, pulseR, 0, Math.PI * 2);
  ctx.stroke();

  // Pin head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Source Label
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = 'bold 11px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y - 12);
  ctx.restore();
}

/**
 * 1D Transverse Wave Superposition Renderer:
 * - Wave 1 (rightward traveling, blue dashed line)
 * - Wave 2 (leftward traveling, orange dashed line)
 * - Wave Total (bold green line with transverse oscillating particles)
 */
function render1DTransverse(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isDark: boolean
) {
  const padX = 40;
  const length = 80; // cm
  const plotW = w - 2 * padX;
  const centerY = h / 2 - 10;
  const scaleY = 22; // pixels per cm

  // Equilibrium Baseline
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(padX, centerY);
  ctx.lineTo(padX + plotW, centerY);
  ctx.stroke();
  ctx.setLineDash([]);

  const particles = calculate1DTransverseField(
    length,
    120,
    props.simTime,
    props.params,
    constants.value
  );

  // 1. Draw Wave 1 (Traveling to the right, blue dashed)
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  for (let i = 0; i < particles.length; i++) {
    const pt = particles[i];
    const sx = padX + (pt.x / length) * plotW;
    const sy = centerY - pt.y1 * scaleY;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Draw Wave 2 (Traveling to the left, orange dashed)
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  for (let i = 0; i < particles.length; i++) {
    const pt = particles[i];
    const sx = padX + (pt.x / length) * plotW;
    const sy = centerY - pt.y2 * scaleY;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Draw Resultant Wave Total (Solid Emerald Green)
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < particles.length; i++) {
    const pt = particles[i];
    const sx = padX + (pt.x / length) * plotW;
    const sy = centerY - pt.yTot * scaleY;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();

  // Draw discrete oscillating beads along the resultant string
  const beadCount = 25;
  for (let b = 0; b <= beadCount; b++) {
    const idx = Math.floor((b / beadCount) * (particles.length - 1));
    const pt = particles[idx];
    const sx = padX + (pt.x / length) * plotW;
    const sy = centerY - pt.yTot * scaleY;

    // Transverse motion arrow
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, centerY);
    ctx.lineTo(sx, sy);
    ctx.stroke();

    // Bead
    ctx.fillStyle = '#10b981';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Legend at top
  drawWaveLegend(ctx, padX, 42, isDark);
}

/**
 * 1D Longitudinal Sound Wave Renderer:
 * - Oscillating coil/particle array moving horizontally along wave vector k
 * - Color-coded density regions (compression = dark orange, rarefaction = cyan)
 * - Continuous density curve plotted below
 */
function render1DLongitudinal(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isDark: boolean,
  textMuted: string
) {
  const padX = 40;
  const length = 70; // cm
  const plotW = w - 2 * padX;
  const coilY = h * 0.38;
  const curveY = h * 0.72;

  const particles = calculate1DLongitudinalField(
    length,
    55,
    props.simTime,
    props.params,
    constants.value
  );

  // 1. Draw Density Shading Bars Behind Coil
  const barW = plotW / particles.length;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const sx = padX + (p.displacedX / length) * plotW;
    const normDensity = p.densityFactor - 1.0; // [-0.8, +0.8]

    let col = '';
    if (normDensity > 0) {
      // Compression: Warm Amber
      col = `rgba(245, 158, 11, ${Math.min(0.65, normDensity * 1.5)})`;
    } else {
      // Rarefaction: Cyan
      col = `rgba(6, 182, 212, ${Math.min(0.65, -normDensity * 1.5)})`;
    }

    ctx.fillStyle = col;
    ctx.fillRect(sx - barW / 2, coilY - 32, barW, 64);
  }

  // 2. Draw Slinky Coil / Particle Array
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const sx = padX + (p.displacedX / length) * plotW;

    // Vertical coil slice
    ctx.strokeStyle = isDark ? '#f8fafc' : '#1e293b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx, coilY - 24);
    ctx.lineTo(sx, coilY + 24);
    ctx.stroke();

    // Central bead
    ctx.fillStyle = p.densityFactor > 1.1 ? '#f59e0b' : p.densityFactor < 0.9 ? '#06b6d4' : '#3b82f6';
    ctx.beginPath();
    ctx.arc(sx, coilY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Draw Local Density Wave Curve
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, curveY);
  ctx.lineTo(padX + plotW, curveY);
  ctx.stroke();

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const sx = padX + (p.equilibriumX / length) * plotW;
    const sy = curveY - (p.densityFactor - 1.0) * 45;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();

  // Density curve label
  ctx.fillStyle = textMuted;
  ctx.font = '11px Vazirmatn, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Δρ(x, t) — تراکم و انبساط', padX + 6, curveY - 28);
}

function drawWaveLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isDark: boolean
) {
  ctx.save();
  ctx.font = '11px Vazirmatn, sans-serif';

  // Wave 1
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 20, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
  ctx.fillText(t('waveInterference.wave1'), x + 26, y + 4);

  // Wave 2
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x + 130, y);
  ctx.lineTo(x + 150, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillText(t('waveInterference.wave2'), x + 156, y + 4);

  // Resultant
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 260, y);
  ctx.lineTo(x + 280, y);
  ctx.stroke();
  ctx.fillText(t('waveInterference.resultant'), x + 286, y + 4);

  ctx.restore();
}

// Interactive Probe Mouse/Touch Drag Handlers
function updateProbeFromClient(clientX: number, clientY: number) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  const cx = w / 2;
  const cy = h / 2 - 10;
  const fieldWidthCm = 50;
  const scale = w / fieldWidthCm;

  const clickX = clientX - rect.left;
  const clickY = clientY - rect.top;

  const worldX = (clickX - cx) / scale;
  const worldY = (clickY - cy) / scale;

  emit('update:probe', {
    x: Number(worldX.toFixed(1)),
    y: Number(worldY.toFixed(1))
  });
}

function onPointerDown(e: MouseEvent) {
  if (props.params.mode !== 'ripple2d') return;
  isDraggingProbe = true;
  updateProbeFromClient(e.clientX, e.clientY);
}

function onPointerMove(e: MouseEvent) {
  if (!isDraggingProbe || props.params.mode !== 'ripple2d') return;
  updateProbeFromClient(e.clientX, e.clientY);
}

function onPointerUp() {
  isDraggingProbe = false;
}

function onTouchStart(e: TouchEvent) {
  if (props.params.mode !== 'ripple2d' || e.touches.length === 0) return;
  isDraggingProbe = true;
  updateProbeFromClient(e.touches[0].clientX, e.touches[0].clientY);
}

function onTouchMove(e: TouchEvent) {
  if (!isDraggingProbe || props.params.mode !== 'ripple2d' || e.touches.length === 0) return;
  updateProbeFromClient(e.touches[0].clientX, e.touches[0].clientY);
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
  render();
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  handleResize();
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.value);
  }

  function loop() {
    render();
    animationFrameId = requestAnimationFrame(loop);
  }
  animationFrameId = requestAnimationFrame(loop);
});

onUnmounted(() => {
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
  if (resizeObserver) resizeObserver.disconnect();
});

watch(
  () => [props.params, props.simTime, props.isDark],
  () => render(),
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
  cursor: crosshair;
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

.badge-dot {
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

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
}

.status-indicator.constructive {
  background: #10b981;
}

.status-indicator.destructive {
  background: #ef4444;
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
