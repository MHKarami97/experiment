<template>
  <div class="canvas-wrapper">
    <canvas ref="canvasRef" class="simulation-canvas"></canvas>

    <!-- Top Floating HUD -->
    <div class="canvas-hud">
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('springShm.hud.displacement') }}:</span>
        <span class="hud-val x-val">{{ (state.x * 100).toFixed(1) }} cm</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('springShm.hud.velocity') }}:</span>
        <span class="hud-val v-val">{{ state.v.toFixed(2) }} m/s</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('springShm.hud.freq0') }}:</span>
        <span class="hud-val">{{ state.f0.toFixed(2) }} Hz</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('springShm.hud.energy') }}:</span>
        <span class="hud-val">{{ state.totalEnergy.toFixed(2) }} J</span>
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
import type { SpringState, SpringParams } from '../model/spring'
import { useAppStore } from '@/app/store'

const props = defineProps<{
  state: SpringState
  params: SpringParams
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

  const scale = (height * 0.42) * zoom // 1 meter in pixels
  const anchorX = width / 2 + panX
  const anchorY = 70 + panY
  const restLength = 1.2 * scale
  const equilibriumY = anchorY + restLength
  const massY = equilibriumY + props.state.x * scale

  // 1. Draw Ceiling / Support Mount
  ctx.save()
  ctx.fillStyle = isDark ? '#334155' : '#94a3b8'
  ctx.fillRect(anchorX - 70, anchorY - 14, 140, 14)
  // Cross-hatching on ceiling
  ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1'
  ctx.lineWidth = 1.5
  for (let cx = anchorX - 65; cx < anchorX + 65; cx += 10) {
    ctx.beginPath()
    ctx.moveTo(cx, anchorY - 14)
    ctx.lineTo(cx + 8, anchorY)
    ctx.stroke()
  }

  // Anchor ring
  ctx.beginPath()
  ctx.arc(anchorX, anchorY, 6, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? '#64748b' : '#64748b'
  ctx.fill()
  ctx.restore()

  // 2. Draw Equilibrium Reference Dashed Line
  ctx.save()
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.35)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(anchorX - 160, equilibriumY)
  ctx.lineTo(anchorX + 160, equilibriumY)
  ctx.stroke()

  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b'
  ctx.font = '11px Vazirmatn, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('x = 0 (تعادل / Equilibrium)', anchorX - 50, equilibriumY - 6)
  ctx.restore()

  // 3. Draw Realistic Helical Spring
  const coils = 16
  const springWidth = 26 * zoom
  const currentSpringLength = massY - anchorY
  drawHelicalSpring(anchorX, anchorY, currentSpringLength, coils, springWidth, isDark)

  // 4. Draw Oscillating Mass Block
  const blockW = Math.max(40, Math.min(85, Math.sqrt(props.params.mass) * 36)) * zoom
  const blockH = Math.max(36, Math.min(75, Math.sqrt(props.params.mass) * 32)) * zoom
  const blockLeft = anchorX - blockW / 2
  const blockTop = massY

  drawMassBlock(blockLeft, blockTop, blockW, blockH, props.params.mass, isDark)

  // 5. Draw Force and Velocity Vectors
  if (showVectors.value) {
    // Restoring Spring Force (F_s)
    if (Math.abs(props.state.fSpring) > 0.5) {
      const fLen = -Math.sign(props.state.fSpring) * Math.min(80, Math.abs(props.state.fSpring) * 1.5)
      drawVector(anchorX - blockW / 2 - 20, massY + blockH / 2, fLen, '#f59e0b', `F_s = ${props.state.fSpring.toFixed(0)}N`)
    }
    // Velocity Vector (v)
    if (Math.abs(props.state.v) > 0.05) {
      const vLen = Math.sign(props.state.v) * Math.min(70, Math.abs(props.state.v) * 30)
      drawVector(anchorX + blockW / 2 + 20, massY + blockH / 2, vLen, '#10b981', `v = ${props.state.v.toFixed(2)}m/s`)
    }
  }
}

function drawHelicalSpring(
  x: number,
  y0: number,
  len: number,
  coils: number,
  w: number,
  isDark: boolean
) {
  if (!ctx) return
  ctx.save()
  ctx.strokeStyle = isDark ? '#cbd5e1' : '#334155'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(x, y0)

  // Top lead-in
  const topLead = 15
  ctx.lineTo(x, y0 + topLead)

  // Zigzag coils
  const activeLen = len - topLead - 15
  const dy = activeLen / (coils * 2)

  for (let i = 0; i < coils * 2; i++) {
    const cy = y0 + topLead + (i + 0.5) * dy
    const cx = x + (i % 2 === 0 ? w / 2 : -w / 2)
    ctx.lineTo(cx, cy)
  }

  // Bottom lead-out
  ctx.lineTo(x, y0 + len)
  ctx.stroke()
  ctx.restore()
}

function drawMassBlock(
  x: number,
  y: number,
  w: number,
  h: number,
  mass: number,
  isDark: boolean
) {
  if (!ctx) return
  ctx.save()
  const r = 6

  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()

  const grad = ctx.createLinearGradient(x, y, x + w, y + h)
  grad.addColorStop(0, '#3b82f6')
  grad.addColorStop(1, '#1d4ed8')
  ctx.fillStyle = grad
  ctx.fill()

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.stroke()

  // Top attachment hook
  ctx.beginPath()
  ctx.arc(x + w / 2, y, 5, 0, Math.PI, true)
  ctx.strokeStyle = isDark ? '#cbd5e1' : '#334155'
  ctx.lineWidth = 2
  ctx.stroke()

  // Mass label
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 12px Vazirmatn, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${mass.toFixed(1)} kg`, x + w / 2, y + h / 2 + 4)
  ctx.restore()
}

function drawVector(
  x: number,
  startY: number,
  length: number,
  color: string,
  label: string
) {
  if (!ctx || Math.abs(length) < 2) return
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2.5

  const endY = startY + length
  ctx.beginPath()
  ctx.moveTo(x, startY)
  ctx.lineTo(x, endY)
  ctx.stroke()

  // Arrowhead
  const headLen = 7
  const sign = Math.sign(length)
  ctx.beginPath()
  ctx.moveTo(x, endY)
  ctx.lineTo(x - 5, endY - sign * headLen)
  ctx.lineTo(x + 5, endY - sign * headLen)
  ctx.closePath()
  ctx.fill()

  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(label, x + (sign > 0 ? 30 : -30), endY)
  ctx.restore()
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
  zoom = Math.max(0.4, Math.min(3.0, zoom * factor))
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

.x-val {
  color: #3b82f6;
}

.v-val {
  color: #10b981;
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
