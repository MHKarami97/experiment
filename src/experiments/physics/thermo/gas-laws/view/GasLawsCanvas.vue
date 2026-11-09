<template>
  <div class="canvas-container">
    <canvas ref="canvasRef" class="gas-laws-canvas" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useAppStore } from '@/app/store';
import {
  type GasLawState,
  type GasLawParams,
  GAS_DATABASE,
} from '../model/gas-laws';

const props = defineProps<{
  state: GasLawState;
  params: GasLawParams;
}>();

const store = useAppStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;
let burnerPhase = 0;

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

  // 1. Clear Background
  ctx.fillStyle = isDark ? '#0b1120' : '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  // Cylinder Layout Dimensions
  const cylW = Math.min(280, w * 0.52);
  const cylMaxH = Math.min(340, h * 0.62);
  const cylX = (w - cylW) / 2;
  const cylBottomY = h - 65;
  const cylTopY = cylBottomY - cylMaxH;

  // Piston Position: Volume 5L -> piston at 18% height, 35L -> piston near top (92% height)
  const volFraction = (props.params.volumeLiters - 5) / (35 - 5);
  const minPistonH = cylMaxH * 0.22;
  const maxPistonH = cylMaxH * 0.92;
  const currentGasHeight = minPistonH + volFraction * (maxPistonH - minPistonH);
  const pistonHeadY = cylBottomY - currentGasHeight;

  // 2. Base & Heater / Cooler Apparatus
  renderThermalSource(ctx, cylX, cylBottomY, cylW, props.params.temperatureKelvin, isDark);

  // 3. Cylinder Glass / Metal Chamber Walls
  ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(241, 245, 249, 0.65)';
  ctx.fillRect(cylX, cylTopY, cylW, cylMaxH);

  // Cylinder Side Walls & Floor
  ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cylX, cylTopY);
  ctx.lineTo(cylX, cylBottomY);
  ctx.lineTo(cylX + cylW, cylBottomY);
  ctx.lineTo(cylX + cylW, cylTopY);
  ctx.stroke();

  // Volume Graduations along Left Wall
  renderVolumeRuler(ctx, cylX, cylBottomY, minPistonH, maxPistonH, isDark);

  // 4. Gas Particles bouncing inside the cylinder (between floor and piston)
  renderGasParticles(ctx, cylX, pistonHeadY, cylW, currentGasHeight);

  // 5. Heavy Movable Piston
  renderPiston(ctx, cylX, pistonHeadY, cylW, cylTopY, isDark);

  // 6. Side Pressure Manometer Gauge (Left)
  const gaugeX = Math.max(55, cylX - 60);
  const gaugeY = cylBottomY - cylMaxH * 0.45;
  renderPressureGauge(ctx, gaugeX, gaugeY, props.state.derived.displayedPressureKPa, isDark);

  // 7. Side Thermometer (Right)
  const thermX = Math.min(w - 55, cylX + cylW + 60);
  const thermY = gaugeY;
  renderThermometer(ctx, thermX, thermY, props.params.temperatureKelvin, isDark);

  // 8. Top Overlaid Status HUD
  renderHUD(ctx, w, isDark);

  ctx.restore();
}

