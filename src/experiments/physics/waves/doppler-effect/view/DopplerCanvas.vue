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
        <span class="badge-text">{{ regimeLabel }} (M = {{ derived.machNumber.toFixed(2) }})</span>
      </div>

      <div class="hud-badge sonic-boom-alert" v-if="derived.observerAcousticZone === 'sonic_boom'">
        💥 {{ $t('dopplerEffect.sonicBoom') }}!
      </div>

      <div class="hud-controls">
        <button
          class="tool-btn"
          :class="{ active: showMachCone }"
          @click="showMachCone = !showMachCone"
          title="Toggle Mach Cone & Shockwaves"
        >
          📐 {{ $t('dopplerEffect.tool_machCone') }}
        </button>
        <button
          class="tool-btn audio-btn"
          :class="{ active: isAudioActive }"
          @click="toggleAudioSynth"
          title="Toggle Doppler Audio Pitch"
        >
          {{ isAudioActive ? '🔊' : '🔇' }} {{ $t('dopplerEffect.tool_audioSynth') }}
        </button>
      </div>
    </div>

    <!-- Bottom Readout Bar -->
    <div class="bottom-metrics-bar">
      <div class="metric-item highlight">
        <span class="metric-label">f_obs:</span>
        <span class="metric-value ltr-island">
          {{ derived.observedFrequency2D > 0 ? derived.observedFrequency2D.toFixed(0) + ' Hz' : '0 Hz (Silence)' }}
        </span>
      </div>
      <div class="metric-item">
        <span class="metric-label">f_0:</span>
        <span class="metric-value ltr-island">{{ params.sourceFrequency.toFixed(0) }} Hz</span>
      </div>
      <div class="metric-item" v-if="derived.observedFrequency2D > 0">
        <span class="metric-label">Shift:</span>
        <span class="metric-value ltr-island">
          {{ (derived.pitchShiftCents > 0 ? '+' : '') + derived.pitchShiftCents.toFixed(0) }} cents
        </span>
      </div>
      <div class="metric-item" v-if="derived.isSupersonic">
        <span class="metric-label">μ (Mach Angle):</span>
        <span class="metric-value ltr-island">{{ derived.machAngleDeg.toFixed(1) }}°</span>
      </div>
      <div class="metric-item" v-else>
        <span class="metric-label">λ_ahead:</span>
        <span class="metric-value ltr-island">{{ derived.wavelengthAhead.toFixed(2) }} m</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type DopplerParams,
  type DopplerDerived,
  calculateMachLines
} from '../model/doppler-effect';

interface ActiveWavefront {
  id: number;
  birthSimTime: number;
  x: number;
  y: number;
}

const props = defineProps<{
  params: DopplerParams;
  derived: DopplerDerived;
  sourceX: number;
  simTime: number;
  isRunning: boolean;
  isDark: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:observerPos', pos: { x: number; y: number }): void;
}>();

const { t } = useI18n();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const showMachCone = ref(true);
const isAudioActive = ref(false);

let animationFrameId: number | null = null;
let isDraggingObserver = false;

// Dynamic active wavefronts list
const activeWavefronts = ref<ActiveWavefront[]>([]);
let nextWaveId = 1;
let lastEmitSimTime = -999;
let lastSimTime = 0;
const EMIT_INTERVAL_SEC = 0.12; // Simulation seconds between wave crest emissions

// Web Audio API Doppler Tone Generator
let audioCtx: AudioContext | null = null;
let oscNode: OscillatorNode | null = null;
let gainNode: GainNode | null = null;

const regimeLabel = computed(() => {
  if (props.derived.isSonicBarrier) return t('dopplerEffect.transonicState');
  if (props.derived.isSupersonic) return t('dopplerEffect.supersonicState');
  return t('dopplerEffect.subsonicState');
});

function initAudio() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();
    oscNode = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscNode.type = 'sine';
    oscNode.frequency.setValueAtTime(
      Math.max(20, props.derived.observedFrequency2D || props.params.sourceFrequency),
      audioCtx.currentTime
    );
    gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);

    oscNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscNode.start();
  } catch (err) {
    console.warn('Web Audio not allowed or unsupported:', err);
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
  if (isAudioActive.value) {
    gainNode.gain.setTargetAtTime(0.12, audioCtx.currentTime, 0.05);
  } else {
    gainNode.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.05);
  }
}

