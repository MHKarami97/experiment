<template>
  <div class="canvas-container">
    <canvas ref="canvasRef" class="calorimetry-canvas" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useAppStore } from '@/app/store';
import type { CalorimetryState, CalorimetryParams } from '../model/calorimetry';

const props = defineProps<{
  state: CalorimetryState;
  params: CalorimetryParams;
}>();

const store = useAppStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;
let stirrerPhase = 0;

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
  ctx.fillStyle = isDark ? '#0b1120' : '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  // Vessel dimensions & position
  const vesselW = Math.min(340, w * 0.65);
  const vesselH = Math.min(320, h * 0.62);
  const vesselX = (w - vesselW) / 2;
  const vesselY = h - vesselH - 45;

  const innerMargin = 16;
  const innerW = vesselW - innerMargin * 2;
  const innerH = vesselH - innerMargin;
  const innerX = vesselX + innerMargin;
  const innerY = vesselY + 8;

  // 2. Outer Calorimeter Insulated Shell
  ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
  ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(vesselX, vesselY, vesselW, vesselH, [0, 0, 24, 24]);
  ctx.fill();
  ctx.stroke();

  // Insulation Layer Hatching
  ctx.fillStyle = isDark ? '#334155' : '#cbd5e1';
  ctx.fillRect(vesselX + 4, vesselY + 8, vesselW - 8, vesselH - 12);

  // 3. Inner Dewar Vessel Cup
  ctx.fillStyle = isDark ? '#090d16' : '#ffffff';
  ctx.beginPath();
  ctx.roundRect(innerX, innerY, innerW, innerH, [0, 0, 16, 16]);
  ctx.fill();
  ctx.strokeStyle = isDark ? '#64748b' : '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 4. Liquid Bath inside Inner Cup
  const liquidFillRatio = Math.min(0.85, Math.max(0.35, props.params.liquidMassGrams / 550));
  const liquidH = innerH * liquidFillRatio;
  const liquidY = innerY + innerH - liquidH;

  let liquidColor = 'rgba(56, 189, 248, 0.45)'; // default water cyan
  if (props.params.liquidMedium === 'ethanol') {
    liquidColor = 'rgba(168, 85, 247, 0.35)'; // purple tint
  } else if (props.params.liquidMedium === 'oil') {
    liquidColor = 'rgba(234, 179, 8, 0.45)'; // amber oil
  }

  const liqGrad = ctx.createLinearGradient(innerX, liquidY, innerX, innerY + innerH);
  liqGrad.addColorStop(0, liquidColor);
  liqGrad.addColorStop(1, liquidColor.replace('0.45', '0.7').replace('0.35', '0.6'));

  ctx.fillStyle = liqGrad;
  ctx.beginPath();
  ctx.roundRect(innerX + 2, liquidY, innerW - 4, liquidH - 2, [0, 0, 14, 14]);
  ctx.fill();

  // Meniscus wave ripples
  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(innerX + 2, liquidY);
  const waveAmp = props.params.stirrerActive ? 2.5 : 0.8;
  const waveFreq = 0.05;
  for (let x = innerX + 2; x <= innerX + innerW - 2; x += 4) {
    const yWave = liquidY + Math.sin((x - innerX) * waveFreq + stirrerPhase * 4) * waveAmp;
    ctx.lineTo(x, yWave);
  }
  ctx.stroke();

  // 5. Motorized Laboratory Stirrer (Left)
  const stirrerX = innerX + innerW * 0.28;
  const stirrerTopY = vesselY - 35;
  const stirrerBottomY = innerY + innerH - 22;

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(stirrerX, stirrerTopY);
  ctx.lineTo(stirrerX, stirrerBottomY);
  ctx.stroke();

  if (props.params.stirrerActive) {
    stirrerPhase += 0.08;
  }
  const paddleWidth = 26 * Math.cos(stirrerPhase);
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.ellipse(stirrerX, stirrerBottomY, Math.abs(paddleWidth), 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.roundRect(stirrerX - 16, stirrerTopY - 14, 32, 16, 4);
  ctx.fill();
  ctx.fillStyle = props.params.stirrerActive ? '#10b981' : '#ef4444';
  ctx.beginPath();
  ctx.arc(stirrerX + 9, stirrerTopY - 6, 3, 0, Math.PI * 2);
  ctx.fill();

  // 6. Submerged or Floating Sample Object
  const sampleCenterX = innerX + innerW * 0.58;
  // If ice, float near the meniscus surface (ice density < liquid); else submerged in lower middle
  const isIce = props.params.solidMaterial === 'ice';
  const sampleCenterY = isIce ? liquidY + 20 : innerY + innerH - liquidH * 0.45;

  // Suspension thread from top beam
  if (!isIce) {
    ctx.strokeStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(sampleCenterX, vesselY - 35);
    ctx.lineTo(sampleCenterX, sampleCenterY - 26);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Render Sample with high-polish metallic / ice / glass shaders
  renderSampleObject(ctx, sampleCenterX, sampleCenterY, isDark, isIce);

  // 7. Precision Immersion Thermometer (Right)
  const thermX = innerX + innerW * 0.85;
  const thermTopY = vesselY - 45;
  const thermBottomY = innerY + innerH - 18;
  renderThermometer(ctx, thermX, thermTopY, thermBottomY, isDark);

  // 8. Overlaid Top HUD & Status Badges
  renderHUD(ctx, w, isDark);

  ctx.restore();
}

function renderSampleObject(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  isDark: boolean,
  isIce: boolean,
) {
  const mat = props.params.solidMaterial;
  const massRatio = Math.min(1.4, Math.max(0.7, props.params.solidMassGrams / 180));

  // Thermal glow halo around block indicating hot or cold
  const tempDiff = props.state.solidTempC - props.state.liquidTempC;
  if (Math.abs(tempDiff) > 1.0) {
    const glowRadius = 38 * massRatio + Math.min(16, Math.abs(tempDiff) * 0.3);
    const glowGrad = ctx.createRadialGradient(cx, cy, 15, cx, cy, glowRadius);
    if (tempDiff > 0) {
      glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      glowGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    } else {
      glowGrad.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
      glowGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
    }
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  if (isIce) {
    // Floating faceted ice cubes
    const remainingFraction = Math.max(
      0.05,
      props.state.iceRemainingGrams / Math.max(1, props.params.solidMassGrams),
    );
    const cubeW = 54 * massRatio * Math.pow(remainingFraction, 1 / 3);
    const cubeH = 42 * massRatio * Math.pow(remainingFraction, 1 / 3);

    // Ice cube body
    const iceGrad = ctx.createLinearGradient(cx - cubeW / 2, cy - cubeH / 2, cx + cubeW / 2, cy + cubeH / 2);
    iceGrad.addColorStop(0, 'rgba(224, 242, 254, 0.9)');
    iceGrad.addColorStop(0.5, 'rgba(186, 230, 253, 0.8)');
    iceGrad.addColorStop(1, 'rgba(125, 211, 252, 0.85)');

    ctx.fillStyle = iceGrad;
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - cubeW / 2, cy - cubeH / 2, cubeW, cubeH, 8);
    ctx.fill();
    ctx.stroke();

    // Internal crystalline facets
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - cubeW * 0.35, cy - cubeH * 0.25);
    ctx.lineTo(cx + cubeW * 0.2, cy + cubeH * 0.2);
    ctx.moveTo(cx + cubeW * 0.25, cy - cubeH * 0.3);
    ctx.lineTo(cx - cubeW * 0.1, cy + cubeH * 0.35);
    ctx.stroke();

    // High contrast readable badge
    renderLabelBadge(
      ctx,
      cx,
      cy + cubeH / 2 + 15,
      `🧊 ${props.state.iceRemainingGrams.toFixed(0)}g یخ`,
      `${props.state.solidTempC.toFixed(1)}°C`,
      isDark,
    );
    return;
  }

  // 3D Laboratory Cylinder Sample with Eyelet Ring
  const radius = 24 * massRatio;
  const cylinderHeight = 48 * massRatio;
  const topY = cy - cylinderHeight / 2;
  const bottomY = cy + cylinderHeight / 2;
  const rx = radius;
  const ry = radius * 0.38; // 3D perspective foreshortening

  // 1. Suspension Eyelet / Brass Ring at the top
  const ringY = topY - 8;
  ctx.strokeStyle = mat === 'copper' ? '#ea580c' : '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, ringY, 6, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Cylinder Body with Metallic Specular Lighting
  const bodyGrad = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
  let strokeColor = '#475569';

  if (mat === 'copper') {
    bodyGrad.addColorStop(0.0, '#7c2d12');
    bodyGrad.addColorStop(0.2, '#c2410c');
    bodyGrad.addColorStop(0.5, '#fb923c'); // Specular sheen
    bodyGrad.addColorStop(0.8, '#ea580c');
    bodyGrad.addColorStop(1.0, '#9a3412');
    strokeColor = '#c2410c';
  } else if (mat === 'aluminum') {
    bodyGrad.addColorStop(0.0, '#475569');
    bodyGrad.addColorStop(0.2, '#94a3b8');
    bodyGrad.addColorStop(0.45, '#ffffff'); // High specular white
    bodyGrad.addColorStop(0.7, '#cbd5e1');
    bodyGrad.addColorStop(1.0, '#64748b');
    strokeColor = '#475569';
  } else if (mat === 'iron') {
    bodyGrad.addColorStop(0.0, '#1e293b');
    bodyGrad.addColorStop(0.25, '#334155');
    bodyGrad.addColorStop(0.5, '#64748b'); // Steel sheen
    bodyGrad.addColorStop(0.75, '#475569');
    bodyGrad.addColorStop(1.0, '#1e293b');
    strokeColor = '#0f172a';
  } else if (mat === 'lead') {
    bodyGrad.addColorStop(0.0, '#334155');
    bodyGrad.addColorStop(0.3, '#475569');
    bodyGrad.addColorStop(0.55, '#94a3b8');
    bodyGrad.addColorStop(0.8, '#64748b');
    bodyGrad.addColorStop(1.0, '#334155');
    strokeColor = '#1e293b';
  } else if (mat === 'glass') {
    bodyGrad.addColorStop(0.0, 'rgba(56, 189, 248, 0.4)');
    bodyGrad.addColorStop(0.3, 'rgba(186, 230, 253, 0.8)');
    bodyGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.9)');
    bodyGrad.addColorStop(1.0, 'rgba(2, 132, 199, 0.45)');
    strokeColor = '#0284c7';
  }

  // Draw Cylinder Main Hull
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(cx - rx, topY);
  ctx.lineTo(cx + rx, topY);
  ctx.lineTo(cx + rx, bottomY);
  ctx.ellipse(cx, bottomY, rx, ry, 0, 0, Math.PI, false);
  ctx.lineTo(cx - rx, topY);
  ctx.fill();

  // Cylinder bottom stroke
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, bottomY, rx, ry, 0, 0, Math.PI, false);
  ctx.stroke();

  // Draw Cylinder Top Cap Ellipse
  const topGrad = ctx.createRadialGradient(cx, topY, rx * 0.1, cx, topY, rx);
  if (mat === 'copper') {
    topGrad.addColorStop(0, '#fdba74');
    topGrad.addColorStop(1, '#c2410c');
  } else if (mat === 'aluminum') {
    topGrad.addColorStop(0, '#ffffff');
    topGrad.addColorStop(1, '#94a3b8');
  } else if (mat === 'iron') {
    topGrad.addColorStop(0, '#94a3b8');
    topGrad.addColorStop(1, '#334155');
  } else if (mat === 'lead') {
    topGrad.addColorStop(0, '#cbd5e1');
    topGrad.addColorStop(1, '#475569');
  } else {
    topGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    topGrad.addColorStop(1, 'rgba(56, 189, 248, 0.6)');
  }

  ctx.fillStyle = topGrad;
  ctx.beginPath();
  ctx.ellipse(cx, topY, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.stroke();

  // Center High-Contrast Badge for mass and dynamic temperature
  renderLabelBadge(
    ctx,
    cx,
    cy,
    `${props.params.solidMassGrams}g`,
    `${props.state.solidTempC.toFixed(1)}°C`,
    isDark,
  );
}

function renderLabelBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  title: string,
  sub: string,
  isDark: boolean,
) {
  const badgeW = 68;
  const badgeH = 34;

  ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)';
  ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(cx - badgeW / 2, cy - badgeH / 2, badgeW, badgeH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
  ctx.font = 'bold 11px system-ui';
  ctx.fillText(title, cx, cy - 2);

  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(sub, cx, cy + 12);
}

function renderThermometer(
  ctx: CanvasRenderingContext2D,
  tx: number,
  topY: number,
  bottomY: number,
  isDark: boolean,
) {
  const stemWidth = 10;
  const bulbRadius = 9;

  ctx.fillStyle = isDark ? '#1e293b' : '#f1f5f9';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(tx - stemWidth / 2, topY, stemWidth, bottomY - topY, [stemWidth / 2, stemWidth / 2, 0, 0]);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(tx, bottomY, bulbRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.stroke();

  const tempClamped = Math.min(100, Math.max(0, props.state.liquidTempC));
  const columnH = (tempClamped / 100) * (bottomY - topY - 25);

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.rect(tx - stemWidth / 2 + 2, bottomY - columnH, stemWidth - 4, columnH);
  ctx.fill();

  ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
  ctx.strokeStyle = isDark ? '#3b82f6' : '#60a5fa';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(tx - 38, topY - 26, 76, 24, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isDark ? '#60a5fa' : '#2563eb';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${props.state.liquidTempC.toFixed(1)} °C`, tx, topY - 10);
}

function renderHUD(ctx: CanvasRenderingContext2D, w: number, isDark: boolean) {
  const cardW = Math.min(480, w - 32);
  const cardH = 50;
  const cardX = (w - cardW) / 2;
  const cardY = 16;

  ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)';
  ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = '11px system-ui';
  ctx.fillText('دمای تعادل تحلیلی (T_eq)', cardX + cardW * 0.25, cardY + 18);
  ctx.fillText('وضعیت تعادل گرمایی', cardX + cardW * 0.75, cardY + 18);

  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = '#10b981';
  ctx.fillText(
    `${props.state.derived.theoreticalEquilibriumTempC.toFixed(2)} °C`,
    cardX + cardW * 0.25,
    cardY + 38,
  );

  ctx.font = 'bold 13px system-ui';
  if (props.state.isEquilibrated) {
    ctx.fillStyle = '#10b981';
    ctx.fillText('✓ در تعادل کامل', cardX + cardW * 0.75, cardY + 38);
  } else {
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('⏳ در حال تبادل گرما...', cardX + cardW * 0.75, cardY + 38);
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

.calorimetry-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