function renderThermalSource(
  ctx: CanvasRenderingContext2D,
  cx: number,
  bottomY: number,
  cw: number,
  tempK: number,
  isDark: boolean,
) {
  // Base support stand
  ctx.fillStyle = isDark ? '#1e293b' : '#cbd5e1';
  ctx.beginPath();
  ctx.roundRect(cx - 16, bottomY + 2, cw + 32, 16, 4);
  ctx.fill();

  burnerPhase += 0.12;

  if (tempK > 320) {
    // Heating Flames under cylinder
    const flameCount = 5;
    const flameW = cw / (flameCount + 1);
    const heatIntensity = Math.min(1.0, (tempK - 300) / 450);

    for (let i = 1; i <= flameCount; i++) {
      const fx = cx + i * flameW;
      const fy = bottomY + 2;
      const flameH = 14 + Math.sin(burnerPhase + i * 1.5) * 6 * heatIntensity;

      const flameGrad = ctx.createRadialGradient(fx, fy + flameH * 0.5, 2, fx, fy, flameH);
      flameGrad.addColorStop(0, '#fef08a');
      flameGrad.addColorStop(0.4, '#f97316');
      flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.ellipse(fx, fy + flameH * 0.6, 7 * heatIntensity, flameH * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (tempK < 270) {
    // Ice / Cooling Frost beneath cylinder
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('❄️ ❄️ ❄️ ❄️ ❄️', cx + cw / 2, bottomY + 34);
  }
}

function renderVolumeRuler(
  ctx: CanvasRenderingContext2D,
  cx: number,
  bottomY: number,
  minH: number,
  maxH: number,
  isDark: boolean,
) {
  ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = '9px monospace';
  ctx.textAlign = 'right';

  const marks = [5, 10, 15, 20, 25, 30, 35];
  for (const vol of marks) {
    const fraction = (vol - 5) / (35 - 5);
    const yMark = bottomY - (minH + fraction * (maxH - minH));

    ctx.beginPath();
    ctx.moveTo(cx, yMark);
    ctx.lineTo(cx - 10, yMark);
    ctx.stroke();

    ctx.fillText(`${vol}L`, cx - 14, yMark + 3);
  }
}

function renderGasParticles(
  ctx: CanvasRenderingContext2D,
  cylX: number,
  pistonHeadY: number,
  cylW: number,
  gasHeight: number,
) {
  const gas = GAS_DATABASE[props.params.gasType] || GAS_DATABASE.helium;
  const r = gas.particleRadius;

  for (const p of props.state.particles) {
    // Convert normalized [0, 1] coordinates into cylinder pixel space
    const px = cylX + 6 + p.x * (cylW - 12);
    const py = pistonHeadY + 6 + (1.0 - p.y) * (gasHeight - 12);

    // Particle Body with Glow
    const partGrad = ctx.createRadialGradient(px, py, r * 0.2, px, py, r);
    partGrad.addColorStop(0, '#ffffff');
    partGrad.addColorStop(0.6, gas.colorHex);
    partGrad.addColorStop(1, gas.colorHex);

    ctx.fillStyle = partGrad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();

    // Mini motion streak
    if (p.speed > 500) {
      ctx.strokeStyle = gas.colorHex + '55';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - (p.vx / p.speed) * 8, py - (p.vy / p.speed) * 8);
      ctx.stroke();
    }
  }
}

function renderPiston(
  ctx: CanvasRenderingContext2D,
  cylX: number,
  pistonHeadY: number,
  cylW: number,
  cylTopY: number,
  isDark: boolean,
) {
  const pistonThickness = 22;

  // 1. Piston Head Metallic Body
  const headGrad = ctx.createLinearGradient(cylX, 0, cylX + cylW, 0);
  headGrad.addColorStop(0, '#475569');
  headGrad.addColorStop(0.3, '#94a3b8');
  headGrad.addColorStop(0.5, '#e2e8f0'); // Specular sheen
  headGrad.addColorStop(0.7, '#94a3b8');
  headGrad.addColorStop(1, '#334155');

  ctx.fillStyle = headGrad;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cylX + 2, pistonHeadY - pistonThickness, cylW - 4, pistonThickness, 3);
  ctx.fill();
  ctx.stroke();

  // Rubber Sealing Ring Strips
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cylX + 2, pistonHeadY - pistonThickness + 6, cylW - 4, 3);
  ctx.fillRect(cylX + 2, pistonHeadY - pistonThickness + 13, cylW - 4, 3);

  // 2. Central Piston Rod rising out of container
  const rodW = 18;
  const rodX = cylX + (cylW - rodW) / 2;
  const rodTopY = Math.min(pistonHeadY - pistonThickness - 20, cylTopY - 18);

  const rodGrad = ctx.createLinearGradient(rodX, 0, rodX + rodW, 0);
  rodGrad.addColorStop(0, '#64748b');
  rodGrad.addColorStop(0.5, '#cbd5e1');
  rodGrad.addColorStop(1, '#475569');

  ctx.fillStyle = rodGrad;
  ctx.beginPath();
  ctx.roundRect(rodX, rodTopY, rodW, pistonHeadY - pistonThickness - rodTopY, 2);
  ctx.fill();

  // Rod Handle / Top Weight
  ctx.fillStyle = isDark ? '#334155' : '#475569';
  ctx.beginPath();
  ctx.roundRect(rodX - 14, rodTopY - 12, rodW + 28, 12, 4);
  ctx.fill();
}

