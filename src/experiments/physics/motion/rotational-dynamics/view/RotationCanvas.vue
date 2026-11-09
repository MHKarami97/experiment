<template>
  <div class="canvas-wrapper">
    <canvas ref="canvasRef" class="simulation-canvas"></canvas>

    <!-- Top Floating Telemetry HUD -->
    <div class="canvas-hud">
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('rotationalDynamics.angularVelocity') }}:</span>
        <span class="hud-val">{{ state.omega.toFixed(2) }} rad/s</span>
        <span class="hud-sub">({{ ((state.omega * 60) / (2 * Math.PI)).toFixed(0) }} rpm)</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('rotationalDynamics.momentOfInertia') }}:</span>
        <span class="hud-val">{{ state.momentOfInertia.toFixed(4) }} kg·m²</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('rotationalDynamics.rotationalKE') }}:</span>
        <span class="hud-val">{{ state.rotationalKineticEnergy.toFixed(2) }} J</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('rotationalDynamics.tension') }}:</span>
        <span class="hud-val">{{ state.stringTension.toFixed(2) }} N</span>
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
import type { RotationState, RotationParams } from '../model/rotation';
import { useAppStore } from '@/app/store';

const props = defineProps<{
  state: RotationState;
  params: RotationParams;
  mode: 'ideal' | 'real';
}>();

const store = useAppStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const showVectors = ref(true);

let animId: number | null = null;
let resizeObserver: ResizeObserver | null = null;

