<template>
  <div class="canvas-container" ref="containerRef">
    <canvas ref="canvasRef"></canvas>

    <!-- Top Overlay Badge & HUD Controls -->
    <div class="hud-overlay">
      <div class="hud-badge mode-badge">
        <span class="badge-dot" :class="{ 'pulse-active': isRunning }"></span>
        <span class="badge-text" v-if="params.mode === 'beats'">
          {{ statusLabel }} (f_beat = {{ derived.beatFrequency.toFixed(1) }} Hz)
        </span>
        <span class="badge-text" v-else>
          N = {{ params.fourierHarmonicsCount }} Harmonics (f₀ = {{ params.fundamentalFreq }} Hz)
        </span>
      </div>

      <div class="hud-controls">
        <button
          class="tool-btn"
          :class="{ active: showComponents }"
          @click="showComponents = !showComponents"
          :title="params.mode === 'beats' ? 'Toggle y1 & y2 component waves' : 'Toggle harmonic components'"
        >
          〰️ {{ params.mode === 'beats' ? 'y₁ + y₂' : 'Harmonics' }}
        </button>
        <button
          class="tool-btn"
          :class="{ active: showEnvelope }"
          @click="showEnvelope = !showEnvelope"
          title="Toggle Modulation Envelope"
          v-if="params.mode === 'beats'"
        >
          📈 Envelope
        </button>
        <button
          class="tool-btn audio-btn"
          :class="{ active: isAudioActive }"
          @click="toggleAudioSynth"
          title="Toggle Acoustic Tone / Beat Audio"
        >
          {{ isAudioActive ? '🔊' : '🔇' }} Audio
        </button>
      </div>
    </div>

    <!-- Bottom Readout Bar -->
    <div class="bottom-metrics-bar">
      <template v-if="params.mode === 'beats'">
        <div class="metric-item highlight">
          <span class="metric-label">f_beat:</span>
          <span class="metric-value ltr-island">{{ derived.beatFrequency.toFixed(2) }} Hz</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">T_beat:</span>
          <span class="metric-value ltr-island">{{ derived.beatPeriod < 100 ? derived.beatPeriod.toFixed(2) + ' s' : '∞' }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">f_carrier:</span>
          <span class="metric-value ltr-island">{{ derived.carrierFrequency.toFixed(1) }} Hz</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Depth:</span>
          <span class="metric-value ltr-island">{{ (derived.modulationDepth * 100).toFixed(0) }}%</span>
        </div>
      </template>
      <template v-else>
        <div class="metric-item highlight">
          <span class="metric-label">f₀ (Fundamental):</span>
          <span class="metric-value ltr-island">{{ params.fundamentalFreq }} Hz</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Harmonics N:</span>
          <span class="metric-value ltr-island">{{ params.fourierHarmonicsCount }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Peak Harm:</span>
          <span class="metric-value ltr-island">{{ derived.activeHarmonics.length > 0 ? derived.activeHarmonics[derived.activeHarmonics.length - 1].freq + ' Hz' : '' }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type BeatsFourierParams,
  type BeatsFourierDerived,
  sampleWaveformWindow,
  computeFrequencySpectrum
} from '../model/beats-fourier';

const props = defineProps<{
  params: BeatsFourierParams;
  derived: BeatsFourierDerived;
  simTime: number;
  isRunning: boolean;
  isDark: boolean;
}>();

const { t } = useI18n();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const showComponents = ref(true);
const showEnvelope = ref(true);
const isAudioActive = ref(false);

let animationFrameId: number | null = null;

// Web Audio API Dual Tone Synthesizer
let audioCtx: AudioContext | null = null;
let osc1: OscillatorNode | null = null;
let osc2: OscillatorNode | null = null;
let gainMaster: GainNode | null = null;

const statusLabel = computed(() => {
  const s = props.derived.tuningStatus;
  if (s === 'in_tune') return t('beatsFourier.status_in_tune');
  if (s === 'slow_beat') return t('beatsFourier.status_slow_beat');
  if (s === 'fast_beat') return t('beatsFourier.status_fast_beat');
  return t('beatsFourier.status_roughness');
});

function initAudio() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();

    gainMaster = audioCtx.createGain();
    gainMaster.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gainMaster.connect(audioCtx.destination);

    osc1 = audioCtx.createOscillator();
    osc2 = audioCtx.createOscillator();

    osc1.type = 'sine';
    osc2.type = 'sine';

    updateAudioNodes();

    osc1.connect(gainMaster);
    osc2.connect(gainMaster);

    osc1.start();
    osc2.start();
  } catch (err) {
    console.warn('AudioContext failed to initialize:', err);
  }
}

