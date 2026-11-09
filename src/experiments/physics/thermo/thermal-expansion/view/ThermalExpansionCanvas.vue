<template>
  <div class="canvas-container">
    <canvas ref="canvasRef" class="thermal-expansion-canvas" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useAppStore } from '@/app/store';
import {
  type ThermalExpansionState,
  type ThermalExpansionParams,
  METALS_DATABASE,
} from '../model/thermal-expansion';

const props = defineProps<{
  state: ThermalExpansionState;
  params: ThermalExpansionParams;
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

  // 1. Clear Canvas Background
  ctx.fillStyle = isDark ? '#0b1120' : '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  if (props.params.expansionType === 'linear') {
    renderLinearApparatus(ctx, w, h, isDark);
  } else if (props.params.expansionType === 'bimetal') {
    renderBimetalThermostat(ctx, w, h, isDark);
  } else {
    renderWaterAnomalyFlask(ctx, w, h, isDark);
  }

  // Overlaid Top HUD Card
  renderHUD(ctx, w, isDark);

  ctx.restore();
}

/**
 * Mode 0: Linear Rod Expansion Apparatus with Micrometer Dial
 */
function renderLinearApparatus(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isDark: boolean,
) {
  const benchW = Math.min(680, w - 80);
  const benchX = (w - benchW) / 2;
  const benchY = h * 0.58;

  // 1. Heavy Rigid Test Bench
  ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
  ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(benchX, benchY, benchW, 32, 6);
  ctx.fill();
  ctx.stroke();

  // Bench Feet
  ctx.fillStyle = isDark ? '#0f172a' : '#64748b';
  ctx.fillRect(benchX + 30, benchY + 32, 28, 14);
  ctx.fillRect(benchX + benchW - 58, benchY + 32, 28, 14);

  // 2. Fixed Anchor Clamp on Left
  const clampW = 48;
  const clampH = 75;
  const clampX = benchX + 24;
  const clampY = benchY - clampH;

  ctx.fillStyle = isDark ? '#334155' : '#475569';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(clampX, clampY, clampW, clampH, 4);
  ctx.fill();
  ctx.stroke();

  // Clamping Screw
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(clampX + clampW / 2, clampY + 20, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('انتهای ثابت', clampX + clampW / 2, clampY + clampH - 12);

  // 3. Test Metal Rod
  const rodStartX = clampX + clampW;
  const rodBaseW = benchW - 220;
  // Visual extension exaggerated by factor of 12 for clear macroscopic display
  const visualElongation = props.state.derived.linear.deltaL_Mm * 14;
  const rodCurrentW = Math.max(100, rodBaseW + visualElongation);
  const rodH = 20;
  const rodY = benchY - clampH * 0.65;

  const m1 = METALS_DATABASE[props.params.metal1] || METALS_DATABASE.copper;
  const rodGrad = ctx.createLinearGradient(rodStartX, rodY, rodStartX + rodCurrentW, rodY);

  if (props.state.temperatureC > 40) {
    // Thermal heat glow tint
    rodGrad.addColorStop(0.0, m1.colorHex);
    rodGrad.addColorStop(0.5, '#ef4444');
    rodGrad.addColorStop(1.0, m1.colorHex);
  } else {
    rodGrad.addColorStop(0.0, m1.colorHex);
    rodGrad.addColorStop(1.0, m1.colorHex);
  }

  ctx.fillStyle = rodGrad;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(rodStartX, rodY, rodCurrentW, rodH, 3);
  ctx.fill();
  ctx.stroke();

  // Rod Material Label
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${m1.name.toUpperCase()} (L₀ = ${props.params.initialLengthMm} mm)`,
    rodStartX + rodCurrentW / 2,
    rodY - 8,
  );

  // 4. Burner / Heating Element below Rod
  burnerPhase += 0.1;
  const flameCount = 6;
  const flameSpacing = rodCurrentW / (flameCount + 1);
  const isHeating = props.state.temperatureC > 30;

  for (let i = 1; i <= flameCount; i++) {
    const fx = rodStartX + i * flameSpacing;
    const fy = benchY - 8;

    if (isHeating) {
      const flameH = 12 + Math.sin(burnerPhase + i) * 5;
      const flmGrad = ctx.createRadialGradient(fx, fy, 2, fx, fy, flameH);
      flmGrad.addColorStop(0, '#fef08a');
      flmGrad.addColorStop(0.5, '#f97316');
      flmGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = flmGrad;
      ctx.beginPath();
      ctx.ellipse(fx, fy - flameH * 0.5, 6, flameH * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 5. Dial Micrometer Gauge on Right End
  const gaugeX = rodStartX + rodCurrentW + 45;
  const gaugeY = rodY + rodH / 2;
  renderMicrometerDial(ctx, gaugeX, gaugeY, props.state.derived.linear.deltaL_Mm, isDark);

  // Optical Zoom Window over the expanding tip
  renderOpticalZoomWindow(
    ctx,
    rodStartX + rodCurrentW,
    rodY + rodH / 2,
    props.state.derived.linear.deltaL_Mm,
    isDark,
  );
}

function renderMicrometerDial(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  deltaL_Mm: number,
  isDark: boolean,
) {
  const dialRadius = 36;

  // Sensor plunger touching rod
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(gx - dialRadius - 25, gy);
  ctx.lineTo(gx - dialRadius, gy);
  ctx.stroke();

  // Dial Casing
  ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
  ctx.strokeStyle = isDark ? '#64748b' : '#334155';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(gx, gy, dialRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tick marks
  ctx.strokeStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.lineWidth = 1;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
    const x1 = gx + Math.cos(a) * (dialRadius - 3);
    const y1 = gy + Math.sin(a) * (dialRadius - 3);
    const x2 = gx + Math.cos(a) * (dialRadius - 7);
    const y2 = gy + Math.sin(a) * (dialRadius - 7);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Rotating Indicator Needle (1 full revolution = 1.0 mm)
  const angle = (deltaL_Mm % 1.0) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx + Math.cos(angle) * (dialRadius - 8), gy + Math.sin(angle) * (dialRadius - 8));
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(gx, gy, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Digital delta L badge beneath dial
  const bw = 85;
  const bh = 22;
  ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(gx - bw / 2, gy + dialRadius + 10, bw, bh, 5);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`ΔL = ${deltaL_Mm.toFixed(3)} mm`, gx, gy + dialRadius + 25);
}

function renderOpticalZoomWindow(
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  deltaLMm: number,
  isDark: boolean,
) {
  const zoomX = tipX;
  const zoomY = tipY - 80;
  const zoomW = 100;
  const zoomH = 48;

  // Zoom callout box
  ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(zoomX - zoomW / 2, zoomY - zoomH / 2, zoomW, zoomH, 6);
  ctx.fill();
  ctx.stroke();

  // Pointer triangle
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(zoomX - 6, zoomY + zoomH / 2);
  ctx.lineTo(zoomX + 6, zoomY + zoomH / 2);
  ctx.lineTo(tipX, tipY - 14);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = '9px system-ui';
  ctx.fillText('بزرگ‌نمایی میکرونی', zoomX, zoomY - 8);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`+${(deltaLMm * 1000).toFixed(0)} µm`, zoomX, zoomY + 12);
}

/**
 * Mode 1: Bimetallic Strip & Thermostat Switch
 */
function renderBimetalThermostat(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isDark: boolean,
) {
  const clampX = Math.max(50, w * 0.15);
  const clampY = h * 0.55;
  const stripLength = Math.min(380, w * 0.55);
  const stripThickness = 14;

  // Fixed Anchor Wall on Left
  ctx.fillStyle = isDark ? '#334155' : '#475569';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(clampX - 35, clampY - 45, 35, 90, 4);
  ctx.fill();
  ctx.stroke();

  // Bimetal Curvature & Deflection
  // tip deflection exaggerated visually for clear intuitive curling
  const tipDeflection = props.state.derived.bimetal.tipDeflectionMm * 4.5;
  const endX = clampX + stripLength;
  const endY = clampY - tipDeflection;

  const m1 = METALS_DATABASE[props.params.metal1] || METALS_DATABASE.brass;
  const m2 = METALS_DATABASE[props.params.metal2] || METALS_DATABASE.invar;

  // Top Layer (Metal 1)
  ctx.strokeStyle = m1.colorHex;
  ctx.lineWidth = stripThickness / 2;
  ctx.beginPath();
  ctx.moveTo(clampX, clampY - stripThickness / 4);
  ctx.quadraticCurveTo(
    clampX + stripLength * 0.5,
    clampY - tipDeflection * 0.5 - stripThickness / 4,
    endX,
    endY - stripThickness / 4,
  );
  ctx.stroke();

  // Bottom Layer (Metal 2)
  ctx.strokeStyle = m2.colorHex;
  ctx.lineWidth = stripThickness / 2;
  ctx.beginPath();
  ctx.moveTo(clampX, clampY + stripThickness / 4);
  ctx.quadraticCurveTo(
    clampX + stripLength * 0.5,
    clampY - tipDeflection * 0.5 + stripThickness / 4,
    endX,
    endY + stripThickness / 4,
  );
  ctx.stroke();

  // Electrical Contact Terminal at the Top
  const contactX = endX + 10;
  const contactY = clampY - 24; // Contact target position

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(contactX, contactY - 35);
  ctx.lineTo(contactX, contactY);
  ctx.stroke();

  // Silver Contact Nodule
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.arc(contactX, contactY, 5, 0, Math.PI * 2);
  ctx.fill();

  // Tip Contact on Bimetal Strip
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.arc(endX, endY - stripThickness / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // Thermostat Light Bulb Indicator (💡 ON if closed, OFF if open)
  const isClosed = props.state.derived.bimetal.switchContactClosed;
  const bulbX = contactX + 45;
  const bulbY = contactY - 35;

  ctx.fillStyle = isClosed ? '#facc15' : (isDark ? '#334155' : '#cbd5e1');
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(bulbX, bulbY, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.font = '16px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('💡', bulbX, bulbY + 5);

  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = 'bold 11px system-ui';
  ctx.fillText(isClosed ? 'مدار وصل (ON)' : 'مدار قطع (OFF)', bulbX, bulbY + 34);

  // Metal Layer Labels
  ctx.textAlign = 'left';
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = m1.colorHex;
  ctx.fillText(`▲ ${m1.name.toUpperCase()} (α₁ = ${(m1.alpha * 1e6).toFixed(1)}×10⁻⁶)`, clampX + 10, clampY - 24);
  ctx.fillStyle = m2.colorHex;
  ctx.fillText(`▼ ${m2.name.toUpperCase()} (α₂ = ${(m2.alpha * 1e6).toFixed(1)}×10⁻⁶)`, clampX + 10, clampY + 30);
}

/**
 * Mode 2: Anomalous Water Expansion Dilatometer Flask
 */
function renderWaterAnomalyFlask(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isDark: boolean,
) {
  const flaskX = w / 2;
  const flaskY = h * 0.65;
  const bulbR = 55;
  const stemW = 12;
  const stemH = 150;

  // 1. Water Dilatometer Glass Vessel
  // Flask Bulb at bottom
  ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.6)';
  ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.arc(flaskX, flaskY, bulbR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Glass Capillary Stem extending upward
  const stemTopY = flaskY - bulbR - stemH;
  ctx.beginPath();
  ctx.rect(flaskX - stemW / 2, stemTopY, stemW, stemH + 5);
  ctx.fill();
  ctx.stroke();

  // 2. Tinted Water Liquid Inside Flask
  const waterGrad = ctx.createLinearGradient(flaskX - bulbR, 0, flaskX + bulbR, 0);
  waterGrad.addColorStop(0, 'rgba(56, 189, 248, 0.65)');
  waterGrad.addColorStop(1, 'rgba(14, 165, 233, 0.75)');

  ctx.fillStyle = waterGrad;
  ctx.beginPath();
  ctx.arc(flaskX, flaskY, bulbR - 2, 0, Math.PI * 2);
  ctx.fill();

  // Water level inside capillary tube:
  // Relative volume V / V(4°C):
  // At 4°C -> lowest level (stemTopY + 120)
  // At 0°C -> expands! (level rises to stemTopY + 70)
  // At 15°C -> expands (level rises to stemTopY + 40)
  const relVol = props.state.derived.water.relativeVolume;
  // Normalized meniscus position
  const meniscusOffset = Math.min(100, Math.max(10, (relVol - 1.0) * 80000));
  const meniscusY = flaskY - bulbR - 20 - meniscusOffset;

  ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
  ctx.fillRect(flaskX - stemW / 2 + 1.5, meniscusY, stemW - 3, (flaskY - bulbR + 5) - meniscusY);

  // Meniscus curve
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(flaskX, meniscusY + 2, stemW / 2 - 2, 0, Math.PI);
  ctx.stroke();

  // 4°C Milestone Marker Line on Capillary Tube
  const milestone4CY = flaskY - bulbR - 20;
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(flaskX - stemW / 2 - 25, milestone4CY);
  ctx.lineTo(flaskX + stemW / 2 + 25, milestone4CY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('کمترین حجم در 4°C ◄', flaskX - stemW / 2 - 4, milestone4CY + 3);

  // Water Anomaly Banner
  if (props.state.derived.water.anomalousRegion) {
    const alertW = 260;
    const alertH = 34;
    const alertX = flaskX - alertW / 2;
    const alertY = flaskY + bulbR + 25;

    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(alertX, alertY, alertW, alertH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('⚠️ ناحیه رفتار ناهنجار آب (۰ تا ۴ درجه سانتی‌گراد)', flaskX, alertY + 16);
    ctx.font = '10px system-ui';
    ctx.fillText('سرد شدن سبب انبساط و کاهش چگالی آب می‌شود!', flaskX, alertY + 29);
  }
}

function renderHUD(ctx: CanvasRenderingContext2D, w: number, isDark: boolean) {
  const cardW = Math.min(500, w - 32);
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

  if (props.params.expansionType === 'linear') {
    ctx.fillText('میزان انبساط طولی (ΔL)', cardX + cardW * 0.28, cardY + 18);
    ctx.fillText('دمای فعلی (T)', cardX + cardW * 0.74, cardY + 18);

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`+${props.state.derived.linear.deltaL_Mm.toFixed(3)} mm`, cardX + cardW * 0.28, cardY + 38);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`${props.state.temperatureC.toFixed(1)} °C`, cardX + cardW * 0.74, cardY + 38);
  } else if (props.params.expansionType === 'bimetal') {
    ctx.fillText('انحراف سر تیغه (Deflection)', cardX + cardW * 0.28, cardY + 18);
    ctx.fillText('وضعیت کلید ترموستات', cardX + cardW * 0.74, cardY + 18);

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${props.state.derived.bimetal.tipDeflectionMm.toFixed(2)} mm`, cardX + cardW * 0.28, cardY + 38);

    ctx.font = 'bold 13px system-ui';
    ctx.fillStyle = props.state.derived.bimetal.switchContactClosed ? '#10b981' : '#ef4444';
    ctx.fillText(
      props.state.derived.bimetal.switchContactClosed ? '✓ تماس متصل (ON)' : '✗ تماس باز (OFF)',
      cardX + cardW * 0.74,
      cardY + 38,
    );
  } else {
    ctx.fillText('چگالی آب در دمای فعلی (ρ)', cardX + cardW * 0.28, cardY + 18);
    ctx.fillText('تغییر حجم آب (ΔV)', cardX + cardW * 0.74, cardY + 18);

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#06b6d4';
    ctx.fillText(`${props.state.derived.water.densityGPerCm3.toFixed(5)} g/cm³`, cardX + cardW * 0.28, cardY + 38);

    ctx.fillStyle = props.state.derived.water.volumeChangeCm3 >= 0 ? '#10b981' : '#f59e0b';
    ctx.fillText(`${props.state.derived.water.volumeChangeCm3 > 0 ? '+' : ''}${props.state.derived.water.volumeChangeCm3.toFixed(3)} cm³`, cardX + cardW * 0.74, cardY + 38);
  }
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

.thermal-expansion-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