function updateAudioPitch() {
  if (isAudioActive.value && audioCtx && oscNode && gainNode) {
    if (props.derived.observedFrequency2D <= 0 || !props.isRunning) {
      gainNode.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.04);
    } else {
      const targetFreq = Math.max(30, Math.min(6000, props.derived.observedFrequency2D));
      oscNode.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.04);
      gainNode.gain.setTargetAtTime(0.12, audioCtx.currentTime, 0.04);
    }
  }
}

// World Domain: X ∈ [-100, 360], Y ∈ [-90, 90]
const worldWidth = 460;
const worldHeight = 180;
const worldCenterX = 130;
const worldCenterY = 0; // Flight path at Y=0

function worldToScreen(wx: number, wy: number, w: number, h: number) {
  const scale = Math.min(w / worldWidth, h / worldHeight);
  const cx = w / 2;
  const cy = h / 2;
  const sx = cx + (wx - worldCenterX) * scale;
  const sy = cy + (wy - worldCenterY) * scale;
  return { sx, sy, scale };
}

function screenToWorld(sx: number, sy: number, w: number, h: number) {
  const scale = Math.min(w / worldWidth, h / worldHeight);
  const cx = w / 2;
  const cy = h / 2;
  const wx = worldCenterX + (sx - cx) / scale;
  const wy = worldCenterY + (sy - cy) / scale;
  return { wx, wy };
}

function updateActiveWavefronts() {
  const currentSimTime = props.simTime;

  // If time reset/rewound, reset waves
  if (currentSimTime < lastSimTime || currentSimTime === 0) {
    activeWavefronts.value = [];
    lastEmitSimTime = -999;
  }
  lastSimTime = currentSimTime;

  // Emit new wavefront if elapsed simulation time exceeds interval
  if (props.isRunning && currentSimTime - lastEmitSimTime >= EMIT_INTERVAL_SEC) {
    lastEmitSimTime = currentSimTime;
    activeWavefronts.value.push({
      id: nextWaveId++,
      birthSimTime: currentSimTime,
      x: props.sourceX,
      y: props.params.sourceY
    });

    // Limit maximum active wavefronts in memory
    if (activeWavefronts.value.length > 40) {
      activeWavefronts.value.shift();
    }
  }

  // Filter out wavefronts that have expanded past screen limits
  const maxRadius = 450;
  const soundSpeed = props.params.soundSpeed;
  activeWavefronts.value = activeWavefronts.value.filter((wf) => {
    const age = currentSimTime - wf.birthSimTime;
    return age >= 0 && soundSpeed * age <= maxRadius;
  });
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

  // 1. Grid & Flight Path Centerline
  renderGrid(ctx, w, h, isDark, textMuted);

  // 2. Wavefront Crests
  renderWavefronts(ctx, w, h, isDark);

  // 3. Mach Cone & Shockwave Envelopes (for M >= 1)
  if (showMachCone.value && props.derived.isSupersonic) {
    renderMachCone(ctx, w, h, isDark);
  }

  // 4. Source & Observer Objects
  renderObserver(ctx, w, h, isDark);
  renderSource(ctx, w, h);

  // 5. Line of Sight Ray
  renderLineOfSight(ctx, w, h, isDark);

  ctx.restore();
}

function renderGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isDark: boolean,
  textMuted: string
) {
  const leftPt = worldToScreen(-120, 0, w, h);
  const rightPt = worldToScreen(380, 0, w, h);

  ctx.save();
  // Flight path centerline
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(100, 116, 139, 0.3)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, leftPt.sy);
  ctx.lineTo(w, rightPt.sy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Distance ticks along flight corridor
  ctx.font = '10px Vazirmatn, sans-serif';
  ctx.fillStyle = textMuted;
  ctx.textAlign = 'center';

  for (let wx = -100; wx <= 350; wx += 50) {
    const pt = worldToScreen(wx, 0, w, h);
    if (pt.sx >= 10 && pt.sx <= w - 10) {
      ctx.beginPath();
      ctx.moveTo(pt.sx, pt.sy - 4);
      ctx.lineTo(pt.sx, pt.sy + 4);
      ctx.stroke();
      ctx.fillText(`${wx}m`, pt.sx, pt.sy + 14);
    }
  }

  // Wind direction indicator in real mode
  if (props.params.realMode && Math.abs(props.params.windSpeed) > 0.5) {
    const windW = props.params.windSpeed;
    const arrowX = w - 65;
    const arrowY = 38;

    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(arrowX - 20, arrowY);
    ctx.lineTo(arrowX + 20, arrowY);
    ctx.stroke();

    const dir = windW >= 0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(arrowX + 20 * dir, arrowY);
    ctx.lineTo(arrowX + 12 * dir, arrowY - 4);
    ctx.lineTo(arrowX + 12 * dir, arrowY + 4);
    ctx.closePath();
    ctx.fill();

    ctx.font = '10px Vazirmatn, sans-serif';
    ctx.fillText(`Wind ${Math.abs(windW).toFixed(0)} m/s`, arrowX, arrowY + 14);
  }

  ctx.restore();
}