function updateAudioNodes() {
  if (!audioCtx || !osc1 || !osc2 || !gainMaster) return;

  if (props.params.mode === 'beats') {
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setTargetAtTime(props.params.freq1, audioCtx.currentTime, 0.04);
    osc2.frequency.setTargetAtTime(props.params.freq2, audioCtx.currentTime, 0.04);
  } else {
    // In Fourier synthesis, use oscillator wave types approximating mode
    if (props.params.mode === 'fourier_square') {
      osc1.type = 'square';
    } else if (props.params.mode === 'fourier_sawtooth') {
      osc1.type = 'sawtooth';
    } else {
      osc1.type = 'triangle';
    }
    osc1.frequency.setTargetAtTime(props.params.fundamentalFreq, audioCtx.currentTime, 0.04);
    osc2.frequency.setTargetAtTime(props.params.fundamentalFreq, audioCtx.currentTime, 0.04);
  }
}

function toggleAudioSynth() {
  if (!audioCtx) {
    initAudio();
  }
  if (!audioCtx || !gainMaster) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  isAudioActive.value = !isAudioActive.value;
  if (isAudioActive.value) {
    gainMaster.gain.setTargetAtTime(0.08, audioCtx.currentTime, 0.05);
  } else {
    gainMaster.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.05);
  }
}

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
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  // Layout: Top 65% for Oscilloscope, Bottom 35% for FFT Spectrum Analyzer
  const splitY = h * 0.64;

  renderOscilloscope(ctx, 0, 0, w, splitY, isDark, textMuted);
  renderSpectrumAnalyzer(ctx, 0, splitY, w, h - splitY, isDark, textMuted);

  ctx.restore();
}

/**
 * 1. Time-Domain Oscilloscope View
 */
function renderOscilloscope(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isDark: boolean,
  textMuted: string
) {
  ctx.save();
  ctx.translate(x, y);

  const padLeft = 48;
  const padRight = 24;
  const padTop = 38;
  const padBottom = 22;
  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;
  const centerY = padTop + plotH / 2;

  // Background panel
  ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.6)';
  ctx.fillRect(padLeft, padTop, plotW, plotH);
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)';
  ctx.strokeRect(padLeft, padTop, plotW, plotH);

  // Grid lines
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(100, 116, 139, 0.15)';
  ctx.lineWidth = 1;

  // Center horizontal zero line
  ctx.beginPath();
  ctx.moveTo(padLeft, centerY);
  ctx.lineTo(padLeft + plotW, centerY);
  ctx.stroke();

  // Y-axis ticks & labels
  ctx.fillStyle = textMuted;
  ctx.font = '10px Vazirmatn, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('+2.0', padLeft - 6, centerY - plotH * 0.42);
  ctx.fillText('0.0', padLeft - 6, centerY + 3);
  ctx.fillText('-2.0', padLeft - 6, centerY + plotH * 0.42);

  // Time window: Duration adapted to beat frequency or fundamental
  let durationSec = 0.5;
  if (props.params.mode === 'beats') {
    const fBeat = props.derived.beatFrequency;
    if (fBeat > 0.1) {
      durationSec = Math.max(0.3, Math.min(1.2, 1.5 / fBeat));
    } else {
      durationSec = 0.05; // Zoom in for unison
    }
  } else {
    durationSec = Math.max(0.015, Math.min(0.04, 4 / props.params.fundamentalFreq));
  }

  // Sample points in time window
  const startTime = props.simTime;
  const points = sampleWaveformWindow(startTime, durationSec, props.params, 260);

  const scaleY = (plotH * 0.42) / 2.2;

  // A. Draw Individual Components (y1 in cyan, y2 in emerald)
  if (showComponents.value && props.params.mode === 'beats') {
    // Wave 1: y1 (cyan)
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.55)' : 'rgba(2, 132, 199, 0.6)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const px = padLeft + (i / (points.length - 1)) * plotW;
      const py = centerY - points[i].y1 * scaleY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Wave 2: y2 (emerald)
    ctx.strokeStyle = isDark ? 'rgba(52, 211, 153, 0.55)' : 'rgba(5, 150, 105, 0.6)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const px = padLeft + (i / (points.length - 1)) * plotW;
      const py = centerY - points[i].y2 * scaleY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // B. Draw Modulation Envelope Lobes
  if (showEnvelope.value && props.params.mode === 'beats') {
    ctx.strokeStyle = isDark ? 'rgba(245, 158, 11, 0.7)' : 'rgba(217, 119, 6, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    // Positive envelope
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const px = padLeft + (i / (points.length - 1)) * plotW;
      const py = centerY - points[i].envelopePos * scaleY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Negative envelope
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const px = padLeft + (i / (points.length - 1)) * plotW;
      const py = centerY - points[i].envelopeNeg * scaleY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // C. Draw Resultant Wave y_tot (Bold Purple/Blue Glowing Curve)
  ctx.strokeStyle = isDark ? '#a855f7' : '#7c3aed';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const px = padLeft + (i / (points.length - 1)) * plotW;
    const py = centerY - points[i].yTotal * scaleY;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Time Scale Text
  ctx.fillStyle = textMuted;
  ctx.font = '10px Vazirmatn, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Δt = ${(durationSec * 1000).toFixed(0)} ms`, padLeft + 6, padTop + 14);

  // Label
  ctx.textAlign = 'right';
  ctx.fillText('y(t) Oscilloscope', padLeft + plotW - 6, padTop + 14);

  ctx.restore();
}

