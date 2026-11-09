<template>
  <div class="canvas-container">
    <canvas ref="canvasRef" class="viscosity-canvas" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useAppStore } from '@/app/store';
import type { ViscosityState, ViscosityParams } from '../model/viscosity-pipe';

const props = defineProps<{
  state: ViscosityState;
  params: ViscosityParams;
}>();

const store = useAppStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;

function getFluidTheme(type: string) {
  switch (type) {
    case 'motor-oil':
      return {
        fill: 'rgba(217, 119, 6, 0.35)',
        surface: '#b45309',
        manometer: 'rgba(180, 83, 9, 0.75)',
        dye: '#dc2626',
      };
    case 'glycerin':
      return {
        fill: 'rgba(245, 158, 11, 0.25)',
        surface: '#d97706',
        manometer: 'rgba(217, 119, 6, 0.65)',
        dye: '#9333ea',
      };
    case 'honey':
      return {
        fill: 'rgba(180, 83, 9, 0.45)',
        surface: '#92400e',
        manometer: 'rgba(146, 64, 14, 0.85)',
        dye: '#b91c1c',
      };
    case 'air':
      return {
        fill: 'rgba(224, 242, 254, 0.2)',
        surface: '#38bdf8',
        manometer: 'rgba(56, 189, 248, 0.5)',
        dye: '#ef4444',
      };
    case 'water':
    default:
      return {
        fill: 'rgba(56, 189, 248, 0.35)',
        surface: '#0284c7',
        manometer: 'rgba(2, 132, 199, 0.7)',
        dye: '#ef4444',
      };
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

  // 1. Background
  ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  // Layout Geometry: anchored near top
  const pipeX = 50;
  const pipeW = w - 100;
  const pipeY = 165;
  const pipeH = Math.min(100, Math.max(50, (props.params.pipeDiameter / 10.0) * 110));
  const pipeRadiusPx = pipeH / 2;

  const theme = getFluidTheme(props.params.fluidType);

  // 2. Fluid Inside Pipe
  ctx.fillStyle = theme.fill;
  ctx.fillRect(pipeX, pipeY - pipeRadiusPx, pipeW, pipeH);

  // 3. Manometer Riser Tubes (Upstream P1 and Downstream P2)
  const manoUpX = pipeX + 0.22 * pipeW;
  const manoDownX = pipeX + 0.78 * pipeW;
  const manoW = 20;
  const maxManoH = 90;

  // Pressure difference causes level difference:
  const dpRatio = Math.min(0.85, (props.params.pressureDiff / 5000) * 0.75 + 0.1);
  const upLevel = maxManoH * 0.85;
  const downLevel = Math.max(12, upLevel - dpRatio * maxManoH);

  drawManometer(ctx, manoUpX, pipeY - pipeRadiusPx, manoW, maxManoH, upLevel, theme.manometer, theme.surface, isDark, 'P₁ (ورودی)');
  drawManometer(ctx, manoDownX, pipeY - pipeRadiusPx, manoW, maxManoH, downLevel, theme.manometer, theme.surface, isDark, 'P₂ (خروجی)');

  // Pressure Gradient Arrow
  ctx.strokeStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(manoUpX + manoW, pipeY - pipeRadiusPx - upLevel);
  ctx.lineTo(manoDownX, pipeY - pipeRadiusPx - downLevel);
  ctx.stroke();
  ctx.setLineDash([]);

  // Delta P tag
  const midX = (manoUpX + manoDownX) / 2;
  const midY = pipeY - pipeRadiusPx - (upLevel + downLevel) / 2 - 12;
  ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`ΔP = ${props.params.pressureDiff.toFixed(0)} Pa`, midX, midY);

  // 4. Parabolic Velocity Profile (Poiseuille vectors overlay at x = 0.45 * pipeW)
  const profileX = pipeX + 0.42 * pipeW;
  drawVelocityProfile(ctx, profileX, pipeY, pipeRadiusPx, props.state.derived, isDark);

  // 5. Reynolds Dye Injection Experiment
  // Dye injector needle at entrance
  const needleX = pipeX - 25;
  const needleY = pipeY;
  ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
  ctx.fillRect(needleX, needleY - 3, 28, 6);
  ctx.fillStyle = theme.dye;
  ctx.beginPath();
  ctx.arc(needleX, needleY, 5, 0, Math.PI * 2);
  ctx.fill();

  // Draw dye tracer particles
  ctx.fillStyle = theme.dye;
  for (const p of props.state.dyeParticles) {
    if (p.x < 0 || p.x > 1) continue;
    const px = pipeX + p.x * pipeW;
    const py = pipeY + p.y * (pipeRadiusPx - 4);

    ctx.beginPath();
    // In laminar flow: tight filament. In turbulent flow: dispersed blotches.
    const radius = props.state.derived.regime === 'laminar' ? 1.8 : (props.state.derived.regime === 'transition' ? 2.5 : 3.8);
    const alpha = Math.max(0.2, 1.0 - p.x * 0.4);
    ctx.globalAlpha = alpha;
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  // 6. Transparent Glass Pipe Walls & Couplings
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(15, 23, 42, 0.75)';
  ctx.lineWidth = 3.5;

  // Top Wall (with gaps for manometers)
  ctx.beginPath();
  ctx.moveTo(pipeX, pipeY - pipeRadiusPx);
  ctx.lineTo(manoUpX, pipeY - pipeRadiusPx);
  ctx.moveTo(manoUpX + manoW, pipeY - pipeRadiusPx);
  ctx.lineTo(manoDownX, pipeY - pipeRadiusPx);
  ctx.moveTo(manoDownX + manoW, pipeY - pipeRadiusPx);
  ctx.lineTo(pipeX + pipeW, pipeY - pipeRadiusPx);
  ctx.stroke();

  // Bottom Wall
  ctx.beginPath();
  ctx.moveTo(pipeX, pipeY + pipeRadiusPx);
  ctx.lineTo(pipeX + pipeW, pipeY + pipeRadiusPx);
  ctx.stroke();

  // Metallic Flanges at both ends
  drawFlange(ctx, pipeX, pipeY, pipeRadiusPx, isDark);
  drawFlange(ctx, pipeX + pipeW, pipeY, pipeRadiusPx, isDark);

  // 7. Reynolds Regime Banner Badge
  drawRegimeBadge(ctx, pipeX, pipeY - pipeRadiusPx - 40, props.state.derived, isDark);

  // 8. Bottom Telemetry HUD
  const hudY = pipeY + pipeRadiusPx + 42;
  const hudH = 68;
  ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(241, 245, 249, 0.92)';
  ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(pipeX, hudY, pipeW, hudH, 8);
  ctx.fill();
  ctx.stroke();

  const metrics = [
    { label: 'عدد رینولدز (Re)', val: props.state.derived.reynoldsNumber.toFixed(0) },
    { label: 'دبی حجمی (Q)', val: `${(props.state.derived.volumeFlowRate * 1000).toFixed(2)} L/s` },
    { label: 'سرعت متوسط (v_avg)', val: `${props.state.derived.avgVelocity.toFixed(3)} m/s` },
    { label: 'گرانروی دینامیکی (η)', val: `${(props.state.derived.dynamicViscosity * 1000).toFixed(1)} mPa·s` },
    { label: 'تنش برشی دیواره (τ_w)', val: `${props.state.derived.wallShearStress.toFixed(1)} Pa` },
  ];

  const colW = pipeW / metrics.length;
  metrics.forEach((m, idx) => {
    const cx = pipeX + idx * colW + colW / 2;
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(m.label, cx, hudY + 24);

    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(m.val, cx, hudY + 50);
  });

  ctx.restore();
}

function drawManometer(
  ctx: CanvasRenderingContext2D,
  x: number,
  bottomY: number,
  w: number,
  maxH: number,
  liquidH: number,
  fillColor: string,
  surfaceColor: string,
  isDark: boolean,
  label: string,
) {
  const topY = bottomY - maxH;
  const liquidY = bottomY - liquidH;

  // Liquid Fill
  ctx.fillStyle = fillColor;
  ctx.fillRect(x + 2, liquidY, w - 4, liquidH);

  // Meniscus
  ctx.strokeStyle = surfaceColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 2, liquidY);
  ctx.lineTo(x + w - 2, liquidY);
  ctx.stroke();

  // Glass Wall
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, bottomY);
  ctx.lineTo(x, topY);
  ctx.moveTo(x + w, bottomY);
  ctx.lineTo(x + w, topY);
  ctx.stroke();

  // Label above
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, topY - 8);
}

