<template>
  <div class="canvas-wrapper">
    <canvas ref="canvasRef" class="simulation-canvas"></canvas>

    <!-- Top Floating HUD -->
    <div class="canvas-hud">
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('torqueEquilibrium.hud.tauLeft') }}:</span>
        <span class="hud-val left-val">{{ state.leftTorque.toFixed(1) }} N·m</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('torqueEquilibrium.hud.tauRight') }}:</span>
        <span class="hud-val right-val">{{ state.rightTorque.toFixed(1) }} N·m</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('torqueEquilibrium.hud.tauNet') }}:</span>
        <span class="hud-val" :class="{ 'balanced-val': state.isBalanced }">
          {{ state.netTorque.toFixed(1) }} N·m
        </span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('torqueEquilibrium.hud.angle') }}:</span>
        <span class="hud-val">{{ ((state.theta * 180) / Math.PI).toFixed(1) }}°</span>
      </div>
      <div class="hud-stat-pill" :class="state.isBalanced ? 'badge-balanced' : 'badge-tilted'">
        <span class="hud-val">
          {{ state.isBalanced ? $t('torqueEquilibrium.hud.balanced') : $t('torqueEquilibrium.hud.tilted') }}
        </span>
      </div>
      <div class="hud-controls">
        <label class="hud-toggle">
          <input v-model="showVectors" type="checkbox" />
          <span>{{ $t('common.vectors') }}</span>
        </label>
        <button type="button" class="btn-hud-icon" title="Reset View" @click="resetView">
          🔍
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import type { TorqueEquilibriumState, TorqueEquilibriumParams } from '../model/torque'
import { useAppStore } from '@/app/store'

const props = defineProps<{
  state: TorqueEquilibriumState
  params: TorqueEquilibriumParams
  mode: 'ideal' | 'real'
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const showVectors = ref(true)
const store = useAppStore()

let ctx: CanvasRenderingContext2D | null = null
let width = 0
let height = 0

// Viewport / pan & zoom
let zoom = 1.0
let panX = 0
let panY = 0
let isDragging = false
let startDragX = 0
let startDragY = 0

function resetView() {
  zoom = 1.0
  panX = 0
  panY = 0
  render()
}

function handleResize() {
  if (!canvasRef.value) return
  const rect = canvasRef.value.parentElement?.getBoundingClientRect()
  if (!rect) return

  const dpr = window.devicePixelRatio || 1
  width = rect.width
  height = rect.height
  canvasRef.value.width = width * dpr
  canvasRef.value.height = height * dpr
  ctx = canvasRef.value.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
  }
  render()
}

