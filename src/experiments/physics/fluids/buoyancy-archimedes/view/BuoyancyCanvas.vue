<template>
  <div class="canvas-wrapper">
    <canvas ref="canvasRef" class="simulation-canvas"></canvas>

    <!-- Top Floating Telemetry HUD -->
    <div class="canvas-hud">
      <div class="hud-stat-pill highlight-pill">
        <span class="hud-label">{{ $t('buoyancy.buoyantForce') }}:</span>
        <span class="hud-val">{{ state.buoyantForce.toFixed(2) }} N</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('buoyancy.weight') }}:</span>
        <span class="hud-val">{{ state.weight.toFixed(2) }} N</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">
          {{ params.tetherAttached ? $t('buoyancy.apparentWeight') : $t('buoyancy.submergedFraction') }}:
        </span>
        <span class="hud-val">
          {{ params.tetherAttached ? `${state.scaleReading.toFixed(2)} N` : `${(state.submergedFraction * 100).toFixed(1)}%` }}
        </span>
      </div>
      <div class="hud-controls">
        <button
          type="button"
          class="btn-hud-icon"
          :title="showVectors ? 'Hide Force Vectors' : 'Show Force Vectors'"
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
import type { BuoyancyState, BuoyancyParams } from '../model/buoyancy';
import { useAppStore } from '@/app/store';

const props = defineProps<{
  state: BuoyancyState;
  params: BuoyancyParams;
  mode: 'ideal' | 'real';
}>();

const store = useAppStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const showVectors = ref(true);

let resizeObserver: ResizeObserver | null = null;
let animId: number | null = null;

function resetView() {
  render();
}

function getFluidColor(fluid: string): { fill: string; stroke: string; surface: string } {
  switch (fluid) {
    case 'gasoline':
      return {
        fill: 'rgba(250, 204, 21, 0.45)',
        stroke: '#eab308',
        surface: 'rgba(253, 224, 71, 0.85)',
      };
    case 'seawater':
      return {
        fill: 'rgba(14, 165, 233, 0.55)',
        stroke: '#0284c7',
        surface: 'rgba(56, 189, 248, 0.85)',
      };
    case 'honey':
      return {
        fill: 'rgba(217, 119, 6, 0.65)',
        stroke: '#b45309',
        surface: 'rgba(245, 158, 11, 0.9)',
      };
    case 'mercury':
      return {
        fill: 'rgba(148, 163, 184, 0.92)',
        stroke: '#64748b',
        surface: 'rgba(226, 232, 240, 0.95)',
      };
    case 'water':
    default:
      return {
        fill: 'rgba(56, 189, 248, 0.45)',
        stroke: '#0284c7',
        surface: 'rgba(125, 211, 252, 0.85)',
      };
  }
}

