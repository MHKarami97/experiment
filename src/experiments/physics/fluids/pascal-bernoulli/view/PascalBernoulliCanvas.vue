<template>
  <div class="canvas-container">
    <canvas ref="canvasRef" class="pascal-bernoulli-canvas" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useAppStore } from '@/app/store';
import type { PascalBernoulliState, PascalBernoulliParams } from '../model/pascal-bernoulli';

const props = defineProps<{
  state: PascalBernoulliState;
  params: PascalBernoulliParams;
}>();

const store = useAppStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;

function getFluidColor(density: number) {
  if (density < 10) {
    // Air / Gas
    return {
      fill: 'rgba(224, 242, 254, 0.25)',
      surface: '#38bdf8',
      manometerFill: 'rgba(56, 189, 248, 0.4)',
    };
  } else if (density < 900) {
    // Oil / Gasoline
    return {
      fill: 'rgba(245, 158, 11, 0.35)',
      surface: '#f59e0b',
      manometerFill: 'rgba(217, 119, 6, 0.55)',
    };
  } else if (density > 1300) {
    // Honey / Glycerol
    return {
      fill: 'rgba(217, 119, 6, 0.45)',
      surface: '#b45309',
      manometerFill: 'rgba(180, 83, 9, 0.65)',
    };
  } else {
    // Water
    return {
      fill: 'rgba(56, 189, 248, 0.35)',
      surface: '#0284c7',
      manometerFill: 'rgba(2, 132, 199, 0.5)',
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

  if (props.params.apparatusMode === 'venturi') {
    renderVenturi(ctx, w, h, isDark);
  } else {
    renderHydraulic(ctx, w, h, isDark);
  }

  ctx.restore();
}

function renderVenturi(ctx: CanvasRenderingContext2D, w: number, h: number, isDark: boolean) {
  const pipeX = 40;
  const pipeW = w - 80;
  const pipeY = 160; // Anchored near top
  const maxR = Math.min(65, h * 0.14);
  const throatR = maxR * (props.state.venturi.area2 / props.state.venturi.area1) ** 0.5;

  const fluidColor = getFluidColor(props.params.fluidDensity);

  // Pipe Profile Functions: getRadius at relative position xRel in [0, 1]
  const getRadius = (xRel: number) => {
    if (xRel < 0.32) return maxR;
    if (xRel <= 0.48) {
      const p = (xRel - 0.32) / 0.16;
      const smooth = 0.5 * (1 + Math.cos(p * Math.PI)); // 1 -> 0
      return throatR + (maxR - throatR) * smooth;
    }
    if (xRel < 0.58) return throatR;
    if (xRel <= 0.74) {
      const p = (xRel - 0.58) / 0.16;
      const smooth = 0.5 * (1 - Math.cos(p * Math.PI)); // 0 -> 1
      return throatR + (maxR - throatR) * smooth;
    }
    return maxR;
  };

  // 1. Fill Pipe Fluid
  ctx.beginPath();
  // Top boundary left to right
  for (let x = 0; x <= pipeW; x += 6) {
    const r = getRadius(x / pipeW);
    const px = pipeX + x;
    const py = pipeY - r;
    if (x === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  // Bottom boundary right to left
  for (let x = pipeW; x >= 0; x -= 6) {
    const r = getRadius(x / pipeW);
    const px = pipeX + x;
    const py = pipeY + r;
    ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fluidColor.fill;
  ctx.fill();

  // 2. Streamline Flow Particles
  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
  for (const p of props.state.particles) {
    if (p.x < 0 || p.x > 1) continue;
    const px = pipeX + p.x * pipeW;
    const localR = getRadius(p.x);
    const py = pipeY + p.offsetY * (localR - 4);

    ctx.beginPath();
    // Particles stretch horizontally in higher velocity sections
    const vRatio = localR < maxR ? (maxR / localR) : 1.0;
    const pLen = Math.min(10, 3 * vRatio);
    ctx.ellipse(px, py, pLen, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Manometer Tubes (3 vertical observation tubes: Inlet, Throat, Outlet)
  const manometers = [
    { xRel: 0.18, label: 'P₁', pVal: props.state.venturi.pressure1, vVal: props.state.venturi.velocity1, hFrac: 0.78 },
    { xRel: 0.53, label: 'P₂', pVal: props.state.venturi.pressure2, vVal: props.state.venturi.velocity2, hFrac: 0.78 * (props.state.venturi.pressure2 / props.state.venturi.pressure1) },
    { xRel: 0.88, label: 'P₃', pVal: props.params.isRealMode ? props.state.venturi.pressure1 * 0.94 : props.state.venturi.pressure1, vVal: props.state.venturi.velocity1, hFrac: props.params.isRealMode ? 0.73 : 0.78 },
  ];

  const tubeW = 20;
  const maxManoH = 95;

  manometers.forEach((m) => {
    const mx = pipeX + m.xRel * pipeW - tubeW / 2;
    const localR = getRadius(m.xRel);
    const bottomY = pipeY - localR;
    const topY = bottomY - maxManoH;
    const liquidH = Math.max(12, Math.min(maxManoH - 8, maxManoH * m.hFrac));
    const liquidY = bottomY - liquidH;

    // Tube Liquid fill
    ctx.fillStyle = fluidColor.manometerFill;
    ctx.fillRect(mx + 2, liquidY, tubeW - 4, liquidH + 2);

    // Liquid meniscus
    ctx.strokeStyle = fluidColor.surface;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(mx + 2, liquidY);
    ctx.lineTo(mx + tubeW - 2, liquidY);
    ctx.stroke();

    // Glass tube borders
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(mx, bottomY);
    ctx.lineTo(mx, topY);
    ctx.moveTo(mx + tubeW, bottomY);
    ctx.lineTo(mx + tubeW, topY);
    ctx.stroke();

    // Measurement badge above tube
    ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
    ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(mx - 22, topY - 32, tubeW + 44, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${m.label}: ${(m.pVal / 1000).toFixed(1)} kPa`, mx + tubeW / 2, topY - 15);
  });

  // 4. Pipe Glass Walls
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 23, 42, 0.7)';
  ctx.lineWidth = 3.5;

  // Top Wall with gaps for manometer tubes
  ctx.beginPath();
  for (let x = 0; x <= pipeW; x += 4) {
    const xRel = x / pipeW;
    const inMano = manometers.some((m) => Math.abs(xRel - m.xRel) < 0.016);
    const r = getRadius(xRel);
    const px = pipeX + x;
    const py = pipeY - r;

    if (inMano) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();

  // Bottom Wall (continuous)
  ctx.beginPath();
  for (let x = 0; x <= pipeW; x += 4) {
    const r = getRadius(x / pipeW);
    const px = pipeX + x;
    const py = pipeY + r;
    if (x === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // 5. Velocity Vectors
  drawVelocityVector(ctx, pipeX + 0.16 * pipeW, pipeY, props.state.venturi.velocity1, isDark, 'v₁');
  drawVelocityVector(ctx, pipeX + 0.53 * pipeW, pipeY, props.state.venturi.velocity2, isDark, 'v₂');

  // 6. Telemetry HUD Bar at bottom
  const hudY = pipeY + maxR + 50;
  ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(241, 245, 249, 0.9)';
  ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(pipeX, hudY, pipeW, 64, 8);
  ctx.fill();
  ctx.stroke();

  const metrics = [
    { label: 'دبی حجمی (Q)', val: `${(props.state.venturi.volumeFlowRate * 1000).toFixed(1)} L/s` },
    { label: 'افت فشار (ΔP)', val: `${(props.state.venturi.deltaPressure / 1000).toFixed(2)} kPa` },
    { label: 'سرعت گلویی (v₂)', val: `${props.state.venturi.velocity2.toFixed(2)} m/s` },
    { label: 'نسبت سرعت (v₂/v₁)', val: `${(props.state.venturi.velocity2 / props.state.venturi.velocity1).toFixed(1)}×` },
  ];

  const colW = pipeW / metrics.length;
  metrics.forEach((m, idx) => {
    const cx = pipeX + idx * colW + colW / 2;
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(m.label, cx, hudY + 22);

    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(m.val, cx, hudY + 46);
  });
}

function drawVelocityVector(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  v: number,
  isDark: boolean,
  label: string,
) {
  const len = Math.min(80, 16 * v);
  const color = '#10b981';

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(x - len / 2, y);
  ctx.lineTo(x + len / 2, y);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(x + len / 2, y);
  ctx.lineTo(x + len / 2 - 8, y - 4);
  ctx.lineTo(x + len / 2 - 8, y + 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`${label} = ${v.toFixed(1)} m/s`, x, y - 10);
}

function renderHydraulic(ctx: CanvasRenderingContext2D, w: number, h: number, isDark: boolean) {
  const baseX = 50;
  const baseW = w - 100;
  const floorY = Math.min(370, h - 85);
  const chamberH = 170;
  const chamberTopY = floorY - chamberH;

  const leftW = 75; // Small cylinder 1
  const rightW = Math.min(220, baseW * 0.48); // Large cylinder 2
  const leftX = baseX + 25;
  const rightX = baseX + baseW - rightW - 25;
  const pipeH = 45; // Connecting tube at bottom

  const fluidColor = getFluidColor(props.params.fluidDensity);

  // Stroke movement: piston 1 moves down by inputDisplacement, piston 2 moves up
  const progress = props.state.pistonProgress; // 0 to 1
  const maxPiston1Travel = 55;
  const piston1DispY = progress * maxPiston1Travel;
  const piston2DispY = (progress * maxPiston1Travel) / props.state.hydraulic.mechanicalAdvantage;

  const p1Y = chamberTopY + 30 + piston1DispY;
  const p2Y = chamberTopY + 30 - piston2DispY;

  // 1. Draw Hydraulic Fluid fill
  ctx.fillStyle = fluidColor.fill;
  ctx.beginPath();
  // Left cylinder fluid
  ctx.rect(leftX + 3, p1Y + 16, leftW - 6, floorY - (p1Y + 16));
  // Connecting pipe fluid
  ctx.rect(leftX + leftW - 3, floorY - pipeH, rightX - (leftX + leftW) + 6, pipeH - 3);
  // Right cylinder fluid
  ctx.rect(rightX + 3, p2Y + 22, rightW - 6, floorY - (p2Y + 22));
  ctx.fill();

  // 2. Draw Chamber Glass/Steel Enclosures
  ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  // Left Cylinder outer walls
  ctx.moveTo(leftX, chamberTopY);
  ctx.lineTo(leftX, floorY);
  ctx.lineTo(rightX + rightW, floorY);
  ctx.lineTo(rightX + rightW, chamberTopY);
  ctx.stroke();

  // Inner corner walls & connecting pipe ceiling
  ctx.beginPath();
  ctx.moveTo(leftX + leftW, chamberTopY);
  ctx.lineTo(leftX + leftW, floorY - pipeH);
  ctx.lineTo(rightX, floorY - pipeH);
  ctx.lineTo(rightX, chamberTopY);
  ctx.stroke();

  // 3. Piston 1 (Input Piston)
  ctx.fillStyle = isDark ? '#475569' : '#cbd5e1';
  ctx.strokeStyle = isDark ? '#94a3b8' : '#475569';
  ctx.lineWidth = 2;
  ctx.fillRect(leftX + 4, p1Y, leftW - 8, 18);
  ctx.strokeRect(leftX + 4, p1Y, leftW - 8, 18);

  // Input Push Rod & Force Arrow
  const rod1X = leftX + leftW / 2;
  ctx.strokeStyle = isDark ? '#cbd5e1' : '#334155';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(rod1X, p1Y);
  ctx.lineTo(rod1X, p1Y - 45);
  ctx.stroke();

  // F1 Force Arrow
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(rod1X, p1Y - 55);
  ctx.lineTo(rod1X, p1Y - 25);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rod1X, p1Y - 20);
  ctx.lineTo(rod1X - 6, p1Y - 28);
  ctx.lineTo(rod1X + 6, p1Y - 28);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`F₁ = ${props.state.hydraulic.outputForce > 0 ? (props.params as any).inputForce : 200} N`, rod1X, p1Y - 62);

  // 4. Piston 2 (Output Platform Piston)
  ctx.fillStyle = isDark ? '#334155' : '#94a3b8';
  ctx.strokeStyle = isDark ? '#94a3b8' : '#334155';
  ctx.lineWidth = 2;
  ctx.fillRect(rightX + 4, p2Y, rightW - 8, 22);
  ctx.strokeRect(rightX + 4, p2Y, rightW - 8, 22);

  // Platform Lifter Shafts
  const rod2X = rightX + rightW / 2;
  ctx.strokeStyle = isDark ? '#cbd5e1' : '#334155';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(rod2X, p2Y);
  ctx.lineTo(rod2X, p2Y - 35);
  ctx.stroke();

  // Heavy Load / Platform
  const platW = rightW + 20;
  const platX = rod2X - platW / 2;
  const platY = p2Y - 42;
  ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(platX, platY, platW, 10, 4);
  ctx.fill();
  ctx.stroke();

  // Stylized Weight Block / Car Cargo
  const cargoW = platW - 24;
  const cargoH = 34;
  const cargoX = rod2X - cargoW / 2;
  const cargoY = platY - cargoH;
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.roundRect(cargoX, cargoY, cargoW, cargoH, 6);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`بسته بار: ${props.state.hydraulic.liftedMass.toFixed(0)} kg`, rod2X, cargoY + 21);

  // F2 Output Force Badge
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`↑ F₂ = ${props.state.hydraulic.outputForce.toFixed(0)} N`, rod2X, platY - 42);

  // 5. Connecting Pipe Pressure Gauge
  const gaugeX = (leftX + leftW + rightX) / 2;
  const gaugeY = floorY - pipeH / 2;
  ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(gaugeX, gaugeY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${(props.state.hydraulic.fluidPressure / 1000).toFixed(0)}`, gaugeX, gaugeY - 4);
  ctx.font = '8px system-ui';
  ctx.fillText(`kPa`, gaugeX, gaugeY + 6);
  ctx.textBaseline = 'alphabetic';

  // 6. Mechanical Advantage & Work Telemetry
  const hudY = floorY + 16;
  ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(241, 245, 249, 0.9)';
  ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(baseX, hudY, baseW, 58, 8);
  ctx.fill();
  ctx.stroke();

  const metrics = [
    { label: 'مزیت مکانیکی (A₂/A₁)', val: `${props.state.hydraulic.mechanicalAdvantage.toFixed(1)}×` },
    { label: 'کار ورودی (W₁)', val: `${props.state.hydraulic.workInput.toFixed(1)} J` },
    { label: 'کار خروجی (W₂)', val: `${props.state.hydraulic.workOutput.toFixed(1)} J` },
    { label: 'راندمان هیدرولیک (η)', val: `${(props.state.hydraulic.efficiency * 100).toFixed(0)}%` },
  ];

  const colW = baseW / metrics.length;
  metrics.forEach((m, idx) => {
    const cx = baseX + idx * colW + colW / 2;
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(m.label, cx, hudY + 20);

    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(m.val, cx, hudY + 42);
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

.pascal-bernoulli-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