function resetView() {
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

  // Subtle lab grid
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Workbench Base Stand & Apparatus
  const centerX = w * 0.42;
  const centerY = h * 0.48;

  // Stand pillar
  ctx.fillStyle = isDark ? '#334155' : '#94a3b8';
  ctx.fillRect(centerX - 10, centerY + 80, 20, h - (centerY + 80) - 20);

  // Bench table top
  const benchY = h - 25;
  ctx.fillStyle = isDark ? '#1e293b' : '#cbd5e1';
  ctx.fillRect(20, benchY, w - 40, 15);

  // 2. Guide Pulley (mounted on right arm)
  const pulleyX = w * 0.82;
  const pulleyY = centerY - 100;
  const pulleyRadius = 14;

  // Arm connecting center axle mount to guide pulley
  ctx.strokeStyle = isDark ? '#475569' : '#64748b';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(pulleyX, pulleyY);
  ctx.stroke();

  // Draw Guide Pulley
  ctx.fillStyle = isDark ? '#64748b' : '#475569';
  ctx.beginPath();
  ctx.arc(pulleyX, pulleyY, pulleyRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(pulleyX, pulleyY, 4, 0, Math.PI * 2);
  ctx.fill();

  // 3. String & Hanging Weight
  const spindleScreenR = Math.max(8, props.params.spindleRadius * 220);
  const unwoundFraction = Math.min(1.0, props.state.hangingPosition / 1.5);
  const hangingY = pulleyY + 40 + unwoundFraction * (benchY - pulleyY - 80);

  // String from spindle tangent -> guide pulley -> hanging mass
  ctx.strokeStyle = isDark ? '#e2e8f0' : '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  // Spindle top tangent
  ctx.moveTo(centerX, centerY - spindleScreenR);
  ctx.lineTo(pulleyX, pulleyY - pulleyRadius);
  // Around pulley
  ctx.arc(pulleyX, pulleyY, pulleyRadius, -Math.PI / 2, 0);
  // Down to hanging weight
  ctx.lineTo(pulleyX + pulleyRadius, hangingY);
  ctx.stroke();

  // Hanging Mass Block
  if (props.params.hangingMass > 0) {
    const massW = 28;
    const massH = 34;
    const massX = pulleyX + pulleyRadius - massW / 2;

    // Weight hanger body (metallic bronze/gold)
    ctx.fillStyle = '#b45309';
    ctx.fillRect(massX, hangingY, massW, massH);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(massX, hangingY, massW, massH);

    // Mass label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${props.params.hangingMass} kg`, massX + massW / 2, hangingY + 22);

    // Vectors on hanging mass
    if (showVectors.value) {
      // String tension arrow (Upwards)
      if (props.state.stringTension > 0.05) {
        drawArrow(
          ctx,
          pulleyX + pulleyRadius,
          hangingY,
          pulleyX + pulleyRadius,
          hangingY - Math.min(50, props.state.stringTension * 12),
          '#10b981',
          2,
          'T'
        );
      }
      // Gravity arrow (Downwards)
      const gravForce = props.params.hangingMass * props.params.gConst;
      drawArrow(
        ctx,
        pulleyX + pulleyRadius,
        hangingY + massH,
        pulleyX + pulleyRadius,
        hangingY + massH + Math.min(50, gravForce * 12),
        '#ef4444',
        2,
        'mg'
      );
    }
  }

  // 4. Rotating Rigid Body (Rotor)
  const rotorPixelR = Math.max(30, props.params.rotorRadius * 280);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(props.state.theta);

  switch (props.params.rotorShape) {
    case 'hoop': {
      // Hollow Hoop: Outer ring + inner hollow + 4 thin cross struts
      const innerPixelR = rotorPixelR * 0.82;
      ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
      ctx.beginPath();
      ctx.arc(0, 0, rotorPixelR, 0, Math.PI * 2);
      ctx.arc(0, 0, innerPixelR, 0, Math.PI * 2, true);
      ctx.fill();

      // Metallic rim border
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, rotorPixelR, 0, Math.PI * 2);
      ctx.stroke();

      // Lightweight spokes
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(rotorPixelR * Math.cos(ang), rotorPixelR * Math.sin(ang));
        ctx.stroke();
      }
      break;
    }

    case 'sphere': {
      // Solid uniform sphere with radial lighting gradient and rotating meridian lines
      const sphereGrad = ctx.createRadialGradient(
        -rotorPixelR * 0.3,
        -rotorPixelR * 0.3,
        rotorPixelR * 0.1,
        0,
        0,
        rotorPixelR
      );
      sphereGrad.addColorStop(0, '#f472b6');
      sphereGrad.addColorStop(0.7, '#db2777');
      sphereGrad.addColorStop(1, '#831843');

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(0, 0, rotorPixelR, 0, Math.PI * 2);
      ctx.fill();

      // Rotating surface grid stripes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, rotorPixelR * 0.95, rotorPixelR * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, rotorPixelR * 0.45, rotorPixelR * 0.95, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'rod': {
      // Thin symmetric rod with weighted brass ends
      const halfLen = rotorPixelR;
      const barThickness = 14;

      ctx.fillStyle = isDark ? '#e2e8f0' : '#475569';
      ctx.fillRect(-halfLen, -barThickness / 2, 2 * halfLen, barThickness);

      // End weights
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(-halfLen, 0, barThickness * 1.1, 0, Math.PI * 2);
      ctx.arc(halfLen, 0, barThickness * 1.1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'disk':
    default: {
      // Solid uniform disk: metallic sheen gradient, concentric radial rings and markings
      const diskGrad = ctx.createRadialGradient(
        -rotorPixelR * 0.2,
        -rotorPixelR * 0.2,
        rotorPixelR * 0.1,
        0,
        0,
        rotorPixelR
      );
      diskGrad.addColorStop(0, isDark ? '#64748b' : '#e2e8f0');
      diskGrad.addColorStop(0.7, isDark ? '#334155' : '#94a3b8');
      diskGrad.addColorStop(1, isDark ? '#1e293b' : '#64748b');

      ctx.fillStyle = diskGrad;
      ctx.beginPath();
      ctx.arc(0, 0, rotorPixelR, 0, Math.PI * 2);
      ctx.fill();

      // Outer rim
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, rotorPixelR, 0, Math.PI * 2);
      ctx.stroke();

      // Radial visual reference spokes (6 markers)
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(spindleScreenR * 0.8 * Math.cos(ang), spindleScreenR * 0.8 * Math.sin(ang));
        ctx.lineTo(rotorPixelR * 0.95 * Math.cos(ang), rotorPixelR * 0.95 * Math.sin(ang));
        ctx.stroke();
      }
      break;
    }
  }

  // Spindle hub & wound string coil
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.arc(0, 0, spindleScreenR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Central axle pin
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 5. Curved Angular Velocity Vector Arc
  if (showVectors.value && props.state.omega > 0.05) {
    const arcRadius = rotorPixelR + 25;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, arcRadius, -Math.PI / 4, Math.PI / 3);
    ctx.stroke();

    // Arrowhead at end of arc
    const arrowAngle = Math.PI / 3;
    const ax = centerX + arcRadius * Math.cos(arrowAngle);
    const ay = centerY + arcRadius * Math.sin(arrowAngle);
    drawArrow(
      ctx,
      ax - 10 * Math.sin(arrowAngle),
      ay + 10 * Math.cos(arrowAngle),
      ax,
      ay,
      '#10b981',
      3,
      'ω'
    );
  }

  ctx.restore();
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
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(label, toX + 6, toY - 4);
  }

  ctx.restore();
}

watch(
  () => [props.state.theta, props.state.hangingPosition],
  () => {
    render();
  }
);

watch(
  () => [
    props.params.rotorShape,
    props.params.rotorRadius,
    props.params.spindleRadius,
    props.params.hangingMass,
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
