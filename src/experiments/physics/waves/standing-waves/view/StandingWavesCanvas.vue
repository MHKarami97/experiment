<template>
  <div class="canvas-container" ref="containerRef">
    <canvas ref="canvasRef"></canvas>

    <!-- Top Overlay Badge -->
    <div class="hud-overlay">
      <div class="hud-badge mode-badge">
        <span class="badge-dot" :class="{ 'pulse-active': isRunning }"></span>
        <span class="badge-text">{{ systemLabel }} ({{ harmonicLabel }})</span>
      </div>

      <div class="hud-controls">
        <button
          class="tool-btn"
          :class="{ active: showMarkers }"
          @click="showMarkers = !showMarkers"
          title="Toggle Nodes & Antinodes"
        >
          🔴 N / A
        </button>
        <button
          class="tool-btn"
          :class="{ active: showEnvelope }"
          @click="showEnvelope = !showEnvelope"
          title="Toggle Wave Envelope"
        >
          〰️ {{ $t('standingWaves.tool_envelope') }}
        </button>
      </div>
    </div>

    <!-- Bottom Readout Bar -->
    <div class="bottom-metrics-bar">
      <div class="metric-item">
        <span class="metric-label">f_res:</span>
        <span class="metric-value ltr-island">{{ derived.resonantFrequency.toFixed(1) }} Hz</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">λ:</span>
        <span class="metric-value ltr-island">{{ derived.wavelength.toFixed(2) }} m</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">v:</span>
        <span class="metric-value ltr-island">{{ derived.waveSpeed.toFixed(1) }} m/s</span>
      </div>
      <div class="metric-item highlight">
        <span class="metric-label">Nodes:</span>
        <span class="metric-value ltr-island">{{ derived.nodeCount }}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Antinodes:</span>
        <span class="metric-value ltr-island">{{ derived.antinodeCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type StandingWaveParams,
  type StandingWaveDerived,
  calculateWaveProfile,
  generateKundtParticles
} from '../model/standing-waves';

const props = defineProps<{
  params: StandingWaveParams;
  derived: StandingWaveDerived;
  simTime: number;
  isRunning: boolean;
  isDark: boolean;
}>();

const { t } = useI18n();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const showMarkers = ref(true);
const showEnvelope = ref(true);

let animationFrameId: number | null = null;

const systemLabel = computed(() => {
  if (props.params.system === 'string') return t('standingWaves.mode_string');
  if (props.params.system === 'open_pipe') return t('standingWaves.mode_open_pipe');
  return t('standingWaves.mode_closed_pipe');
});

const harmonicLabel = computed(() => {
  const n = props.params.harmonicNumber;
  return `n = ${n}`;
});

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

  if (props.params.system === 'string') {
    renderStringSystem(ctx, w, h, isDark, textColor, textMuted);
  } else {
    renderAcousticPipeSystem(ctx, w, h, isDark, textMuted);
  }

  ctx.restore();
}

/**
 * Tensioned String Standing Wave Renderer:
 * - Driver oscillator clamp at left
 * - Pulley / fixed clamp at right
 * - Translucent envelope lobes
 * - Oscillating string with node and antinode markers
 */