function renderWavefronts(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isDark: boolean
) {
  const { soundSpeed, windSpeed = 0, realMode } = props.params;
  const currentSimTime = props.simTime;
  const scale = worldToScreen(0, 0, w, h).scale;

  ctx.save();
  for (let i = 0; i < activeWavefronts.value.length; i++) {
    const wf = activeWavefronts.value[i];
    const age = currentSimTime - wf.birthSimTime;
    if (age < 0) continue;

    const currentRadius = soundSpeed * age;
    const radiusScreen = currentRadius * scale;
    if (radiusScreen <= 0.5) continue;

    const windDriftX = realMode ? windSpeed * age : 0;
    const centerScreen = worldToScreen(wf.x + windDriftX, wf.y, w, h);

    const lifeRatio = Math.max(0, 1 - currentRadius / 450);
    const alpha = Math.max(0.08, Math.min(0.9, realMode ? lifeRatio * 0.8 : lifeRatio));

    ctx.strokeStyle = isDark
      ? `rgba(56, 189, 248, ${alpha})`
      : `rgba(2, 132, 199, ${alpha})`;
    ctx.lineWidth = 1.6;

    ctx.beginPath();
    ctx.arc(centerScreen.sx, centerScreen.sy, radiusScreen, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function renderMachCone(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isDark: boolean
) {
  const machLines = calculateMachLines(
    props.sourceX,
    props.params.sourceY,
    props.params.sourceSpeed,
    props.params.soundSpeed,
    460
  );

  if (machLines.length < 2) return;

  const top1 = worldToScreen(machLines[0].x1, machLines[0].y1, w, h);
  const top2 = worldToScreen(machLines[0].x2, machLines[0].y2, w, h);
  const bot2 = worldToScreen(machLines[1].x2, machLines[1].y2, w, h);

  ctx.save();
  // Translucent shock zone inside cone
  ctx.fillStyle = isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.14)';
  ctx.beginPath();
  ctx.moveTo(top1.sx, top1.sy);
  ctx.lineTo(top2.sx, top2.sy);
  ctx.lineTo(bot2.sx, bot2.sy);
  ctx.closePath();
  ctx.fill();

  // Shockwave boundary lines (tangent to wave crests)
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(top1.sx, top1.sy);
  ctx.lineTo(top2.sx, top2.sy);
  ctx.moveTo(top1.sx, top1.sy);
  ctx.lineTo(bot2.sx, bot2.sy);
  ctx.stroke();

  // Mach cone half-angle arc
  const arcRadius = 38;
  const mu = props.derived.machAngleRad;
  const dir = props.params.sourceSpeed >= 0 ? 1 : -1;
  const baseAngle = dir > 0 ? Math.PI : 0;

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(top1.sx, top1.sy, arcRadius, baseAngle - mu, baseAngle + mu);
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 10.5px Vazirmatn, sans-serif';
  ctx.fillText(
    `μ = ${props.derived.machAngleDeg.toFixed(1)}°`,
    top1.sx - dir * (arcRadius + 18),
    top1.sy + 4
  );
  ctx.restore();
}

function renderSource(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pt = worldToScreen(props.sourceX, props.params.sourceY, w, h);
  const isSupersonic = props.derived.isSupersonic;
  const dir = props.params.sourceSpeed >= 0 ? 1 : -1;

  ctx.save();
  ctx.translate(pt.sx, pt.sy);
  if (dir < 0) {
    ctx.scale(-1, 1);
  }

  if (isSupersonic) {
    // Supersonic Delta-Wing Jet
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-14, -8);
    ctx.lineTo(-9, 0);
    ctx.lineTo(-14, 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Afterburner thrust flame
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-11, -3);
    ctx.lineTo(-24, 0);
    ctx.lineTo(-11, 3);
    ctx.closePath();
    ctx.fill();
  } else {
    // Subsonic Acoustic Vehicle / Siren Beacon
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pulse beacon center
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Direction arrow
    if (Math.abs(props.params.sourceSpeed) > 5) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-3, -4);
      ctx.lineTo(-3, 4);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

function renderObserver(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isDark: boolean
) {
  const pt = worldToScreen(props.params.observerX, props.params.observerY, w, h);
  const zone = props.derived.observerAcousticZone;

  ctx.save();
  ctx.translate(pt.sx, pt.sy);

  // Outer target ring - color changes based on acoustic zone
  let ringColor = '#10b981';
  if (zone === 'sonic_boom') ringColor = '#ef4444';
  else if (zone === 'silence') ringColor = '#64748b';

  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.stroke();

  // Listener icon / ear pin
  ctx.fillStyle = ringColor;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  // Observer label
  ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
  ctx.font = 'bold 11px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t('dopplerEffect.observerLabel'), 0, -18);

  ctx.restore();
}

function renderLineOfSight(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isDark: boolean
) {
  const sPt = worldToScreen(props.sourceX, props.params.sourceY, w, h);
  const oPt = worldToScreen(props.params.observerX, props.params.observerY, w, h);

  ctx.save();
  ctx.strokeStyle = isDark ? 'rgba(16, 185, 129, 0.45)' : 'rgba(5, 150, 105, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 4]);

  ctx.beginPath();
  ctx.moveTo(sPt.sx, sPt.sy);
  ctx.lineTo(oPt.sx, oPt.sy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// Mouse / Touch Event Handlers for Dragging Observer
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

  const oPt = worldToScreen(props.params.observerX, props.params.observerY, w, h);
  const dist = Math.hypot(coords.x - oPt.sx, coords.y - oPt.sy);

  if (dist <= 24) {
    isDraggingObserver = true;
  }
}

function onMouseMove(evt: MouseEvent) {
  if (!isDraggingObserver) return;
  const coords = getScreenCoords(evt);
  const canvas = canvasRef.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  const world = screenToWorld(coords.x, coords.y, w, h);
  emit('update:observerPos', {
    x: Math.round(Math.max(-80, Math.min(320, world.wx))),
    y: Math.round(Math.max(-75, Math.min(75, world.wy)))
  });
}

function onMouseUp() {
  isDraggingObserver = false;
}

function onTouchStart(evt: TouchEvent) {
  const coords = getScreenCoords(evt);
  const canvas = canvasRef.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  const oPt = worldToScreen(props.params.observerX, props.params.observerY, w, h);
  const dist = Math.hypot(coords.x - oPt.sx, coords.y - oPt.sy);

  if (dist <= 28) {
    isDraggingObserver = true;
  }
}

function onTouchMove(evt: TouchEvent) {
  if (!isDraggingObserver) return;
  const coords = getScreenCoords(evt);
  const canvas = canvasRef.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  const world = screenToWorld(coords.x, coords.y, w, h);
  emit('update:observerPos', {
    x: Math.round(Math.max(-80, Math.min(320, world.wx))),
    y: Math.round(Math.max(-75, Math.min(75, world.wy)))
  });
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
    updateActiveWavefronts();
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
    props.sourceX,
    props.simTime,
    props.isDark,
    showMachCone.value
  ],
  () => {
    updateActiveWavefronts();
    updateAudioPitch();
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

.sonic-boom-alert {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #ef4444;
  font-weight: 700;
  animation: pulse-ring 0.8s infinite;
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
