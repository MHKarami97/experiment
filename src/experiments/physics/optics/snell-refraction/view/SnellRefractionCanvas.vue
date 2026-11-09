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

    <!-- Top Overlay HUD -->
    <div class="hud-overlay">
      <div class="hud-badge status-badge" :class="{ 'tir-glow': derived.isTotalInternalReflection }">
        <span class="badge-dot" :class="{ 'tir-dot': derived.isTotalInternalReflection }"></span>
        <span class="badge-text">
          {{ derived.isTotalInternalReflection ? $t('snellRefraction.tirActive') : $t('snellRefraction.tirInactive') }}
        </span>
      </div>

      <div class="hud-controls">
        <button
          class="tool-btn"
          :class="{ active: showProtractor }"
          @click="showProtractor = !showProtractor"
          title="Toggle Protractor"
        >
          📐 {{ showProtractor ? 'Protractor ON' : 'Protractor OFF' }}
        </button>
        <button
          class="tool-btn"
          :class="{ active: showNormal }"
          @click="showNormal = !showNormal"
          title="Toggle Surface Normal"
        >
          📏 Normal
        </button>
        <button
          class="tool-btn"
          :class="{ active: showAngles }"
          @click="showAngles = !showAngles"
          title="Toggle Angle Readouts"
        >
          🏷️ Angles
        </button>
      </div>
    </div>

    <!-- Bottom Readout Strip -->
    <div class="bottom-metrics-bar">
      <div class="metric-item highlight">
        <span class="metric-label">θ₁ (Incident):</span>
        <span class="metric-value ltr-island">{{ derived.theta1Deg.toFixed(1) }}°</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">θ₂ (Refracted):</span>
        <span class="metric-value ltr-island">
          {{ derived.theta2Deg !== null ? derived.theta2Deg.toFixed(1) + '°' : 'TIR' }}
        </span>
      </div>
      <div class="metric-item">
        <span class="metric-label">θ_r (Reflected):</span>
        <span class="metric-value ltr-island">{{ derived.thetaReflectedDeg.toFixed(1) }}°</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">R (Reflectance):</span>
        <span class="metric-value ltr-island">{{ (derived.reflectance * 100).toFixed(1) }}%</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">T (Transmittance):</span>
        <span class="metric-value ltr-island">{{ (derived.transmittance * 100).toFixed(1) }}%</span>
      </div>
      <div class="metric-item" v-if="derived.criticalAngleDeg !== null">
        <span class="metric-label">θ_c (Critical):</span>
        <span class="metric-value ltr-island">{{ derived.criticalAngleDeg.toFixed(1) }}°</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type SnellParams,
  type SnellDerived,
  STANDARD_MATERIALS
} from '../model/snell-refraction';

const props = defineProps<{
  params: SnellParams;
  derived: SnellDerived;
  simTime: number;
  isRunning: boolean;
  isDark: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:theta1Deg', angle: number): void;
}>();

const { t } = useI18n();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const showProtractor = ref(true);
const showNormal = ref(true);
const showAngles = ref(true);

let isDraggingLaser = false;
let animationFrameId: number | null = null;

// Calculate laser color from wavelength in nm
const laserColor = computed(() => {
  if (props.params.whiteLight) return '#f8fafc';
  const w = props.params.wavelengthNm;
  if (w >= 380 && w < 440) return '#8b5cf6'; // Violet
  if (w >= 440 && w < 490) return '#3b82f6'; // Blue
  if (w >= 490 && w < 510) return '#06b6d4'; // Cyan
  if (w >= 510 && w < 580) return '#10b981'; // Green
  if (w >= 580 && w < 620) return '#f59e0b'; // Amber
  return '#ef4444'; // Red (620 to 750 nm)
});

// Canvas Coordinate Systems and Drawing
function render() {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = container.clientWidth;
  const height = container.clientHeight;

  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  // Optical bench center point (boundary intersection)
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.42;

  // 1. Draw Media Backgrounds
  drawMediaBackground(ctx, width, height, cx, cy, radius);

  // 2. Draw Protractor scale if active
  if (showProtractor.value) {
    drawProtractor(ctx, cx, cy, radius);
  }

  // 3. Draw Normal Line
  if (showNormal.value) {
    drawNormalLine(ctx, cx, cy, height);
  }

  // 4. Draw Light Rays (Incident, Reflected, Refracted)
  drawLightRays(ctx, cx, cy, radius);

  // 5. Draw Angle Arcs & Labels
  if (showAngles.value) {
    drawAngleLabels(ctx, cx, cy, radius);
  }

  // 6. Draw Laser Source Emitter
  drawLaserEmitter(ctx, cx, cy, radius);

  ctx.restore();
}

function drawMediaBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number
) {
  const isDark = props.isDark;

  // Medium 1 (Top)
  const mat1 = STANDARD_MATERIALS.find((m) => Math.abs(m.n - props.params.n1) < 0.05);
  ctx.fillStyle = mat1 ? mat1.color : isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.8)';
  ctx.fillRect(0, 0, width, cy);

  // Medium 2 (Bottom)
  if (props.params.geometry === 'semicircular') {
    // Semicircular glass block centered at (cx, cy) with flat top
    ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.5)';
    ctx.fillRect(0, cy, width, height - cy);

    const mat2 = STANDARD_MATERIALS.find((m) => Math.abs(m.n - props.params.n2) < 0.05);
    ctx.fillStyle = mat2 ? mat2.color : isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.12)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.95, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Planar flat interface
    const mat2 = STANDARD_MATERIALS.find((m) => Math.abs(m.n - props.params.n2) < 0.05);
    ctx.fillStyle = mat2 ? mat2.color : isDark ? 'rgba(59, 130, 246, 0.16)' : 'rgba(59, 130, 246, 0.12)';
    ctx.fillRect(0, cy, width, height - cy);
  }

  // Interface Boundary Line
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(width, cy);
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Media Labels
  ctx.font = '12px Vazirmatn, sans-serif';
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 41, 59, 0.7)';
  ctx.textAlign = 'left';
  ctx.fillText(`Medium 1 (n₁ = ${props.params.n1.toFixed(3)})`, 20, cy - 14);
  ctx.fillText(`Medium 2 (n₂ = ${props.params.n2.toFixed(3)})`, 20, cy + 24);
}

function drawProtractor(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  const isDark = props.isDark;
  ctx.save();

  // Circular scale outline
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Degree ticks
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.45)';
  ctx.font = '9px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let deg = 0; deg < 360; deg += 5) {
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 10 === 0;
    const isQuadrant = deg % 90 === 0;
    const tickLen = isQuadrant ? 14 : isMajor ? 10 : 5;

    const x1 = cx + (radius - tickLen) * Math.cos(rad);
    const y1 = cy + (radius - tickLen) * Math.sin(rad);
    const x2 = cx + radius * Math.cos(rad);
    const y2 = cy + radius * Math.sin(rad);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = isMajor ? 1.5 : 0.8;
    ctx.stroke();

    if (isMajor && deg % 30 === 0) {
      // Angle relative to normal (top normal is 270°, bottom normal is 90°)
      let normAngle = 0;
      if (deg <= 90) normAngle = 90 - deg;
      else if (deg <= 180) normAngle = deg - 90;
      else if (deg <= 270) normAngle = 270 - deg;
      else normAngle = deg - 270;

      const lx = cx + (radius - 22) * Math.cos(rad);
      const ly = cy + (radius - 22) * Math.sin(rad);
      ctx.fillText(`${normAngle}°`, lx, ly);
    }
  }

  ctx.restore();
}

function drawNormalLine(
  ctx: CanvasRenderingContext2D,
  cx: number,
  _cy: number,
  height: number
) {
  const isDark = props.isDark;
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.moveTo(cx, 10);
  ctx.lineTo(cx, height - 10);
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.font = '10px Vazirmatn, sans-serif';
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  ctx.textAlign = 'center';
  ctx.fillText(t('snellRefraction.normalLine'), cx, 24);
  ctx.restore();
}