function renderStringSystem(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isDark: boolean,
  textColor: string,
  textMuted: string
) {
  const padLeft = 70;
  const padRight = 70;
  const plotW = w - padLeft - padRight;
  const centerY = h / 2 - 8;
  const scaleY = 16; // pixels per cm

  const L = props.derived.effectiveLength;
  const points = calculateWaveProfile(140, props.simTime, props.params, props.derived, 3.2);

  // 1. Draw Envelope Lobes (Persistence shadow)
  if (showEnvelope.value) {
    ctx.save();
    // Top envelope
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const sx = padLeft + (pt.x / L) * plotW;
      const sy = centerY - pt.envelope * scaleY;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    // Bottom envelope reverse
    for (let i = points.length - 1; i >= 0; i--) {
      const pt = points[i];
      const sx = padLeft + (pt.x / L) * plotW;
      const sy = centerY + pt.envelope * scaleY;
      ctx.lineTo(sx, sy);
    }
    ctx.closePath();

    const lobeGrad = ctx.createLinearGradient(padLeft, centerY - 60, padLeft, centerY + 60);
    lobeGrad.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
    lobeGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.08)');
    lobeGrad.addColorStop(1, 'rgba(16, 185, 129, 0.22)');
    ctx.fillStyle = lobeGrad;
    ctx.fill();

    // Envelope dashed outlines
    ctx.strokeStyle = isDark ? 'rgba(52, 211, 153, 0.45)' : 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const sx = padLeft + (points[i].x / L) * plotW;
      const sy = centerY - points[i].envelope * scaleY;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const sx = padLeft + (points[i].x / L) * plotW;
      const sy = centerY + points[i].envelope * scaleY;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 2. Baseline Equilibrium String Axis
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(padLeft, centerY);
  ctx.lineTo(padLeft + plotW, centerY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Live Oscillating String
  ctx.save();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const sx = padLeft + (pt.x / L) * plotW;
    const sy = centerY - pt.displacement * scaleY;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.restore();

  // 4. Node Markers (🔴 N) and Antinode Markers (🟢 A)
  if (showMarkers.value) {
    const nodes = props.derived.nodePositions;
    const antinodes = props.derived.antinodePositions;

    // Antinodes (A)
    ctx.font = 'bold 10px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < antinodes.length; i++) {
      const ax = padLeft + (antinodes[i] / L) * plotW;
      const ay = centerY - 52;

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(ax, ay, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText('A', ax, ay + 0.5);

      // Dash guide to antinode loop
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(ax, ay + 9);
      ctx.lineTo(ax, centerY - 38);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Nodes (N)
    for (let i = 0; i < nodes.length; i++) {
      const nx = padLeft + (nodes[i] / L) * plotW;
      const ny = centerY + 46;

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(nx, ny, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText('N', nx, ny + 0.5);

      // Guide line to node
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(nx, ny - 9);
      ctx.lineTo(nx, centerY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // 5. Left Driver Oscillator Clamp
  ctx.save();
  ctx.fillStyle = isDark ? '#334155' : '#cbd5e1';
  ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
  ctx.lineWidth = 2;
  ctx.fillRect(padLeft - 22, centerY - 32, 20, 64);
  ctx.strokeRect(padLeft - 22, centerY - 32, 20, 64);

  // Driver vibrating blade
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(padLeft - 6, centerY - 6, 8, 12);
  ctx.fillStyle = textColor;
  ctx.font = '10px Vazirmatn, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(t('standingWaves.vibrator'), padLeft - 26, centerY + 4);
  ctx.restore();

  // 6. Right End: Pulley & Hanging Weight
  ctx.save();
  const pulleyX = padLeft + plotW + 12;
  const pulleyR = 12;

  ctx.strokeStyle = isDark ? '#94a3b8' : '#475569';
  ctx.lineWidth = 2.5;
  ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
  ctx.beginPath();
  ctx.arc(pulleyX, centerY + pulleyR, pulleyR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hanging cord over pulley
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(padLeft + plotW, centerY);
  ctx.lineTo(pulleyX, centerY);
  ctx.arc(pulleyX, centerY + pulleyR, pulleyR, -Math.PI / 2, 0);
  ctx.lineTo(pulleyX + pulleyR, centerY + 65);
  ctx.stroke();

  // Suspended Weight Mass
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = isDark ? '#0f172a' : '#334155';
  ctx.lineWidth = 1.5;
  ctx.fillRect(pulleyX + pulleyR - 8, centerY + 65, 16, 24);
  ctx.strokeRect(pulleyX + pulleyR - 8, centerY + 65, 16, 24);

  ctx.fillStyle = textColor;
  ctx.font = '10px Vazirmatn, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${props.params.tension} N`, pulleyX + pulleyR + 12, centerY + 78);
  ctx.restore();

  // Dimension scale underneath
  ctx.save();
  const dimY = h - 52;
  ctx.strokeStyle = textMuted;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padLeft, dimY);
  ctx.lineTo(padLeft + plotW, dimY);
  ctx.moveTo(padLeft, dimY - 4);
  ctx.lineTo(padLeft, dimY + 4);
  ctx.moveTo(padLeft + plotW, dimY - 4);
  ctx.lineTo(padLeft + plotW, dimY + 4);
  ctx.stroke();

  ctx.fillStyle = textMuted;
  ctx.font = '11px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`L = ${L.toFixed(2)} m (λ = ${props.derived.wavelength.toFixed(2)} m)`, padLeft + plotW / 2, dimY + 14);
  ctx.restore();
}

/**
 * Acoustic Pipe Standing Wave Renderer (Open-Open and Open-Closed):
 * - Glass tube cylinder with open mouths / end cap
 * - Kundt's tube sound dust particles gathering at displacement nodes
 * - Superposed displacement wave curve (blue) and pressure perturbation curve (orange)
 */
function renderAcousticPipeSystem(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isDark: boolean,
  textMuted: string
) {
  const padLeft = 70;
  const padRight = 70;
  const plotW = w - padLeft - padRight;
  const centerY = h / 2 - 8;
  const tubeH = 68;

  const L = props.derived.effectiveLength;
  const isClosed = props.params.system === 'closed_pipe';

  // 1. Draw Glass Tube Chamber
  ctx.save();
  ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(241, 245, 249, 0.55)';
  ctx.fillRect(padLeft, centerY - tubeH / 2, plotW, tubeH);

  // Tube glass walls
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.55)' : 'rgba(100, 116, 139, 0.55)';
  ctx.lineWidth = 3;
  // Top wall
  ctx.beginPath();
  ctx.moveTo(padLeft, centerY - tubeH / 2);
  ctx.lineTo(padLeft + plotW, centerY - tubeH / 2);
  ctx.stroke();
  // Bottom wall
  ctx.beginPath();
  ctx.moveTo(padLeft, centerY + tubeH / 2);
  ctx.lineTo(padLeft + plotW, centerY + tubeH / 2);
  ctx.stroke();

  // Left boundary: closed cap or open bell mouth
  if (isClosed) {
    // Closed metallic reflector cap
    ctx.fillStyle = '#64748b';
    ctx.fillRect(padLeft - 10, centerY - tubeH / 2 - 3, 10, tubeH + 6);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(padLeft - 10, centerY - tubeH / 2 - 3, 10, tubeH + 6);
  } else {
    // Open left mouth rim
    ctx.beginPath();
    ctx.ellipse(padLeft, centerY, 5, tubeH / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Right mouth (always open)
  ctx.beginPath();
  ctx.ellipse(padLeft + plotW, centerY, 5, tubeH / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 2. Draw Kundt's Tube Dust / Particle Lattice
  const particles = generateKundtParticles(65, props.simTime, props.params, props.derived);
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const px = padLeft + (p.x / L) * plotW;
    const py = centerY + p.y * tubeH;

    // Particle color: lighter near displacement nodes
    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Draw Displacement Standing Wave Curve (Blue)
  const points = calculateWaveProfile(120, props.simTime, props.params, props.derived, 2.6);
  const scaleY = 12;

  ctx.save();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const sx = padLeft + (pt.x / L) * plotW;
    const sy = centerY - pt.displacement * scaleY;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();

  // Envelope of displacement (dashed cyan)
  if (showEnvelope.value) {
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const sx = padLeft + (points[i].x / L) * plotW;
      const sy = centerY - points[i].envelope * scaleY;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const sx = padLeft + (points[i].x / L) * plotW;
      const sy = centerY + points[i].envelope * scaleY;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  // 4. Nodes (N) and Antinodes (A)
  if (showMarkers.value) {
    const nodes = props.derived.nodePositions;
    const antinodes = props.derived.antinodePositions;

    ctx.font = 'bold 10px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < antinodes.length; i++) {
      const ax = padLeft + (antinodes[i] / L) * plotW;
      const ay = centerY - tubeH / 2 - 14;

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(ax, ay, 8.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText('A', ax, ay + 0.5);
    }

    for (let i = 0; i < nodes.length; i++) {
      const nx = padLeft + (nodes[i] / L) * plotW;
      const ny = centerY + tubeH / 2 + 14;

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(nx, ny, 8.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText('N', nx, ny + 0.5);
    }
  }

  // Dimension scale underneath
  ctx.save();
  const dimY = h - 52;
  ctx.strokeStyle = textMuted;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padLeft, dimY);
  ctx.lineTo(padLeft + plotW, dimY);
  ctx.stroke();

  ctx.fillStyle = textMuted;
  ctx.font = '11px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`L = ${L.toFixed(2)} m (f_res = ${props.derived.resonantFrequency.toFixed(1)} Hz)`, padLeft + plotW / 2, dimY + 14);
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
});

watch(
  () => [props.params, props.derived, props.simTime, props.isDark, showMarkers.value, showEnvelope.value],
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