function renderPressureGauge(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  pressureKPa: number,
  isDark: boolean,
) {
  const dialRadius = 38;

  // Connecting pipe from cylinder to gauge
  ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(gx + dialRadius, gy);
  ctx.lineTo(gx + dialRadius + 22, gy);
  ctx.stroke();

  // Dial Casing
  ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
  ctx.strokeStyle = isDark ? '#64748b' : '#475569';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(gx, gy, dialRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Dial graduations
  ctx.strokeStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.lineWidth = 1.5;
  for (let a = -Math.PI * 0.75; a <= Math.PI * 0.75; a += Math.PI * 0.25) {
    const x1 = gx + Math.cos(a) * (dialRadius - 4);
    const y1 = gy + Math.sin(a) * (dialRadius - 4);
    const x2 = gx + Math.cos(a) * (dialRadius - 10);
    const y2 = gy + Math.sin(a) * (dialRadius - 10);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Rotating Needle
  // 0 kPa -> -135 deg (-0.75 PI), 800 kPa -> +135 deg (+0.75 PI)
  const normP = Math.min(1.0, Math.max(0, pressureKPa / 800.0));
  const needleAngle = -Math.PI * 0.75 + normP * (Math.PI * 1.5);

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx + Math.cos(needleAngle) * (dialRadius - 8), gy + Math.sin(needleAngle) * (dialRadius - 8));
  ctx.stroke();

  // Center hub
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(gx, gy, 4, 0, Math.PI * 2);
  ctx.fill();

  // Digital Readout Box beneath gauge
  renderBadge(ctx, gx, gy + dialRadius + 18, `${pressureKPa.toFixed(1)} kPa`, isDark);
}

function renderThermometer(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  tempK: number,
  isDark: boolean,
) {
  const stemW = 8;
  const stemH = 75;
  const topY = ty - stemH / 2;
  const bottomY = ty + stemH / 2;

  // Connecting pipe
  ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(tx - stemW / 2, ty);
  ctx.lineTo(tx - stemW / 2 - 20, ty);
  ctx.stroke();

  // Glass tube
  ctx.fillStyle = isDark ? '#1e293b' : '#f1f5f9';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(tx - stemW / 2, topY, stemW, stemH, 4);
  ctx.fill();
  ctx.stroke();

  // Bulb
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(tx, bottomY, 8, 0, Math.PI * 2);
  ctx.fill();

  // Liquid column: 100K -> near bottom, 750K -> near top
  const tempRatio = Math.min(1.0, Math.max(0.05, (tempK - 100) / (750 - 100)));
  const colH = tempRatio * (stemH - 12);
  ctx.beginPath();
  ctx.rect(tx - stemW / 2 + 1.5, bottomY - colH, stemW - 3, colH);
  ctx.fill();

  // Temperature Readout Badge
  renderBadge(ctx, tx, bottomY + 22, `${tempK.toFixed(0)} K`, isDark);
}

function renderBadge(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  text: string,
  isDark: boolean,
) {
  const bw = 74;
  const bh = 22;

  ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.95)';
  ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bx - bw / 2, by - bh / 2, bw, bh, 5);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(text, bx, by + 4);
}

function renderHUD(ctx: CanvasRenderingContext2D, w: number, isDark: boolean) {
  const cardW = Math.min(480, w - 32);
  const cardH = 50;
  const cardX = (w - cardW) / 2;
  const cardY = 16;

  ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.88)' : 'rgba(255, 255, 255, 0.9)';
  ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = '11px system-ui';
  ctx.fillText('ضریب گاز آرمانی (PV / nRT)', cardX + cardW * 0.28, cardY + 18);
  ctx.fillText('سرعت میانگین مولکول‌ها (v_rms)', cardX + cardW * 0.74, cardY + 18);

  // Compute compressibility factor Z = P V / (n R T)
  const pPa = props.state.derived.displayedPressureKPa * 1000;
  const vM3 = props.params.volumeLiters / 1000;
  const n = props.params.moles;
  const tK = props.params.temperatureKelvin;
  const zFactor = pPa * vM3 / (n * 8.31446 * tK);

  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = '#10b981';
  ctx.fillText(`Z = ${zFactor.toFixed(3)}`, cardX + cardW * 0.28, cardY + 38);

  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`${props.state.derived.rmsSpeed.toFixed(0)} m/s`, cardX + cardW * 0.74, cardY + 38);
}

function loop() {
  render();
  animationFrameId = requestAnimationFrame(loop);
}

function startLoop() {
  if (animationFrameId === null) {
    animationFrameId = requestAnimationFrame(loop);
  }
}

function stopLoop() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

watch(
  () => [props.state, props.params, store.theme],
  () => {
    render();
  },
  { deep: true },
);

onMounted(() => {
  startLoop();
});

onBeforeUnmount(() => {
  stopLoop();
});

defineExpose({
  getCanvas: () => canvasRef.value,
});
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.gas-laws-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