function drawLightRays(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  const { theta1Rad, theta2Rad, isTotalInternalReflection, reflectance, transmittance, spectralRays } = props.derived;
  const rayLen = radius * 1.05;
  const color = laserColor.value;

  ctx.save();

  // 1. Incident Ray: incoming from top-left (angle theta1 relative to -y normal)
  // In screen coords: -y is angle -90° (or 270°). Angle of incidence tilts left by theta1: 270° - theta1
  const incidentAngleScreen = (3 * Math.PI) / 2 - theta1Rad;
  const sourceX = cx + rayLen * Math.cos(incidentAngleScreen);
  const sourceY = cy + rayLen * Math.sin(incidentAngleScreen);

  // Outer glow for incident beam
  ctx.beginPath();
  ctx.moveTo(sourceX, sourceY);
  ctx.lineTo(cx, cy);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.stroke();

  // Core laser incident line
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = '#ffffff';
  ctx.shadowBlur = 0;
  ctx.stroke();

  // Central point of incidence glow
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fill();

  // 2. Reflected Ray: reflects at theta1 into top-right (270° + theta1)
  const reflectedAngleScreen = (3 * Math.PI) / 2 + theta1Rad;
  const rx = cx + rayLen * Math.cos(reflectedAngleScreen);
  const ry = cy + rayLen * Math.sin(reflectedAngleScreen);

  // Opacity & width scaled with reflectance R
  const rAlpha = Math.max(0.12, reflectance);
  const rWidth = Math.max(1.2, 3.5 * reflectance);

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(rx, ry);
  ctx.strokeStyle = color;
  ctx.globalAlpha = rAlpha;
  ctx.lineWidth = rWidth;
  ctx.shadowColor = color;
  ctx.shadowBlur = isTotalInternalReflection ? 14 : 6;
  ctx.stroke();

  // 3. Refracted Ray: propagates into Medium 2 (angle from +y normal is theta2)
  if (!isTotalInternalReflection) {
    if (props.params.whiteLight && spectralRays) {
      // White light rainbow dispersion fan
      for (const ray of spectralRays) {
        if (ray.theta2Deg !== null) {
          const t2Rad = (ray.theta2Deg * Math.PI) / 180;
          const refractedAngleScreen = Math.PI / 2 - t2Rad;
          const fx = cx + rayLen * Math.cos(refractedAngleScreen);
          const fy = cy + rayLen * Math.sin(refractedAngleScreen);

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(fx, fy);
          ctx.strokeStyle = ray.color;
          ctx.globalAlpha = transmittance;
          ctx.lineWidth = 2.0;
          ctx.shadowColor = ray.color;
          ctx.shadowBlur = 6;
          ctx.stroke();
        }
      }
    } else if (theta2Rad !== null) {
      // Monochromatic refracted beam
      const refractedAngleScreen = Math.PI / 2 - theta2Rad;
      const fx = cx + rayLen * Math.cos(refractedAngleScreen);
      const fy = cy + rayLen * Math.sin(refractedAngleScreen);

      const tAlpha = Math.max(0.05, transmittance);
      const tWidth = Math.max(1.0, 3.5 * transmittance);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(fx, fy);
      ctx.strokeStyle = color;
      ctx.globalAlpha = tAlpha;
      ctx.lineWidth = tWidth;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawAngleLabels(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  const { theta1Rad, theta1Deg, theta2Rad, theta2Deg, isTotalInternalReflection } = props.derived;
  const arcRadius = radius * 0.32;

  ctx.save();
  ctx.font = '11px Vazirmatn, sans-serif';
  ctx.lineWidth = 1.2;

  // Incident Angle Arc θ1
  const startInc = (3 * Math.PI) / 2 - theta1Rad;
  const endInc = (3 * Math.PI) / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, arcRadius, startInc, endInc);
  ctx.strokeStyle = '#f59e0b';
  ctx.stroke();

  // θ1 Label
  const midInc = (startInc + endInc) / 2;
  const tx1 = cx + (arcRadius + 14) * Math.cos(midInc);
  const ty1 = cy + (arcRadius + 14) * Math.sin(midInc);
  ctx.fillStyle = '#f59e0b';
  ctx.textAlign = 'center';
  ctx.fillText(`θ₁ = ${theta1Deg.toFixed(1)}°`, tx1, ty1);

  // Refracted Angle Arc θ2 (if not TIR)
  if (!isTotalInternalReflection && theta2Rad !== null && theta2Deg !== null) {
    const startRef = Math.PI / 2 - theta2Rad;
    const endRef = Math.PI / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, arcRadius, startRef, endRef);
    ctx.strokeStyle = '#10b981';
    ctx.stroke();

    const midRef = (startRef + endRef) / 2;
    const tx2 = cx + (arcRadius + 16) * Math.cos(midRef);
    const ty2 = cy + (arcRadius + 16) * Math.sin(midRef);
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'center';
    ctx.fillText(`θ₂ = ${theta2Deg.toFixed(1)}°`, tx2, ty2);
  } else if (isTotalInternalReflection) {
    // TIR badge at boundary
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ Total Internal Reflection (TIR)', cx + 70, cy + 30);
  }

  ctx.restore();
}

function drawLaserEmitter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  const { theta1Rad } = props.derived;
  const rayLen = radius * 1.05;
  const incidentAngleScreen = (3 * Math.PI) / 2 - theta1Rad;
  const sourceX = cx + rayLen * Math.cos(incidentAngleScreen);
  const sourceY = cy + rayLen * Math.sin(incidentAngleScreen);

  ctx.save();
  ctx.translate(sourceX, sourceY);
  // Rotate laser body to point toward (cx, cy)
  ctx.rotate(incidentAngleScreen + Math.PI);

  // Metallic Laser Barrel Body
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-42, -10, 42, 20, [4, 0, 0, 4]);
  ctx.fill();
  ctx.stroke();

  // Brass Emitter Nozzle
  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, -6, 8, 12);

  // Power Indicator LED
  ctx.beginPath();
  ctx.arc(-22, 0, 3, 0, 2 * Math.PI);
  ctx.fillStyle = laserColor.value;
  ctx.shadowColor = laserColor.value;
  ctx.shadowBlur = 8;
  ctx.fill();

  ctx.restore();
}