function render() {
  if (!ctx || width === 0 || height === 0) return

  const isDark = store.theme === 'dark'

  // Clear background
  ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc'
  ctx.fillRect(0, 0, width, height)

  const scale = (width / (props.params.beamLength * 1.5)) * zoom
  const pivotX = width / 2 + panX
  const pivotY = height * 0.58 + panY
  const beamHalfL = (props.params.beamLength / 2) * scale
  const theta = props.state.theta

  // 1. Draw Ground / Floor Bench
  const groundY = pivotY + 110 * zoom
  ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0'
  ctx.fillRect(0, groundY, width, height - groundY)
  ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, groundY)
  ctx.lineTo(width, groundY)
  ctx.stroke()

  // Floor stripes / tiles
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, groundY)
    ctx.lineTo(x + 20, height)
    ctx.stroke()
  }

  // 2. Draw Ground Contact Bumpers
  const bumperLeftX = pivotX - beamHalfL * Math.cos(props.params.maxAngleDeg * Math.PI / 180)
  const bumperRightX = pivotX + beamHalfL * Math.cos(props.params.maxAngleDeg * Math.PI / 180)
  drawBumper(bumperLeftX, groundY, isDark)
  drawBumper(bumperRightX, groundY, isDark)

  // 3. Draw Fulcrum (Triangular Pivot Base)
  const fulcrumH = 100 * zoom
  const fulcrumW = 60 * zoom
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(pivotX, pivotY)
  ctx.lineTo(pivotX - fulcrumW / 2, pivotY + fulcrumH)
  ctx.lineTo(pivotX + fulcrumW / 2, pivotY + fulcrumH)
  ctx.closePath()

  const fulcrumGrad = ctx.createLinearGradient(pivotX, pivotY, pivotX, pivotY + fulcrumH)
  fulcrumGrad.addColorStop(0, '#f59e0b')
  fulcrumGrad.addColorStop(1, isDark ? '#78350f' : '#b45309')
  ctx.fillStyle = fulcrumGrad
  ctx.fill()
  ctx.strokeStyle = isDark ? '#fbbf24' : '#92400e'
  ctx.lineWidth = 2
  ctx.stroke()

  // Axle pin circle
  ctx.beginPath()
  ctx.arc(pivotX, pivotY, 8 * zoom, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? '#0f172a' : '#ffffff'
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  // 4. Draw Rotating Beam
  ctx.save()
  ctx.translate(pivotX, pivotY)
  ctx.rotate(theta)

  // Beam physical offset relative to pivot if fulcrum is shifted:
  // beam center is at x = -pivotOffset * scale
  const beamCenterRel = -props.params.pivotOffset * scale
  const beamLeft = beamCenterRel - beamHalfL
  const beamRight = beamCenterRel + beamHalfL
  const beamThickness = 18 * zoom

  // Beam wood/metallic texture
  const beamGrad = ctx.createLinearGradient(0, -beamThickness / 2, 0, beamThickness / 2)
  if (isDark) {
    beamGrad.addColorStop(0, '#64748b')
    beamGrad.addColorStop(0.5, '#475569')
    beamGrad.addColorStop(1, '#334155')
  } else {
    beamGrad.addColorStop(0, '#e2e8f0')
    beamGrad.addColorStop(0.5, '#cbd5e1')
    beamGrad.addColorStop(1, '#94a3b8')
  }
  ctx.fillStyle = beamGrad
  ctx.fillRect(beamLeft, -beamThickness / 2, beamRight - beamLeft, beamThickness)

  ctx.strokeStyle = isDark ? '#94a3b8' : '#475569'
  ctx.lineWidth = 2
  ctx.strokeRect(beamLeft, -beamThickness / 2, beamRight - beamLeft, beamThickness)

  // Distance ruler markings on the beam (every 0.5m)
  ctx.fillStyle = isDark ? '#94a3b8' : '#475569'
  ctx.font = `${Math.max(9, Math.round(10 * zoom))}px Vazirmatn, sans-serif`
  ctx.textAlign = 'center'

  const maxMeters = props.params.beamLength / 2
  for (let m = -maxMeters; m <= maxMeters; m += 0.5) {
    // position along beam from center
    const markX = beamCenterRel + m * scale
    const isMajor = Math.abs(m % 1.0) < 1e-4
    ctx.beginPath()
    ctx.moveTo(markX, -beamThickness / 2)
    ctx.lineTo(markX, -beamThickness / 2 + (isMajor ? 8 : 4))
    ctx.stroke()

    // Mark distance relative to pivot
    const distFromPivot = ((markX) / scale).toFixed(1)
    if (isMajor && Math.abs(m) <= maxMeters - 0.2) {
      ctx.fillText(`${distFromPivot}m`, markX, -beamThickness / 2 - 4)
    }
  }

  // 5. Draw Placed Loads (Masses)
  for (const load of props.params.loads) {
    const loadX = load.x * scale
    const massSize = Math.max(24, Math.min(60, Math.sqrt(load.mass) * 16)) * zoom
    const isLeft = load.x < 0
    drawWeightBlock(loadX, -beamThickness / 2 - massSize, massSize, massSize, load.mass, isLeft, isDark)

    // Force vector arrow pointing down (Weight W = m * g)
    if (showVectors.value) {
      const arrowLen = Math.min(80, load.mass * 4.5) * zoom
      drawForceArrow(loadX, -beamThickness / 2, arrowLen, isLeft ? '#3b82f6' : '#ec4899', `W = ${(load.mass * props.params.g).toFixed(0)} N`)
    }
  }

  ctx.restore()
}

