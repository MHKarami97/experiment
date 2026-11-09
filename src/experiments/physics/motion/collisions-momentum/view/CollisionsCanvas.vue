<template>
  <div class="canvas-wrapper">
    <canvas ref="canvasRef" class="simulation-canvas"></canvas>

    <!-- Top Floating HUD -->
    <div class="canvas-hud">
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('collisionsMomentum.hud.pTotal') }}:</span>
        <span class="hud-val">{{ state.derived.pTotal.toFixed(2) }} kg·m/s</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('collisionsMomentum.hud.keTotal') }}:</span>
        <span class="hud-val">{{ state.derived.keTotal.toFixed(2) }} J</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('collisionsMomentum.hud.v1') }}:</span>
        <span class="hud-val cart1-val">{{ state.cart1.v.toFixed(2) }} m/s</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('collisionsMomentum.hud.v2') }}:</span>
        <span class="hud-val cart2-val">{{ state.cart2.v.toFixed(2) }} m/s</span>
      </div>
      <div v-if="state.derived.hasCollided" class="hud-stat-pill hit-badge">
        <span class="hud-val">⚡ {{ $t('collisionsMomentum.hud.collided') }}</span>
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
import type { CollisionSimulationState, CollisionParams } from '../model/collisions'
import { useAppStore } from '@/app/store'

