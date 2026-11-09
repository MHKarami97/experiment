<template>
  <div class="canvas-container" ref="containerRef">
    <canvas
      ref="canvasRef"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend.passive="onMouseUp"
    ></canvas>

    <!-- Top Overlay Badge & HUD Controls -->
    <div class="hud-overlay">
      <div class="hud-badge mode-badge">
        <span class="badge-dot" :class="{ 'pulse-active': isRunning }"></span>
        <span class="badge-text">{{ resonanceStateLabel }} (SPL: {{ derived.amplificationDb.toFixed(1) }} dB)</span>
      </div>

      <div class="hud-controls">
        <button
          class="tool-btn"
          :class="{ active: showStandingWave }"
          @click="showStandingWave = !showStandingWave"
          title="Toggle Standing Wave Curve"
        >
          〰️ {{ showStandingWave ? 'Wave ON' : 'Wave OFF' }}
        </button>
        <button
          class="tool-btn"
          :class="{ active: showMarkers }"
          @click="showMarkers = !showMarkers"
          title="Toggle L1 & L2 Resonant Markers"
        >
          🏷️ Markers
        </button>
        <button
          class="tool-btn audio-btn"
          :class="{ active: isAudioActive }"
          @click="toggleAudioSynth"
          title="Toggle Acoustic Resonance Audio Tone"
        >
          {{ isAudioActive ? '🔊' : '🔇' }} Audio
        </button>
      </div>
    </div>

    <!-- Bottom Readout Bar -->
    <div class="bottom-metrics-bar">
      <div class="metric-item highlight">
        <span class="metric-label">L (Air Column):</span>
        <span class="metric-value ltr-island">{{ (params.columnLength * 100).toFixed(1) }} cm</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">L₁:</span>
        <span class="metric-value ltr-island">{{ (derived.firstResonanceLength * 100).toFixed(1) }} cm</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">L₂:</span>
        <span class="metric-value ltr-island">{{ (derived.secondResonanceLength * 100).toFixed(1) }} cm</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">v_sound:</span>
        <span class="metric-value ltr-island">{{ derived.soundSpeed.toFixed(1) }} m/s</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">λ:</span>
        <span class="metric-value ltr-island">{{ derived.wavelength.toFixed(3) }} m</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">ΔL (End):</span>
        <span class="metric-value ltr-island">{{ (derived.endCorrection * 100).toFixed(2) }} cm</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type ResonanceTubesParams,
  type ResonanceTubesDerived,
  calculateAcousticProfiles
} from '../model/resonance-tubes';

const props = defineProps<{
  params: ResonanceTubesParams;
  derived: ResonanceTubesDerived;
  simTime: number;
  isRunning: boolean;
  isDark: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:columnLength', length: number): void;
}>();

const { t } = useI18n();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const showStandingWave = ref(true);
const showMarkers = ref(true);
const isAudioActive = ref(false);

let animationFrameId: number | null = null;
let isDraggingWater = false;

// Web Audio API Acoustic Synthesizer
let audioCtx: AudioContext | null = null;
let oscNode: OscillatorNode | null = null;
let gainNode: GainNode | null = null;

const resonanceStateLabel = computed(() => {
  if (props.derived.resonanceProximity >= 0.8) return t('resonanceTubes.peakResonance');
  if (props.derived.resonanceProximity >= 0.3) return t('resonanceTubes.nearResonance');
  return t('resonanceTubes.offResonance');
});

function initAudio() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();
    oscNode = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscNode.type = 'sine';
    oscNode.frequency.setValueAtTime(props.params.frequency, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);

    oscNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscNode.start();
  } catch (err) {
    console.warn('Web Audio initialization error:', err);
  }
}

function updateAudioVolume() {
  if (isAudioActive.value && audioCtx && oscNode && gainNode) {
    oscNode.frequency.setTargetAtTime(props.params.frequency, audioCtx.currentTime, 0.03);

    // Audio volume swells dramatically from 0.01 at baseline to 0.20 at peak resonance!
    const prox = props.derived.resonanceProximity;
    const targetGain = props.isRunning ? 0.01 + 0.18 * Math.pow(prox, 2.5) : 0.0001;
    gainNode.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.04);
  }
}