function drawWeightBlock(
  x: number,
  y: number,
  w: number,
  h: number,
  mass: number,
  isLeft: boolean,
  isDark: boolean
) {
  if (!ctx) return
  ctx.save()
  const r = 4
  const cx = x - w / 2

  // Rounded block
  ctx.beginPath()
  ctx.moveTo(cx + r, y)
  ctx.lineTo(cx + w - r, y)
  ctx.quadraticCurveTo(cx + w, y, cx + w, y + r)
  ctx.lineTo(cx + w, y + h - r)
  ctx.quadraticCurveTo(cx + w, y + h, cx + w - r, y + h)
  ctx.lineTo(cx + r, y + h)
  ctx.quadraticCurveTo(cx, y + h, cx, y + h - r)
  ctx.lineTo(cx, y + r)
  ctx.quadraticCurveTo(cx, y, cx + r, y)
  ctx.closePath()

  const grad = ctx.createLinearGradient(cx, y, cx, y + h)
  if (isLeft) {
    grad.addColorStop(0, '#60a5fa')
    grad.addColorStop(1, '#1d4ed8')
  } else {
    grad.addColorStop(0, '#f472b6')
    grad.addColorStop(1, '#be185d')
  }
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Hook handle on top
  ctx.beginPath()
  ctx.arc(x, y - 4, 4, 0, Math.PI, true)
  ctx.strokeStyle = isDark ? '#94a3b8' : '#475569'
  ctx.lineWidth = 2
  ctx.stroke()

  // Label mass text
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 11px Vazirmatn, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${mass.toFixed(1)} kg`, x, y + h / 2 + 4)
  ctx.restore()
}

function drawForceArrow(x: number, startY: number, length: number, color: string, label: string) {
  if (!ctx) return
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(x, startY)
  ctx.lineTo(x, startY + length)
  ctx.stroke()

  // Arrowhead
  const headLen = 7
  ctx.beginPath()
  ctx.moveTo(x, startY + length)
  ctx.lineTo(x - headLen * 0.7, startY + length - headLen)
  ctx.lineTo(x + headLen * 0.7, startY + length - headLen)
  ctx.closePath()
  ctx.fill()

  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(label, x, startY + length + 14)
  ctx.restore()
}

function drawBumper(x: number, groundY: number, isDark: boolean) {
  if (!ctx) return
  ctx.fillStyle = isDark ? '#475569' : '#94a3b8'
  ctx.fillRect(x - 8, groundY - 14, 16, 14)
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.arc(x, groundY - 14, 8, Math.PI, 0)
  ctx.fill()
}

// Mouse Drag to Pan
function onMouseDown(e: MouseEvent) {
  isDragging = true
  startDragX = e.clientX - panX
  startDragY = e.clientY - panY
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging) return
  panX = e.clientX - startDragX
  panY = e.clientY - startDragY
  render()
}

function onMouseUp() {
  isDragging = false
}

// Touch Drag
function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    isDragging = true
    startDragX = e.touches[0].clientX - panX
    startDragY = e.touches[0].clientY - panY
  }
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging || e.touches.length !== 1) return
  panX = e.touches[0].clientX - startDragX
  panY = e.touches[0].clientY - startDragY
  render()
}

function onTouchEnd() {
  isDragging = false
}

// Mouse Wheel to Zoom
function onWheel(e: WheelEvent) {
  e.preventDefault()
  const factor = e.deltaY < 0 ? 1.08 : 0.92
  zoom = Math.max(0.5, Math.min(2.5, zoom * factor))
  render()
}

watch(
  () => props.state,
  () => {
    render()
  },
  { deep: true }
)

watch(
  () => [store.theme, showVectors.value],
  () => {
    render()
  }
)

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvasRef.value.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    canvasRef.value.addEventListener('wheel', onWheel, { passive: false })

    resizeObserver = new ResizeObserver(() => handleResize())
    if (canvasRef.value.parentElement) {
      resizeObserver.observe(canvasRef.value.parentElement)
    }
  }
  handleResize()
})

onBeforeUnmount(() => {
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('mousedown', onMouseDown)
    canvasRef.value.removeEventListener('touchstart', onTouchStart)
    canvasRef.value.removeEventListener('wheel', onWheel)
  }
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<style scoped>
.canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--bg-scene);
  user-select: none;
}

.simulation-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}

.simulation-canvas:active {
  cursor: grabbing;
}

.canvas-hud {
  position: absolute;
  top: 1rem;
  inset-inline-start: 1rem;
  inset-inline-end: 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  pointer-events: none;
}

.hud-stat-pill {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: var(--surface-glass);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  box-shadow: var(--shadow-sm);
  pointer-events: auto;
}

.hud-label {
  color: var(--text-muted);
}

.hud-val {
  font-weight: 700;
  color: var(--text-color);
  direction: ltr;
  unicode-bidi: embed;
}

.left-val {
  color: #3b82f6;
}

.right-val {
  color: #ec4899;
}

.balanced-val {
  color: #10b981;
}

.badge-balanced {
  background: rgba(16, 185, 129, 0.2);
  border-color: #10b981;
  color: #059669;
}

.badge-tilted {
  background: rgba(245, 158, 11, 0.2);
  border-color: #f59e0b;
  color: #d97706;
}

.hud-controls {
  margin-inline-start: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  pointer-events: auto;
}

.hud-toggle {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: var(--surface-glass);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  cursor: pointer;
  user-select: none;
  color: var(--text-color);
}

.hud-toggle input {
  cursor: pointer;
}

.btn-hud-icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-glass);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .canvas-hud {
    top: 0.5rem;
    inset-inline-start: 0.5rem;
    inset-inline-end: 0.5rem;
    gap: 0.375rem;
  }
  .hud-stat-pill {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
}
</style>
