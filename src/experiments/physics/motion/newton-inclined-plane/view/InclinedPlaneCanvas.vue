<template>
  <div ref="wrapperRef" class="inclined-plane-canvas-wrapper">
    <canvas ref="canvasRef" class="scene-canvas"></canvas>

    <!-- Interactive HUD Overlay -->
    <div class="hud-panel glass-card" dir="rtl">
      <div class="hud-row">
        <span class="hud-label">{{ $t('inclinedPlane.hud.pos') }}</span>
        <span class="hud-value ltr">{{ state.s.toFixed(2) }} m</span>
      </div>
      <div class="hud-row">
        <span class="hud-label">{{ $t('inclinedPlane.hud.velocity') }}</span>
        <span class="hud-value ltr">{{ state.v.toFixed(2) }} m/s</span>
      </div>
      <div class="hud-row">
        <span class="hud-label">{{ $t('inclinedPlane.hud.acceleration') }}</span>
        <span class="hud-value ltr">{{ state.a.toFixed(2) }} m/s²</span>
      </div>
      <div class="hud-row">
        <span class="hud-label">{{ $t('inclinedPlane.hud.normal') }}</span>
        <span class="hud-value ltr">{{ state.normalForce.toFixed(1) }} N</span>
      </div>
      <div class="hud-row">
        <span class="hud-label">{{ $t('inclinedPlane.hud.friction') }}</span>
        <span class="hud-value ltr">{{ state.frictionForce.toFixed(1) }} N</span>
      </div>
      <div class="hud-row">
        <span class="hud-label">{{ $t('inclinedPlane.hud.netForce') }}</span>
        <span class="hud-value ltr">{{ state.netForce.toFixed(1) }} N</span>
      </div>
      <div class="hud-status-badge" :class="state.isStatic ? 'badge-static' : 'badge-moving'">
        {{ state.isStatic ? $t('inclinedPlane.hud.stateStatic') : $t('inclinedPlane.hud.stateMoving') }}
      </div>
    </div>

    <!-- Free Body Diagram Toggle Button -->
    <button
      type="button"
      class="btn-fbd-toggle touch-target"
      :class="{ active: showFBD }"
      @click="showFBD = !showFBD"
    >
      🎯 {{ showFBD ? 'مخفی‌سازی نیروها' : 'نمایش نیروها (FBD)' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { InclinedPlaneParams, InclinedPlaneState } from '../model/inclinedPlane';

const props = defineProps<{
  params: InclinedPlaneParams;
  state: InclinedPlaneState;
  mode: 'ideal' | 'real';
}>();

const wrapperRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const showFBD = ref(true);

let animId: number | null = null;

function render() {
  const canvas = canvasRef.value;
  const wrapper = wrapperRef.value;
  if (!canvas || !wrapper) return;

  const width = wrapper.clientWidth;
  const height = wrapper.clientHeight;
  if (width <= 0 || height <= 0) return;

  const dpr = window.devicePixelRatio || 1;
  const pixelWidth = Math.floor(width * dpr);
  const pixelHeight = Math.floor(height * dpr);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  // Background Gradient
  const isDark = document.documentElement.classList.contains('dark') ||
    document.documentElement.getAttribute('data-theme') === 'dark';

  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (isDark) {
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
  } else {
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(1, '#e2e8f0');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Incline Geometry Setup
  const groundY = height - 60;
  const rampOriginX = 90;
  const maxRampPixels = Math.min(width - 180, 700);

  const angleRad = (props.params.angle * Math.PI) / 180;
  const rampLengthMeters = props.params.inclineLength || 20;
  const scale = maxRampPixels / rampLengthMeters; // pixels per meter

  const rampPixelLength = rampLengthMeters * scale;
  const rampTopX = rampOriginX + rampPixelLength * Math.cos(angleRad);
  const rampTopY = groundY - rampPixelLength * Math.sin(angleRad);

  // Ground Line
  ctx.beginPath();
  ctx.moveTo(30, groundY);
  ctx.lineTo(width - 30, groundY);
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Hatching under ground
  ctx.beginPath();
  for (let x = 30; x < width - 30; x += 15) {
    ctx.moveTo(x, groundY);
    ctx.lineTo(x - 8, groundY + 12);
  }
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw Ramp Triangle
  ctx.beginPath();
  ctx.moveTo(rampOriginX, groundY);
  ctx.lineTo(rampTopX, rampTopY);
  ctx.lineTo(rampTopX, groundY);
  ctx.closePath();

  const rampGrad = ctx.createLinearGradient(rampOriginX, groundY, rampTopX, rampTopY);
  if (isDark) {
    rampGrad.addColorStop(0, '#1e293b');
    rampGrad.addColorStop(1, '#334155');
  } else {
    rampGrad.addColorStop(0, '#cbd5e1');
    rampGrad.addColorStop(1, '#94a3b8');
  }
  ctx.fillStyle = rampGrad;
  ctx.fill();

  ctx.strokeStyle = isDark ? '#64748b' : '#475569';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Incline Surface Texture & Meter Ticks
  ctx.save();
  ctx.translate(rampOriginX, groundY);
  ctx.rotate(-angleRad);

  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
  ctx.font = '10px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';

  const tickStep = rampLengthMeters > 15 ? 5 : 2;
  for (let m = 0; m <= rampLengthMeters; m += tickStep) {
    const xPos = m * scale;
    ctx.beginPath();
    ctx.moveTo(xPos, 0);
    ctx.lineTo(xPos, 8);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillText(`${m}m`, xPos, 20);
  }
  ctx.restore();

  // Angle Arc
  const arcRadius = 45;
  ctx.beginPath();
  ctx.arc(rampOriginX, groundY, arcRadius, 0, -angleRad, true);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 12px Vazirmatn, sans-serif';
  ctx.fillText(
    `θ = ${props.params.angle.toFixed(1)}°`,
    rampOriginX + arcRadius + 10,
    groundY - 10
  );

  // Position of Block along the incline
  const blockS = Math.max(0, Math.min(rampLengthMeters, props.state.s));
  const blockDistancePixels = blockS * scale;

  // Block Center Coordinates in world space
  // Point on incline surface:
  const surfaceX = rampOriginX + blockDistancePixels * Math.cos(angleRad);
  const surfaceY = groundY - blockDistancePixels * Math.sin(angleRad);

  const blockWidth = 46;
  const blockHeight = 28;

  // Center of block is perpendicular to surface by blockHeight/2
  const normalAngle = angleRad + Math.PI / 2;
  const blockCenterX = surfaceX + (blockHeight / 2) * Math.cos(normalAngle);
  const blockCenterY = surfaceY - (blockHeight / 2) * Math.sin(normalAngle);

  // Draw Block (rotated to incline)
  ctx.save();
  ctx.translate(blockCenterX, blockCenterY);
  ctx.rotate(-angleRad);

  // Block Drop Shadow
  ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(-blockWidth / 2 + 2, blockHeight / 2 - 2, blockWidth, 4);

  // Block Body
  const blockGrad = ctx.createLinearGradient(0, -blockHeight / 2, 0, blockHeight / 2);
  if (props.state.isStatic) {
    blockGrad.addColorStop(0, '#eab308');
    blockGrad.addColorStop(1, '#ca8a04');
  } else {
    blockGrad.addColorStop(0, '#38bdf8');
    blockGrad.addColorStop(1, '#0284c7');
  }
  ctx.fillStyle = blockGrad;
  ctx.beginPath();
  ctx.roundRect(-blockWidth / 2, -blockHeight / 2, blockWidth, blockHeight, 4);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Mass Label inside block
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${props.params.mass} kg`, 0, 0);

  ctx.restore();

  // Draw Pulling Cable if F_pull > 0
  if (props.params.fPull > 0) {
    ctx.beginPath();
    ctx.moveTo(surfaceX, surfaceY);
    ctx.lineTo(rampTopX, rampTopY);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw Free Body Diagram (FBD) Vectors
  if (showFBD.value) {
    drawFBDVectors(ctx, blockCenterX, blockCenterY, angleRad);
  }

  ctx.restore();
}

function drawFBDVectors(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angleRad: number
) {
  const forceScale = 1.4; // pixels per Newton

  // 1. Gravity Vector (straight down, red)
  const fg = props.params.mass * props.params.gravity;
  const fgLen = Math.min(90, Math.max(25, fg * forceScale));
  drawArrow(ctx, cx, cy, cx, cy + fgLen, '#ef4444', `W = ${fg.toFixed(1)} N`);

  // 2. Normal Force Vector (perpendicular to surface outwards, cyan)
  const fn = props.state.normalForce;
  const fnLen = Math.min(80, Math.max(20, fn * forceScale));
  const normalAngle = angleRad + Math.PI / 2;
  const fnEndX = cx + fnLen * Math.cos(normalAngle);
  const fnEndY = cy - fnLen * Math.sin(normalAngle);
  drawArrow(ctx, cx, cy, fnEndX, fnEndY, '#06b6d4', `N = ${fn.toFixed(1)} N`);

  // 3. Friction Force Vector (parallel to incline, opposing motion or drive, amber)
  const ff = props.state.frictionForce;
  if (Math.abs(ff) > 0.5) {
    const ffLen = Math.min(70, Math.max(15, Math.abs(ff) * forceScale));
    // positive friction means uphill (along incline direction)
    const fAngle = ff > 0 ? angleRad : angleRad + Math.PI;
    const ffEndX = cx + ffLen * Math.cos(fAngle);
    const ffEndY = cy - ffLen * Math.sin(fAngle);
    drawArrow(ctx, cx, cy, ffEndX, ffEndY, '#f59e0b', `f = ${Math.abs(ff).toFixed(1)} N`);
  }

  // 4. Applied Pulling Force (along incline, emerald)
  const fp = props.params.fPull;
  if (Math.abs(fp) > 0.5) {
    const fpLen = Math.min(80, Math.max(15, Math.abs(fp) * forceScale));
    const pAngle = fp > 0 ? angleRad : angleRad + Math.PI;
    const fpEndX = cx + fpLen * Math.cos(pAngle);
    const fpEndY = cy - fpLen * Math.sin(pAngle);
    drawArrow(ctx, cx, cy, fpEndX, fpEndY, '#10b981', `F = ${Math.abs(fp).toFixed(1)} N`);
  }

  // 5. Velocity Vector (if moving, blue)
  const v = props.state.v;
  if (Math.abs(v) > 0.1) {
    const vLen = Math.min(65, Math.abs(v) * 6);
    const vAngle = v > 0 ? angleRad : angleRad + Math.PI;
    const vEndX = cx + vLen * Math.cos(vAngle);
    const vEndY = cy - vLen * Math.sin(vAngle);
    drawArrow(ctx, cx, cy - 25, vEndX, vEndY - 25, '#3b82f6', `v = ${v.toFixed(2)} m/s`);
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  label?: string
) {
  const headLen = 9;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  if (label) {
    ctx.save();
    ctx.font = 'bold 10px Vazirmatn, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label, toX + 12 * Math.cos(angle), toY + 12 * Math.sin(angle));
    ctx.restore();
  }
}

function startLoop() {
  function loop() {
    render();
    animId = requestAnimationFrame(loop);
  }
  animId = requestAnimationFrame(loop);
}

onMounted(() => {
  startLoop();
});

onBeforeUnmount(() => {
  if (animId !== null) {
    cancelAnimationFrame(animId);
  }
});

defineExpose({
  getCanvas: () => canvasRef.value
});
</script>

<style scoped>
.inclined-plane-canvas-wrapper {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--radius-xl);
}

.scene-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.hud-panel {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 180px;
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  font-size: var(--text-xs);
  pointer-events: none;
}

.hud-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
}

.hud-label {
  color: var(--text-secondary);
}

.hud-value {
  color: var(--text-primary);
  font-weight: 700;
}

.hud-status-badge {
  margin-top: var(--space-2);
  text-align: center;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 11px;
}

.badge-static {
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.4);
}

.badge-moving {
  background: rgba(14, 165, 233, 0.2);
  color: #0ea5e9;
  border: 1px solid rgba(14, 165, 233, 0.4);
}

.btn-fbd-toggle {
  position: absolute;
  bottom: var(--space-3);
  left: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--surface-glass);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all var(--duration-fast);
}

.btn-fbd-toggle:hover {
  background: var(--surface-overlay);
}

.btn-fbd-toggle.active {
  background: var(--primary-surface);
  color: var(--primary);
  border-color: var(--primary);
}

@media (max-width: 640px) {
  .hud-panel {
    top: var(--space-2);
    right: var(--space-2);
    padding: var(--space-2);
    min-width: 135px;
    font-size: 10px;
    gap: 2px;
  }
  .btn-fbd-toggle {
    bottom: var(--space-2);
    left: var(--space-2);
    padding: 4px 8px;
    font-size: 10px;
  }
}
</style>