function toggleAudioSynth() {
  if (!audioCtx) {
    initAudio();
  }
  if (!audioCtx || !gainNode) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  isAudioActive.value = !isAudioActive.value;
  if (!isAudioActive.value) {
    gainNode.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.05);
  } else {
    updateAudioVolume();
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

  // Layout Geometry
  // Apparatus is drawn vertically on the center-left:
  // Total tube height: 1.15 m max
  const tubeTopY = 56;
  const tubeBottomY = h - 44;
  const tubeHeight = tubeBottomY - tubeTopY;
  const tubeWidth = 64;
  const tubeCenterX = w * 0.42;
  const tubeLeft = tubeCenterX - tubeWidth / 2;
  const tubeRight = tubeCenterX + tubeWidth / 2;

  const maxColumnLengthM = 1.15;
  const currentLengthM = Math.min(maxColumnLengthM, Math.max(0.02, props.params.columnLength));
  const waterSurfaceY = tubeTopY + (currentLengthM / maxColumnLengthM) * tubeHeight;

  // 1. Draw Lab Stand & Base Frame
  renderLabStand(ctx, tubeCenterX, tubeTopY, tubeBottomY, isDark);

  // 2. Draw Tuning Fork / Speaker Exciter at Tube Mouth
  renderTuningFork(ctx, tubeCenterX, tubeTopY, isDark);

  // 3. Draw Glass Cylinder & Water Fill
  renderGlassTubeAndWater(ctx, tubeLeft, tubeRight, tubeTopY, tubeBottomY, waterSurfaceY, isDark);

  // 4. Draw Connecting Rubber Hose & Leveling Reservoir
  renderWaterReservoir(ctx, tubeCenterX, tubeBottomY, waterSurfaceY, w, h, isDark);

  // 5. Draw Metric Ruler & Resonance Height Markers
  renderMetricRulerAndMarkers(ctx, tubeLeft - 18, tubeTopY, tubeHeight, maxColumnLengthM, isDark, textMuted);

  // 6. Draw Standing Wave Displacement Profiles
  if (showStandingWave.value) {
    renderStandingWave(ctx, tubeLeft, tubeRight, tubeTopY, waterSurfaceY, currentLengthM, isDark);
  }

  // 7. Resonance Glow Effect when tuned
  if (props.derived.resonanceProximity > 0.4) {
    renderResonanceGlow(ctx, tubeLeft, tubeRight, tubeTopY, waterSurfaceY, props.derived.resonanceProximity);
  }

  ctx.restore();
}

function renderLabStand(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  botY: number,
  isDark: boolean
) {
  ctx.save();
  // Heavy cast iron base
  ctx.fillStyle = isDark ? '#334155' : '#475569';
  ctx.fillRect(cx - 110, botY + 12, 220, 14);
  ctx.strokeStyle = isDark ? '#1e293b' : '#334155';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - 110, botY + 12, 220, 14);

  // Vertical steel stand rod on the left
  const rodX = cx - 90;
  ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
  ctx.fillRect(rodX - 4, topY - 20, 8, botY - topY + 34);

  // Support clamps holding tube
  const clampY1 = topY + 40;
  const clampY2 = botY - 60;
  ctx.fillStyle = '#475569';
  ctx.fillRect(rodX - 2, clampY1 - 5, cx - rodX - 32, 10);
  ctx.fillRect(rodX - 2, clampY2 - 5, cx - rodX - 32, 10);

  ctx.restore();
}