// Mouse & Touch Drag Interactions to Rotate Laser
function updateAngleFromPointer(clientX: number, clientY: number) {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;

  const dx = clientX - rect.left - cx;
  const dy = clientY - rect.top - cy;

  // We want angle relative to top vertical (-y direction)
  // angle = atan2(dx, -dy) in radians
  let angleRad = Math.atan2(-dx, -dy);
  let angleDeg = (angleRad * 180) / Math.PI;

  // Clamp angle to valid incident range [0°, 85°] on the top-left quadrant
  if (angleDeg < 0) angleDeg = 0;
  if (angleDeg > 85) angleDeg = 85;

  emit('update:theta1Deg', Number(angleDeg.toFixed(1)));
}

function onMouseDown(e: MouseEvent) {
  isDraggingLaser = true;
  updateAngleFromPointer(e.clientX, e.clientY);
}

function onMouseMove(e: MouseEvent) {
  if (!isDraggingLaser) return;
  updateAngleFromPointer(e.clientX, e.clientY);
}

function onMouseUp() {
  isDraggingLaser = false;
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length > 0) {
    isDraggingLaser = true;
    updateAngleFromPointer(e.touches[0].clientX, e.touches[0].clientY);
  }
}

function onTouchMove(e: TouchEvent) {
  if (!isDraggingLaser || e.touches.length === 0) return;
  updateAngleFromPointer(e.touches[0].clientX, e.touches[0].clientY);
}

// Animation & Re-render Loop
function animLoop() {
  render();
  animationFrameId = requestAnimationFrame(animLoop);
}

onMounted(() => {
  render();
  animationFrameId = requestAnimationFrame(animLoop);
});

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
});

watch(
  () => [props.params, props.derived, props.isDark],
  () => {
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
  overflow: hidden;
  user-select: none;
}

canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}

canvas:active {
  cursor: grabbing;
}

/* Top HUD Overlay */
.hud-overlay {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
  z-index: 10;
}

.hud-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
  pointer-events: auto;
  transition: all 0.2s ease;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.hud-badge.tir-glow {
  border-color: #ef4444;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
}

.badge-dot.tir-dot {
  background: #ef4444;
  box-shadow: 0 0 8px #ef4444;
}

.hud-controls {
  display: flex;
  gap: 6px;
  pointer-events: auto;
}

.tool-btn {
  padding: 6px 10px;
  font-size: 11.5px;
  font-weight: 500;
  border-radius: var(--radius-md);
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-btn:hover {
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.25);
}

.tool-btn.active {
  color: #3b82f6;
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.15);
}

/* Bottom Metrics Bar */
.bottom-metrics-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 6px 14px;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 11.5px;
  z-index: 10;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-item.highlight {
  color: #f59e0b;
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
    font-size: 10.5px;
    padding: 4px 8px;
    gap: 6px;
  }
}
</style>
