<template>
  <div class="canvas-container">
    <canvas ref="canvasRef" class="heat-transfer-canvas" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useAppStore } from '@/app/store';
import type { HeatTransferState, HeatTransferParams } from '../model/heat-transfer';

const props = defineProps<{
  state: HeatTransferState;
  params: HeatTransferParams;
}>();

const store = useAppStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;

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

  // Switch rendering based on active mode
  if (props.params.transferMode === 'conduction') {
    renderConduction(ctx, w, isDark);
  } else if (props.params.transferMode === 'convection') {
    renderConvection(ctx, w, isDark);
  } else if (props.params.transferMode === 'radiation') {
    renderRadiation(ctx, w, h, isDark);
  } else {
    renderCombined(ctx, w, isDark);
  }

  ctx.restore();
}

function renderConduction(ctx: CanvasRenderingContext2D, w: number, isDark: boolean) {
  const rodW = Math.min(420, (props.params.rodLength / 1.0) * (w * 0.55));
  const rodH = 64;
  const rodX = (w - rodW) / 2;
  const rodY = 160;

  const blockW = 85;
  const blockH = 110;

  // 1. Hot Reservoir (Left)
  const hotX = rodX - blockW;
  const hotY = rodY - (blockH - rodH) / 2;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.roundRect(hotX, hotY, blockW, blockH, 8);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('منبع داغ', hotX + blockW / 2, hotY + 35);
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`${props.params.hotTempC}°C`, hotX + blockW / 2, hotY + 68);

  // 2. Cold Reservoir (Right)
  const coldX = rodX + rodW;
  const coldY = hotY;
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.roundRect(coldX, coldY, blockW, blockH, 8);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('منبع سرد', coldX + blockW / 2, coldY + 35);
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`${props.params.coldTempC}°C`, coldX + blockW / 2, coldY + 68);

  // 3. Thermal Gradient Rod
  const gradient = ctx.createLinearGradient(rodX, rodY, rodX + rodW, rodY);
  gradient.addColorStop(0.0, '#ef4444'); // Hot Red
  gradient.addColorStop(0.35, '#f59e0b'); // Warm Amber
  gradient.addColorStop(0.7, '#10b981'); // Neutral Green
  gradient.addColorStop(1.0, '#0284c7'); // Cold Blue

  ctx.fillStyle = gradient;
  ctx.fillRect(rodX, rodY, rodW, rodH);

  // Rod Glass/Steel Outline
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.6)';
  ctx.lineWidth = 3;
  ctx.strokeRect(rodX, rodY, rodW, rodH);

  // 4. Heat Flux Vector Arrows (Fourier q = -k * dT/dx)
  const numArrows = 5;
  const arrowSpacing = rodW / (numArrows + 1);
  const arrowLen = Math.min(36, 12 + (props.state.derived.conduction.thermalConductivity / 400) * 24);

  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 2.5;

  for (let i = 1; i <= numArrows; i++) {
    const ax = rodX + i * arrowSpacing;
    const ay = rodY + rodH / 2;

    ctx.beginPath();
    ctx.moveTo(ax - arrowLen / 2, ay);
    ctx.lineTo(ax + arrowLen / 2, ay);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(ax + arrowLen / 2, ay);
    ctx.lineTo(ax + arrowLen / 2 - 6, ay - 4);
    ctx.lineTo(ax + arrowLen / 2 - 6, ay + 4);
    ctx.closePath();
    ctx.fill();
  }

  // 5. Thermocouple Probes along Rod with Live Temperature Readouts
  const probeStations = [
    { frac: 0.25, label: 'T₁' },
    { frac: 0.5, label: 'T₂' },
    { frac: 0.75, label: 'T₃' },
  ];

  probeStations.forEach((pr) => {
    const px = rodX + pr.frac * rodW;
    const py = rodY + rodH;
    const tVal = props.state.derived.conduction.tempProfile[Math.round(pr.frac * 10)] ?? 50;

    // Probe wire
    ctx.strokeStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py + 22);
    ctx.stroke();

    // Probe sensor bead
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(px, py + 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Temperature Badge
    ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
    ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(px - 28, py + 24, 56, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${tVal.toFixed(1)}°C`, px, py + 41);
  });

  // 6. HUD Telemetry Bar at Bottom
  drawTelemetryBar(ctx, w, rodY + rodH + 85, [
    { label: 'شار حرارتی رسانش (Q̇)', val: `${props.state.derived.conduction.heatFluxRate.toFixed(1)} W` },
    { label: 'رسانندگی گرمایی (k)', val: `${props.state.derived.conduction.thermalConductivity} W/m·K` },
    { label: 'چگالی شار (q̇ = Q̇/A)', val: `${(props.state.derived.conduction.heatFluxDensity / 1000).toFixed(2)} kW/m²` },
    { label: 'افت دما (ΔT)', val: `${(props.params.hotTempC - props.params.coldTempC).toFixed(0)} K` },
  ], isDark);
}

function renderConvection(ctx: CanvasRenderingContext2D, w: number, isDark: boolean) {
  const plateW = Math.min(360, w * 0.58);
  const plateH = 24;
  const plateX = (w - plateW) / 2;
  const plateY = 240;

  // 1. Heated Base Plate
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.roundRect(plateX, plateY, plateW, plateH, 6);
  ctx.fill();

  ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`صفحه داغ: ${props.params.hotTempC}°C`, plateX + plateW / 2, plateY + 16);

  // 2. Buoyancy Convection Plume Particles
  for (const p of props.state.particles) {
    const px = plateX + p.x * plateW;
    const py = plateY - p.y * 140;

    // Color gradient based on particle temperature
    const alpha = Math.max(0.15, p.temperature);
    ctx.fillStyle = p.temperature > 0.6 ? `rgba(239, 68, 68, ${alpha})` : `rgba(245, 158, 11, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Thermal Boundary Layer Envelope curve
  const deltaPx = Math.min(70, props.state.derived.convection.boundaryLayerThicknessMm * 3.5);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(plateX, plateY);
  ctx.quadraticCurveTo(plateX + plateW * 0.5, plateY - deltaPx * 1.5, plateX + plateW, plateY - deltaPx);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`ضخامت لایه مرزی حرارتی (δ ≈ ${props.state.derived.convection.boundaryLayerThicknessMm.toFixed(1)} mm)`, plateX + plateW / 2, plateY - deltaPx - 10);

  // 4. Ambient Environment Label
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = '12px system-ui';
  ctx.fillText(`محیط اطراف: ${props.params.coldTempC}°C (همرفت شاره)`, plateX + plateW / 2, plateY - 170);

  // 5. HUD Telemetry Bar
  drawTelemetryBar(ctx, w, plateY + 55, [
    { label: 'نرخ همرفت حرارتی (Q̇_conv)', val: `${props.state.derived.convection.convectiveHeatRate.toFixed(1)} W` },
    { label: 'ضریب همرفت (h)', val: `${props.params.convectionCoeff} W/m²·K` },
    { label: 'تخمین عدد ناسلت (Nu)', val: `${props.state.derived.convection.nusseltEstimate.toFixed(1)}` },
    { label: 'اختلاف دما (Ts - T∞)', val: `${(props.params.hotTempC - props.params.coldTempC).toFixed(0)} K` },
  ], isDark);
}

function renderRadiation(ctx: CanvasRenderingContext2D, w: number, _h: number, isDark: boolean) {
  const sphereX = w / 2;
  const sphereY = 160;
  const sphereR = 52;

  // 1. Incandescent Radiating Body (Blackbody / Gray body)
  const glowHex = props.state.derived.radiation.glowColorHex;

  // Outer Aura
  const radialGlow = ctx.createRadialGradient(sphereX, sphereY, sphereR * 0.6, sphereX, sphereY, sphereR * 1.8);
  radialGlow.addColorStop(0.0, glowHex);
  radialGlow.addColorStop(1.0, 'transparent');

  ctx.fillStyle = radialGlow;
  ctx.beginPath();
  ctx.arc(sphereX, sphereY, sphereR * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Core Body
  ctx.fillStyle = glowHex;
  ctx.beginPath();
  ctx.arc(sphereX, sphereY, sphereR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Body Readout
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${props.params.hotTempC}°C`, sphereX, sphereY + 4);

  // 2. Outward Stefan-Boltzmann Radiation Rays (Photons flux)
  const numRays = 12;
  const time = props.state.t * 3;
  ctx.strokeStyle = '#f59e0b';
  ctx.fillStyle = '#f59e0b';
  ctx.lineWidth = 2;

  for (let i = 0; i < numRays; i++) {
    const angle = (i / numRays) * 2 * Math.PI;
    const pulse = 10 * Math.sin(time + i);
    const startR = sphereR + 12;
    const endR = sphereR + 45 + pulse;

    const x1 = sphereX + Math.cos(angle) * startR;
    const y1 = sphereY + Math.sin(angle) * startR;
    const x2 = sphereX + Math.cos(angle) * endR;
    const y2 = sphereY + Math.sin(angle) * endR;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Outward arrowhead
    ctx.beginPath();
    ctx.arc(x2, y2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Emissivity & Wavelength Label above
  ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`ضریب گسیل (ε) = ${props.params.emissivity.toFixed(2)} | طول موج بیشینه (λ_max) = ${props.state.derived.radiation.peakWavelengthUm.toFixed(2)} μm`, sphereX, sphereY - sphereR - 22);

  // 4. HUD Telemetry Bar
  drawTelemetryBar(ctx, w, sphereY + sphereR + 55, [
    { label: 'توان تابش کل (Q̇_rad)', val: `${props.state.derived.radiation.radiativeHeatRate.toFixed(1)} W` },
    { label: 'توان گسیل سطح (E)', val: `${(props.state.derived.radiation.emissivePower / 1000).toFixed(2)} kW/m²` },
    { label: 'طول موج قله (وین)', val: `${props.state.derived.radiation.peakWavelengthUm.toFixed(2)} μm` },
    { label: 'دمای محیط اطراف', val: `${props.params.coldTempC}°C` },
  ], isDark);
}

function renderCombined(ctx: CanvasRenderingContext2D, w: number, isDark: boolean) {
  const chartW = Math.min(460, w * 0.75);
  const chartX = (w - chartW) / 2;
  const chartY = 135;

  const qCond = props.state.derived.conduction.heatFluxRate;
  const qConv = props.state.derived.convection.convectiveHeatRate;
  const qRad = props.state.derived.radiation.radiativeHeatRate;
  const total = Math.max(0.1, qCond + qConv + qRad);

  const fracCond = qCond / total;
  const fracConv = qConv / total;
  const fracRad = qRad / total;

  // 1. Stacked Horizontal Energy Share Bar
  const barH = 34;
  ctx.beginPath();
  ctx.roundRect(chartX, chartY, chartW, barH, 6);
  ctx.clip();

  // Conduction Segment (Blue/Cyan)
  const condW = chartW * fracCond;
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(chartX, chartY, condW, barH);

  // Convection Segment (Orange)
  const convW = chartW * fracConv;
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(chartX + condW, chartY, convW, barH);

  // Radiation Segment (Red)
  const radW = chartW * fracRad;
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(chartX + condW + convW, chartY, radW, barH);

  ctx.restore(); // restore clipping

  // Border around stacked bar
  ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.lineWidth = 2;
  ctx.strokeRect(chartX, chartY, chartW, barH);

  // 2. Legend Items below bar
  const legendY = chartY + barH + 24;
  const legends = [
    { color: '#0284c7', label: `رسانش: ${(fracCond * 100).toFixed(0)}% (${qCond.toFixed(0)} W)` },
    { color: '#f59e0b', label: `همرفت: ${(fracConv * 100).toFixed(0)}% (${qConv.toFixed(0)} W)` },
    { color: '#ef4444', label: `تابش: ${(fracRad * 100).toFixed(0)}% (${qRad.toFixed(0)} W)` },
  ];

  const colW = chartW / 3;
  legends.forEach((leg, idx) => {
    const lx = chartX + idx * colW + colW / 2;
    ctx.fillStyle = leg.color;
    ctx.beginPath();
    ctx.arc(lx - 45, legendY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'start';
    ctx.fillText(leg.label, lx - 32, legendY + 4);
  });

  // 3. Dominant Mechanism Callout Badge
  const domY = legendY + 36;
  ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
  ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(chartX + chartW * 0.2, domY, chartW * 0.6, 28, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`سازوکار غالب در این شرایط: ${props.state.derived.dominantMode}`, chartX + chartW / 2, domY + 18);

  // 4. HUD Telemetry Bar
  drawTelemetryBar(ctx, w, domY + 48, [
    { label: 'انتقال حرارت کل (Q̇_tot)', val: `${props.state.derived.totalHeatRate.toFixed(1)} W` },
    { label: 'سهم رسانش (Q̇_cond)', val: `${qCond.toFixed(1)} W` },
    { label: 'سهم همرفت (Q̇_conv)', val: `${qConv.toFixed(1)} W` },
    { label: 'سهم تابش (Q̇_rad)', val: `${qRad.toFixed(1)} W` },
  ], isDark);
}

function drawTelemetryBar(
  ctx: CanvasRenderingContext2D,
  w: number,
  y: number,
  metrics: { label: string; val: string }[],
  isDark: boolean,
) {
  const barW = Math.min(520, w - 80);
  const barX = (w - barW) / 2;
  const barH = 64;

  ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(241, 245, 249, 0.92)';
  ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(barX, y, barW, barH, 8);
  ctx.fill();
  ctx.stroke();

  const colW = barW / metrics.length;
  metrics.forEach((m, idx) => {
    const cx = barX + idx * colW + colW / 2;
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(m.label, cx, y + 22);

    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(m.val, cx, y + 46);
  });
}

function startLoop() {
  if (animationFrameId !== null) return;
  const loop = () => {
    render();
    animationFrameId = requestAnimationFrame(loop);
  };
  animationFrameId = requestAnimationFrame(loop);
}

function stopLoop() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

watch(
  () => [props.state, store.theme],
  () => {
    render();
  },
  { deep: true },
);

onMounted(() => {
  render();
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

.heat-transfer-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