function renderTuningFork(
  ctx: CanvasRenderingContext2D,
  cx: number,
  mouthY: number,
  isDark: boolean
) {
  ctx.save();
  const forkY = mouthY - 32;
  const prongsGap = 16;
  const prongH = 24;

  // Vibration offset when running
  const vib = props.isRunning ? Math.sin(props.simTime * 80) * 1.8 : 0;

  // Fork handle
  ctx.fillStyle = '#94a3b8';
  ctx.strokeStyle = isDark ? '#cbd5e1' : '#475569';
  ctx.lineWidth = 2;
  ctx.fillRect(cx - 3, forkY - 14, 6, 14);
  ctx.strokeRect(cx - 3, forkY - 14, 6, 14);

  // Fork U-base
  ctx.beginPath();
  ctx.arc(cx, forkY, prongsGap / 2, 0, Math.PI);
  ctx.stroke();

  // Left prong
  ctx.beginPath();
  ctx.moveTo(cx - prongsGap / 2, forkY);
  ctx.lineTo(cx - prongsGap / 2 - vib, forkY - prongH);
  ctx.stroke();

  // Right prong
  ctx.beginPath();
  ctx.moveTo(cx + prongsGap / 2, forkY);
  ctx.lineTo(cx + prongsGap / 2 + vib, forkY - prongH);
  ctx.stroke();

  // Frequency tag
  ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
  ctx.font = 'bold 10px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${props.params.frequency} Hz`, cx, forkY - prongH - 6);

  ctx.restore();
}