function getMaterialStyle(mat: string): { fill: string; stroke: string; label: string } {
  switch (mat) {
    case 'wood-balsa':
      return { fill: '#fef08a', stroke: '#ca8a04', label: 'Balsa (150)' };
    case 'wood-pine':
      return { fill: '#fed7aa', stroke: '#ea580c', label: 'Pine (600)' };
    case 'ice':
      return { fill: 'rgba(186, 230, 253, 0.75)', stroke: '#38bdf8', label: 'Ice (917)' };
    case 'aluminum':
      return { fill: '#cbd5e1', stroke: '#64748b', label: 'Al (2700)' };
    case 'iron':
      return { fill: '#475569', stroke: '#1e293b', label: 'Fe (7870)' };
    case 'lead':
      return { fill: '#334155', stroke: '#0f172a', label: 'Pb (11340)' };
    case 'custom':
    default:
      return { fill: '#a855f7', stroke: '#7e22ce', label: 'Block' };
  }
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

  // Background
  ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  // Layout geometry
  // Primary tank: width ~320px, height ~340px
  const tankW = Math.min(330, w * 0.52);
  const tankH = Math.min(320, h * 0.65);
  const tankX = (w - tankW) / 2 - 40;
  const tankY = h - tankH - 35;

  const fluidH = tankH * 0.78; // 78% filled
  const fluidSurfaceY = tankY + (tankH - fluidH);
  const tankFloorY = tankY + tankH;

  // 1. Draw Lab Worktable Base
  ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
  ctx.fillRect(20, tankFloorY, w - 40, 14);
  ctx.fillStyle = isDark ? '#334155' : '#cbd5e1';
  ctx.fillRect(20, tankFloorY + 14, w - 40, 4);

  // 2. Draw Overflow Beaker on Right
  const beakerW = 75;
  const beakerH = 110;
  const beakerX = tankX + tankW + 25;
  const beakerY = tankFloorY - beakerH;

  // Beaker glass
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.5)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(beakerX, beakerY, beakerW, beakerH);

  // Displaced liquid in overflow beaker
  const maxDisplaced = 0.005; // 5 Liters
  const displacedFillH = Math.min(beakerH - 10, (props.state.submergedVolume / maxDisplaced) * (beakerH - 10));
  if (displacedFillH > 2) {
    const fColor = getFluidColor(props.params.fluidType);
    ctx.fillStyle = fColor.fill;
    ctx.fillRect(beakerX + 2, beakerY + beakerH - displacedFillH, beakerW - 4, displacedFillH);
    ctx.fillStyle = fColor.surface;
    ctx.fillRect(beakerX + 2, beakerY + beakerH - displacedFillH, beakerW - 4, 3);
  }

  // Beaker Labels & Ticks
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Displacement', beakerX + beakerW / 2, beakerY - 14);
  ctx.fillText(`${(props.state.submergedVolume * 1000).toFixed(1)} L`, beakerX + beakerW / 2, beakerY - 2);

  // 3. Draw Overflow Spout Connecting Tank to Beaker
  const spoutY = fluidSurfaceY + 2;
  ctx.beginPath();
  ctx.moveTo(tankX + tankW, spoutY);
  ctx.lineTo(tankX + tankW + 16, spoutY + 8);
  ctx.lineTo(tankX + tankW + 16, spoutY + 14);
  ctx.lineTo(tankX + tankW, spoutY + 6);
  ctx.closePath();
  ctx.fillStyle = isDark ? '#475569' : '#94a3b8';
  ctx.fill();

  // 4. Draw Main Tank Fluid
  const fluidColor = getFluidColor(props.params.fluidType);
  ctx.fillStyle = fluidColor.fill;
  ctx.fillRect(tankX + 4, fluidSurfaceY, tankW - 8, fluidH - 4);

  // Wavy fluid surface line
  ctx.strokeStyle = fluidColor.surface;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tankX + 4, fluidSurfaceY);
  const time = props.state.t * 3;
  for (let x = tankX + 4; x <= tankX + tankW - 4; x += 8) {
    const wave = Math.sin((x - tankX) * 0.05 + time) * 1.5;
    ctx.lineTo(x, fluidSurfaceY + wave);
  }
  ctx.stroke();

  // 5. Draw Glass Tank Walls & Measurement Graduations
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.45)';
  ctx.lineWidth = 4;
  ctx.strokeRect(tankX, tankY, tankW, tankH);

  // Depth ruler ticks on left side of glass tank
  const numTicks = 10;
  ctx.lineWidth = 1;
  ctx.font = '9px system-ui';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= numTicks; i++) {
    const ty = fluidSurfaceY + (i / numTicks) * fluidH;
    const isMajor = i % 2 === 0;
    const tickLen = isMajor ? 12 : 6;

    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(15, 23, 42, 0.35)';
    ctx.beginPath();
    ctx.moveTo(tankX + 4, ty);
    ctx.lineTo(tankX + 4 + tickLen, ty);
    ctx.stroke();

    if (isMajor && i > 0) {
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.fillText(`${(i * 0.1).toFixed(1)}m`, tankX - 4, ty);
    }
  }

  // 6. Calculate Block Position and Dimensions in Pixels
  // block volume -> height and width
  const blockW = Math.min(100, tankW * 0.36);
  // Total block height in meters = blockVolume / crossSection
  const blockH = Math.min(110, ((props.params.blockVolume * 1000) / 2.0) * 85);
  const blockCenterX = tankX + tankW / 2;

  // y position mapping:
  // state.y is meters of bottom relative to water surface (y = 0 is surface, y < 0 is submerged)
  // Pixels per meter of liquid depth: fluidH / 1.0 (since tank depth is 1.0 m)
  const pxPerMeter = fluidH / 1.0;
  const blockBottomY = fluidSurfaceY - props.state.y * pxPerMeter;
  const blockTopY = blockBottomY - blockH;
  const blockX = blockCenterX - blockW / 2;

  // 7. Draw Spring Scale & Suspension Cable if Tethered
  if (props.params.tetherAttached) {
    const scaleY = tankY - 65;
    const scaleW = 44;
    const scaleH = 50;
    const scaleX = blockCenterX - scaleW / 2;

    // Scale casing
    ctx.fillStyle = isDark ? '#334155' : '#cbd5e1';
    ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(scaleX, scaleY, scaleW, scaleH, 6);
    ctx.fill();
    ctx.stroke();

    // Scale Dial / Display
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(scaleX + 5, scaleY + 6, scaleW - 10, 18);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${props.state.scaleReading.toFixed(1)}N`, blockCenterX, scaleY + 15);

    // Spring hanger ring at top
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(blockCenterX, scaleY - 6, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Cable from bottom of scale to top of block
    ctx.strokeStyle = isDark ? '#f1f5f9' : '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(blockCenterX, scaleY + scaleH);
    ctx.lineTo(blockCenterX, blockTopY);
    ctx.stroke();

    // Eye hook on block top
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(blockCenterX, blockTopY - 4, 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 8. Draw Block
  const matStyle = getMaterialStyle(props.params.material);
  ctx.fillStyle = matStyle.fill;
  ctx.strokeStyle = matStyle.stroke;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.roundRect(blockX, blockTopY, blockW, blockH, 4);
  ctx.fill();
  ctx.stroke();

  // Block Material Label inside
  ctx.fillStyle = props.params.material === 'iron' || props.params.material === 'lead' ? '#f8fafc' : '#0f172a';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(matStyle.label, blockCenterX, blockTopY + blockH / 2 - 8);
  ctx.font = '10px system-ui';
  ctx.fillText(`${props.state.mass.toFixed(2)} kg`, blockCenterX, blockTopY + blockH / 2 + 8);

  // 9. Free Body Diagram Force Vectors
  if (showVectors.value) {
    const centerBlockY = blockTopY + blockH / 2;
    const forceScale = 2.2; // pixels per Newton

    // Downward Gravity Weight vector W (Blue)
    const arrowLenW = Math.min(100, Math.max(15, props.state.weight * forceScale));
    drawArrow(ctx, blockCenterX - 12, centerBlockY, blockCenterX - 12, centerBlockY + arrowLenW, '#38bdf8', `W = ${props.state.weight.toFixed(1)}N`, 'down');

    // Upward Buoyant Force vector Fb (Green)
    if (props.state.buoyantForce > 0.05) {
      const arrowLenFb = Math.min(100, Math.max(15, props.state.buoyantForce * forceScale));
      drawArrow(ctx, blockCenterX + 12, centerBlockY, blockCenterX + 12, centerBlockY - arrowLenFb, '#22c55e', `Fb = ${props.state.buoyantForce.toFixed(1)}N`, 'up');
    }

    // Upward Normal Force if resting on tank floor
    if (props.state.isRestingOnFloor) {
      const normalF = Math.max(0, props.state.weight - props.state.buoyantForce);
      if (normalF > 0.1) {
        const arrowLenN = Math.min(70, Math.max(12, normalF * forceScale));
        drawArrow(ctx, blockCenterX, blockBottomY, blockCenterX, blockBottomY - arrowLenN, '#a855f7', `N = ${normalF.toFixed(1)}N`, 'up');
      }
    }
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
  label: string,
  direction: 'up' | 'down'
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Arrowhead
  const headLen = 8;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  // Label
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = fromX > toX ? 'right' : 'left';
  ctx.textBaseline = 'middle';
  const labelX = toX + (fromX > toX ? -8 : 8);
  const labelY = direction === 'up' ? toY + 6 : toY - 6;
  ctx.fillText(label, labelX, labelY);
}

watch(
  () => [props.state, props.params, props.mode, store.theme],
  () => {
    render();
  },
  { deep: true }
);

onMounted(() => {
  if (canvasRef.value) {
    resizeObserver = new ResizeObserver(() => render());
    resizeObserver.observe(canvasRef.value);
  }
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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  z-index: 10;
  pointer-events: auto;
}

.hud-stat-pill {
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 5px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hud-stat-pill.highlight-pill {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
}

.hud-stat-pill.highlight-pill .hud-val {
  color: #4ade80;
  font-weight: 700;
}

.hud-label {
  color: #94a3b8;
}

.hud-val {
  font-weight: 600;
  color: #f8fafc;
}

.hud-controls {
  display: flex;
  gap: 4px;
}

.btn-hud-icon {
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(8px);
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