function drawFlange(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, isDark: boolean) {
  const flangeH = r * 2 + 18;
  const flangeW = 10;
  ctx.fillStyle = isDark ? '#475569' : '#94a3b8';
  ctx.strokeStyle = isDark ? '#64748b' : '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - flangeW / 2, y - flangeH / 2, flangeW, flangeH, 3);
  ctx.fill();
  ctx.stroke();
}

function drawVelocityProfile(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  derived: any,
  isDark: boolean,
) {
  const numVectors = 9;
  const maxArrowLen = 65;

  ctx.strokeStyle = '#10b981';
  ctx.fillStyle = '#10b981';
  ctx.lineWidth = 1.5;

  // Centerline axis
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy);
  ctx.lineTo(cx + maxArrowLen + 20, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw velocity parabolic profile curve
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const rNorm = -1.0 + (i / 24) * 2.0;
    const py = cy + rNorm * radius;
    let len = 0;
    if (derived.regime === 'laminar') {
      len = maxArrowLen * (1 - rNorm * rNorm);
    } else {
      len = maxArrowLen * Math.pow(Math.max(0, 1 - Math.abs(rNorm)), 0.25);
    }
    const px = cx + len;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Draw velocity arrows
  for (let i = 0; i <= numVectors; i++) {
    const rNorm = -0.85 + (i / numVectors) * 1.7;
    const py = cy + rNorm * radius;
    let len = 0;
    if (derived.regime === 'laminar') {
      len = maxArrowLen * (1 - rNorm * rNorm);
    } else {
      len = maxArrowLen * Math.pow(Math.max(0, 1 - Math.abs(rNorm)), 0.25);
    }

    if (len < 4) continue;

    ctx.beginPath();
    ctx.moveTo(cx, py);
    ctx.lineTo(cx + len, py);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(cx + len, py);
    ctx.lineTo(cx + len - 5, py - 3);
    ctx.lineTo(cx + len - 5, py + 3);
    ctx.closePath();
    ctx.fill();
  }

  // Label
  ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
  ctx.font = 'bold 9px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('پروفیل سرعت v(r)', cx + maxArrowLen / 2, cy - radius - 8);
}

function drawRegimeBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  derived: any,
  _isDark: boolean,
) {
  let badgeText = '';
  let badgeColor = '';

  if (derived.regime === 'laminar') {
    badgeText = `جریان آرام (Laminar) — Re = ${derived.reynoldsNumber.toFixed(0)} < ۲۳۰۰`;
    badgeColor = '#10b981';
  } else if (derived.regime === 'transition') {
    badgeText = `ناحیه گذار (Transition) — Re = ${derived.reynoldsNumber.toFixed(0)}`;
    badgeColor = '#f59e0b';
  } else {
    badgeText = `جریان متلاطم (Turbulent) — Re = ${derived.reynoldsNumber.toFixed(0)} > ۴۰۰۰`;
    badgeColor = '#ef4444';
  }

  ctx.fillStyle = badgeColor;
  ctx.beginPath();
  ctx.roundRect(x, y, 260, 24, 6);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, x + 130, y + 16);
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

.viscosity-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