function renderGlassTubeAndWater(
  ctx: CanvasRenderingContext2D,
  left: number,
  right: number,
  topY: number,
  botY: number,
  surfaceY: number,
  isDark: boolean
) {
  const w = right - left;

  ctx.save();
  // 1. Air column chamber inside tube (above water)
  ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(241, 245, 249, 0.55)';
  ctx.fillRect(left, topY, w, surfaceY - topY);

  // 2. Water volume (from waterSurfaceY down to botY)
  const waterH = botY - surfaceY;
  if (waterH > 0) {
    const waterGrad = ctx.createLinearGradient(left, surfaceY, right, surfaceY);
    waterGrad.addColorStop(0, '#0284c7');
    waterGrad.addColorStop(0.5, '#38bdf8');
    waterGrad.addColorStop(1, '#0284c7');

    ctx.fillStyle = waterGrad;
    ctx.fillRect(left, surfaceY, w, waterH);

    // Water surface meniscus curve
    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.ellipse(left + w / 2, surfaceY, w / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // 3. Transparent glass walls & highlights
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.65)' : 'rgba(100, 116, 139, 0.7)';
  ctx.lineWidth = 3;

  // Left wall
  ctx.beginPath();
  ctx.moveTo(left, topY);
  ctx.lineTo(left, botY);
  ctx.stroke();

  // Right wall
  ctx.beginPath();
  ctx.moveTo(right, topY);
  ctx.lineTo(right, botY);
  ctx.stroke();

  // Bottom seal
  ctx.beginPath();
  ctx.arc(left + w / 2, botY, w / 2, 0, Math.PI);
  ctx.stroke();

  // Open mouth top rim ellipse
  ctx.beginPath();
  ctx.ellipse(left + w / 2, topY, w / 2, 5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Glass reflection sheen
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(left + 6, topY + 10);
  ctx.lineTo(left + 6, botY - 10);
  ctx.stroke();

  ctx.restore();
}

function renderWaterReservoir(
  ctx: CanvasRenderingContext2D,
  tubeCx: number,
  tubeBotY: number,
  surfaceY: number,
  w: number,
  h: number,
  isDark: boolean
) {
  const resX = w * 0.76;
  const resW = 44;
  const resH = 80;
  const resY = surfaceY - resH / 2;

  ctx.save();
  // Flexible rubber tube connecting cylinder bottom to reservoir
  ctx.strokeStyle = isDark ? '#475569' : '#64748b';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tubeCx, tubeBotY + 10);
  ctx.bezierCurveTo(tubeCx + 40, h - 16, resX - 30, h - 16, resX, resY + resH);
  ctx.stroke();

  // Leveling Reservoir Bottle (Draggable)
  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.fillRect(resX - resW / 2, resY + 15, resW, resH - 15);

  ctx.strokeStyle = isDark ? '#94a3b8' : '#475569';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(resX - resW / 2, resY, resW, resH);

  // Bottle neck & handle
  ctx.fillStyle = '#64748b';
  ctx.fillRect(resX - 8, resY - 12, 16, 12);

  // Reservoir label / drag hint
  ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
  ctx.font = '10px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('مخزن آب', resX, resY + resH / 2 + 3);

  // Water level indicator line across
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(tubeCx + 34, surfaceY);
  ctx.lineTo(resX - resW / 2, surfaceY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

function renderMetricRulerAndMarkers(
  ctx: CanvasRenderingContext2D,
  rulerX: number,
  topY: number,
  totalH: number,
  maxMeters: number,
  _isDark: boolean,
  textMuted: string
) {
  ctx.save();
  ctx.strokeStyle = textMuted;
  ctx.lineWidth = 1;

  // Ruler vertical stem
  ctx.beginPath();
  ctx.moveTo(rulerX, topY);
  ctx.lineTo(rulerX, topY + totalH);
  ctx.stroke();

  // Metric ticks every 10 cm and 5 cm
  ctx.font = '9.5px Vazirmatn, sans-serif';
  ctx.textAlign = 'right';

  for (let cm = 0; cm <= 110; cm += 10) {
    const py = topY + (cm / 115) * totalH;
    ctx.beginPath();
    ctx.moveTo(rulerX, py);
    ctx.lineTo(rulerX - 6, py);
    ctx.stroke();

    if (cm % 20 === 0) {
      ctx.fillStyle = textMuted;
      ctx.fillText(`${cm}`, rulerX - 8, py + 3);
    }
  }

  // Resonant Height Markers (L1, L2, L3)
  if (showMarkers.value) {
    const peaks = props.derived.resonancePeaks;
    for (let i = 0; i < peaks.length; i++) {
      const p = peaks[i];
      if (p.isWithinReach) {
        const py = topY + (p.theoreticalLength / maxMeters) * totalH;

        // Tag arrow pointing at resonant height
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(rulerX + 4, py);
        ctx.lineTo(rulerX + 14, py - 6);
        ctx.lineTo(rulerX + 14, py + 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px Vazirmatn, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`L${p.harmonicOrder} (${(p.theoreticalLength * 100).toFixed(1)} cm)`, rulerX + 18, py + 3);
      }
    }
  }

  ctx.restore();
}

function renderStandingWave(
  ctx: CanvasRenderingContext2D,
  left: number,
  right: number,
  topY: number,
  surfaceY: number,
  columnLengthM: number,
  isDark: boolean
) {
  const columnH = surfaceY - topY;
  if (columnH <= 10) return;

  const profiles = calculateAcousticProfiles(60, props.simTime, props.params, props.derived);
  const cx = (left + right) / 2;
  const maxAmplPx = (right - left) * 0.38;

  ctx.save();
  // 1. Translucent envelope lobes
  ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.14)';
  ctx.beginPath();
  ctx.moveTo(cx, surfaceY);
  for (let i = 0; i < profiles.length; i++) {
    const pt = profiles[i];
    const py = surfaceY - (pt.x / columnLengthM) * columnH;
    const px = cx + pt.envelope * maxAmplPx;
    ctx.lineTo(px, py);
  }
  for (let i = profiles.length - 1; i >= 0; i--) {
    const pt = profiles[i];
    const py = surfaceY - (pt.x / columnLengthM) * columnH;
    const px = cx - pt.envelope * maxAmplPx;
    ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // 2. Oscillating displacement curve (Bright Blue)
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let i = 0; i < profiles.length; i++) {
    const pt = profiles[i];
    const py = surfaceY - (pt.x / columnLengthM) * columnH;
    const px = cx + pt.displacement * maxAmplPx;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // 3. Node (N) and Antinode (A) markers
  // Surface is Node (N)
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(cx, surfaceY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', cx, surfaceY + 3);

  // Mouth is Antinode (A)
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(cx, topY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText('A', cx, topY + 3);

  ctx.restore();
}

function renderResonanceGlow(
  ctx: CanvasRenderingContext2D,
  left: number,
  right: number,
  topY: number,
  _surfaceY: number,
  proximity: number
) {
  ctx.save();
  const cx = (left + right) / 2;
  const glowAlpha = Math.min(0.7, (proximity - 0.4) * 1.4);

  // Golden glow around tube mouth
  const radGrad = ctx.createRadialGradient(cx, topY, 5, cx, topY, 55);
  radGrad.addColorStop(0, `rgba(245, 158, 11, ${glowAlpha})`);
  radGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(cx, topY, 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Mouse / Touch Handlers for Dragging Water Level
function getScreenCoords(evt: MouseEvent | TouchEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const clientX = 'touches' in evt ? evt.touches[0].clientX : evt.clientX;
  const clientY = 'touches' in evt ? evt.touches[0].clientY : evt.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function onMouseDown(evt: MouseEvent) {
  const coords = getScreenCoords(evt);
  const canvas = canvasRef.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  const tubeTopY = 56;
  const tubeBottomY = h - 44;
  const tubeHeight = tubeBottomY - tubeTopY;
  const maxColumnLengthM = 1.15;
  const currentLengthM = props.params.columnLength;
  const waterSurfaceY = tubeTopY + (currentLengthM / maxColumnLengthM) * tubeHeight;

  // Check if click is near water surface or reservoir
  if (Math.abs(coords.y - waterSurfaceY) <= 30 || coords.x >= w * 0.65) {
    isDraggingWater = true;
  }
}

function onMouseMove(evt: MouseEvent) {
  if (!isDraggingWater) return;
  const coords = getScreenCoords(evt);
  const canvas = canvasRef.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const h = canvas.height / dpr;

  const tubeTopY = 56;
  const tubeBottomY = h - 44;
  const tubeHeight = tubeBottomY - tubeTopY;
  const maxColumnLengthM = 1.15;

  const clampedY = Math.max(tubeTopY + 10, Math.min(tubeBottomY - 10, coords.y));
  const newLengthM = ((clampedY - tubeTopY) / tubeHeight) * maxColumnLengthM;

  emit('update:columnLength', Number(newLengthM.toFixed(3)));
}

function onMouseUp() {
  isDraggingWater = false;
}

function onTouchStart(evt: TouchEvent) {
  const coords = getScreenCoords(evt);
  const canvas = canvasRef.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  const tubeTopY = 56;
  const tubeBottomY = h - 44;
  const tubeHeight = tubeBottomY - tubeTopY;
  const maxColumnLengthM = 1.15;
  const currentLengthM = props.params.columnLength;
  const waterSurfaceY = tubeTopY + (currentLengthM / maxColumnLengthM) * tubeHeight;

  if (Math.abs(coords.y - waterSurfaceY) <= 35 || coords.x >= w * 0.6) {
    isDraggingWater = true;
  }
}

function onTouchMove(evt: TouchEvent) {
  if (!isDraggingWater) return;
  const coords = getScreenCoords(evt);
  const canvas = canvasRef.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const h = canvas.height / dpr;

  const tubeTopY = 56;
  const tubeBottomY = h - 44;
  const tubeHeight = tubeBottomY - tubeTopY;
  const maxColumnLengthM = 1.15;

  const clampedY = Math.max(tubeTopY + 10, Math.min(tubeBottomY - 10, coords.y));
  const newLengthM = ((clampedY - tubeTopY) / tubeHeight) * maxColumnLengthM;

  emit('update:columnLength', Number(newLengthM.toFixed(3)));
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
  if (oscNode) {
    try {
      oscNode.stop();
      oscNode.disconnect();
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
    showStandingWave.value,
    showMarkers.value
  ],
  () => {
    updateAudioVolume();
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
  cursor: ns-resize;
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