const props = defineProps<{
  state: CollisionSimulationState
  params: CollisionParams
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

// Convert world coordinate along air track (meters) to canvas X (pixels)
function worldToCanvas(x: number, y: number = 0) {
  const margin = 50
  const trackPixelWidth = width - margin * 2
  const scale = (trackPixelWidth / props.params.trackLength) * zoom
  const trackY = height * 0.55 + panY

  const px = margin + panX + x * scale
  const py = trackY - y * scale
  return { px, py, scale }
}

function render() {
  if (!ctx || width === 0 || height === 0) return

  const isDark = store.theme === 'dark'

  // Clear background
  ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc'
  ctx.fillRect(0, 0, width, height)

  const trackLen = props.params.trackLength
  const { px: trackLeft, py: trackY, scale } = worldToCanvas(0, 0)
  const trackRight = trackLeft + trackLen * scale

  // 1. Air Track Structure (Metallic extrusion & bench legs)
  // Bench legs
  ctx.fillStyle = isDark ? '#334155' : '#94a3b8'
  const legW = 16
  const legH = height - trackY - 15
  ctx.fillRect(trackLeft + 40, trackY + 20, legW, legH)
  ctx.fillRect(trackRight - 40 - legW, trackY + 20, legW, legH)

  // Track body gradient
  const trackGrad = ctx.createLinearGradient(0, trackY - 10, 0, trackY + 30)
  if (isDark) {
    trackGrad.addColorStop(0, '#64748b')
    trackGrad.addColorStop(0.3, '#334155')
    trackGrad.addColorStop(0.7, '#1e293b')
    trackGrad.addColorStop(1, '#0f172a')
  } else {
    trackGrad.addColorStop(0, '#cbd5e1')
    trackGrad.addColorStop(0.3, '#e2e8f0')
    trackGrad.addColorStop(0.7, '#cbd5e1')
    trackGrad.addColorStop(1, '#94a3b8')
  }
  ctx.fillStyle = trackGrad
  ctx.fillRect(trackLeft, trackY - 8, trackRight - trackLeft, 28)

  // Track borders & top guide rail
  ctx.strokeStyle = isDark ? '#475569' : '#94a3b8'
  ctx.lineWidth = 2
  ctx.strokeRect(trackLeft, trackY - 8, trackRight - trackLeft, 28)

  // Metallic top line
  ctx.beginPath()
  ctx.moveTo(trackLeft, trackY - 8)
  ctx.lineTo(trackRight, trackY - 8)
  ctx.strokeStyle = isDark ? '#94a3b8' : '#64748b'
  ctx.lineWidth = 3
  ctx.stroke()

  // Track End Bumpers (Springs/Rubber blocks)
  ctx.fillStyle = '#ef4444'
  ctx.fillRect(trackLeft - 10, trackY - 24, 10, 44)
  ctx.fillRect(trackRight, trackY - 24, 10, 44)

  // Air holes along the track (subtle dots)
  ctx.fillStyle = isDark ? '#0f172a' : '#64748b'
  const holeStep = 0.25 // meters
  for (let m = 0.25; m < trackLen; m += holeStep) {
    const hx = trackLeft + m * scale
    ctx.beginPath()
    ctx.arc(hx, trackY + 6, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Ruler ticks & distance labels along the track bottom
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b'
  ctx.font = '11px Vazirmatn, sans-serif'
  ctx.textAlign = 'center'
  for (let m = 0; m <= trackLen; m += 1.0) {
    const tx = trackLeft + m * scale
    ctx.beginPath()
    ctx.moveTo(tx, trackY + 20)
    ctx.lineTo(tx, trackY + 28)
    ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillText(`${m} m`, tx, trackY + 42)
  }

  // Flash aura when collision just occurred
  if (props.state.collisionFlash > 0) {
    const flashAlpha = Math.min(1, props.state.collisionFlash * 4)
    const midX = (props.state.cart1.x + props.state.cart2.x) * 0.5
    const { px: flashPx } = worldToCanvas(midX, 0)
    const flashGrad = ctx.createRadialGradient(flashPx, trackY - 25, 5, flashPx, trackY - 25, 70)
    flashGrad.addColorStop(0, `rgba(245, 158, 11, ${flashAlpha * 0.9})`)
    flashGrad.addColorStop(0.5, `rgba(239, 68, 68, ${flashAlpha * 0.4})`)
    flashGrad.addColorStop(1, 'rgba(239, 68, 68, 0)')
    ctx.fillStyle = flashGrad
    ctx.beginPath()
    ctx.arc(flashPx, trackY - 25, 70, 0, Math.PI * 2)
    ctx.fill()
  }

  // 2. Draw Cart 1 & Cart 2
  drawCart(props.state.cart1, 1, '#3b82f6', '#60a5fa', trackY, scale)
  drawCart(props.state.cart2, 2, '#ec4899', '#f472b6', trackY, scale)

  // 3. Draw Velocity and Momentum Vectors
  if (showVectors.value) {
    drawVector(props.state.cart1.x, trackY - 50, props.state.cart1.v * 25, '#10b981', 'v₁')
    drawVector(props.state.cart2.x, trackY - 50, props.state.cart2.v * 25, '#8b5cf6', 'v₂')
  }
}

function drawCart(
  cart: { x: number; v: number; mass: number },
  cartNum: number,
  baseColor: string,
  accentColor: string,
  trackY: number,
  scale: number
) {
  if (!ctx) return
  const isDark = store.theme === 'dark'

  const cartPixelWidth = Math.max(38, props.params.cartWidth * scale)
  const cartPixelHeight = 36
  const { px: cartCenterX } = worldToCanvas(cart.x, 0)
  const leftX = cartCenterX - cartPixelWidth / 2
  const topY = trackY - 8 - cartPixelHeight

  // Air glider body (aerodynamic beveled glider)
  ctx.save()
  ctx.beginPath()
  const r = 5
  ctx.moveTo(leftX + r, topY)
  ctx.lineTo(leftX + cartPixelWidth - r, topY)
  ctx.quadraticCurveTo(leftX + cartPixelWidth, topY, leftX + cartPixelWidth, topY + r)
  ctx.lineTo(leftX + cartPixelWidth, topY + cartPixelHeight - 4)
  ctx.lineTo(leftX, topY + cartPixelHeight - 4)
  ctx.lineTo(leftX, topY + r)
  ctx.quadraticCurveTo(leftX, topY, leftX + r, topY)
  ctx.closePath()

  // Gradient fill
  const grad = ctx.createLinearGradient(leftX, topY, leftX, topY + cartPixelHeight)
  grad.addColorStop(0, accentColor)
  grad.addColorStop(0.7, baseColor)
  grad.addColorStop(1, isDark ? '#1e293b' : '#334155')
  ctx.fillStyle = grad
  ctx.fill()

  ctx.strokeStyle = isDark ? '#ffffff' : '#1e293b'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Front and Back contact bumper buffers
  ctx.fillStyle = '#f59e0b'
  // Left bumper
  ctx.fillRect(leftX - 4, topY + 12, 4, 12)
  // Right bumper
  ctx.fillRect(leftX + cartPixelWidth, topY + 12, 4, 12)

  // Inner glider weight slots / stripes
  ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)'
  const slots = Math.min(5, Math.max(1, Math.round(cart.mass)))
  const slotW = 4
  const slotSpacing = cartPixelWidth / (slots + 1)
  for (let i = 1; i <= slots; i++) {
    ctx.fillRect(leftX + i * slotSpacing - slotW / 2, topY + 6, slotW, cartPixelHeight - 16)
  }

  // Label text on cart
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 12px Vazirmatn, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`M${cartNum}: ${cart.mass.toFixed(1)} kg`, cartCenterX, topY + cartPixelHeight / 2 + 4)

  ctx.restore()
}

function drawVector(
  cartX: number,
  arrowY: number,
  pixelLength: number,
  color: string,
  label: string
) {
  if (!ctx || Math.abs(pixelLength) < 2) return

  const { px: startX } = worldToCanvas(cartX, 0)
  const endX = startX + pixelLength

  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(startX, arrowY)
  ctx.lineTo(endX, arrowY)
  ctx.stroke()

  // Arrowhead
  const headLen = 8
  const sign = Math.sign(pixelLength)
  ctx.beginPath()
  ctx.moveTo(endX, arrowY)
  ctx.lineTo(endX - sign * headLen, arrowY - 4)
  ctx.lineTo(endX - sign * headLen, arrowY + 4)
  ctx.closePath()
  ctx.fill()

  // Label
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(label, endX + sign * 10, arrowY - 6)
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

.cart1-val {
  color: #3b82f6;
}

.cart2-val {
  color: #ec4899;
}

.hit-badge {
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