/**
 * 2. Frequency Domain (FFT Spectrum Analyzer)
 */
function renderSpectrumAnalyzer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isDark: boolean,
  textMuted: string
) {
  ctx.save();
  ctx.translate(x, y);

  const padLeft = 48;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 26;
  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;
  const baseLineY = padTop + plotH;

  // Background
  ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(241, 245, 249, 0.5)';
  ctx.fillRect(padLeft, padTop, plotW, plotH);
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)';
  ctx.strokeRect(padLeft, padTop, plotW, plotH);

  // Spectrum peaks data
  const peaks = computeFrequencySpectrum(props.params, props.derived);

  // Determine frequency domain range [minFreq, maxFreq]
  let minF = 350;
  let maxF = 550;
  if (props.params.mode === 'beats') {
    const f1 = props.params.freq1;
    const f2 = props.params.freq2;
    minF = Math.max(0, Math.min(f1, f2) - 40);
    maxF = Math.max(f1, f2) + 40;
  } else {
    const f0 = props.params.fundamentalFreq;
    minF = 0;
    maxF = Math.max(1000, f0 * 12);
  }

  // Draw Baseline
  ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(padLeft, baseLineY);
  ctx.lineTo(padLeft + plotW, baseLineY);
  ctx.stroke();

  // Draw Discrete Spectral Bars
  for (let i = 0; i < peaks.length; i++) {
    const p = peaks[i];
    const fx = padLeft + ((p.frequency - minF) / Math.max(1, maxF - minF)) * plotW;
    const barH = Math.min(plotH - 8, p.magnitude * (plotH * 0.75));
    const barY = baseLineY - barH;

    // Gradient bar
    const barGrad = ctx.createLinearGradient(0, barY, 0, baseLineY);
    barGrad.addColorStop(0, '#3b82f6');
    barGrad.addColorStop(1, 'rgba(59, 130, 246, 0.2)');

    ctx.fillStyle = barGrad;
    ctx.fillRect(fx - 4, barY, 8, barH);

    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(fx - 4, barY, 8, barH);

    // Peak circle dot
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(fx, barY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Frequency label under bar
    ctx.fillStyle = textMuted;
    ctx.font = '10px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${p.frequency.toFixed(0)}`, fx, baseLineY + 14);

    // Amplitude on top
    ctx.fillText(`${p.magnitude.toFixed(2)}`, fx, barY - 4);
  }

  // Delta f arrow between f1 and f2 in Beats Mode
  if (props.params.mode === 'beats' && peaks.length >= 2) {
    const x1 = padLeft + ((peaks[0].frequency - minF) / (maxF - minF)) * plotW;
    const x2 = padLeft + ((peaks[1].frequency - minF) / (maxF - minF)) * plotW;
    const arrowY = padTop + 14;

    if (Math.abs(x2 - x1) > 14) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x1, arrowY);
      ctx.lineTo(x2, arrowY);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 10px Vazirmatn, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Δf = ${props.derived.beatFrequency.toFixed(1)} Hz`, (x1 + x2) / 2, arrowY - 4);
    }
  }

  // Analyzer Title
  ctx.fillStyle = textMuted;
  ctx.font = '10px Vazirmatn, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(t('beatsFourier.spectrumTitle'), padLeft + plotW - 6, padTop + 14);

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
  if (osc1) {
    try {
      osc1.stop();
      osc1.disconnect();
    } catch {}
  }
  if (osc2) {
    try {
      osc2.stop();
      osc2.disconnect();
    } catch {}
  }
  if (audioCtx) {
    try {
      audioCtx.close();
    } catch {}
  }
});

watch(
  () => [
    props.params,
    props.derived,
    props.simTime,
    props.isDark,
    showComponents.value,
    showEnvelope.value
  ],
  () => {
    updateAudioNodes();
    render();
  },
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

.hud-controls {
  pointer-events: auto;
  display: flex;
  gap: 6px;
}

.tool-btn {
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: var(--surface-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-btn.active {
  background: var(--surface-input);
  color: var(--accent-physics, #3b82f6);
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
