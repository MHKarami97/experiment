<template>
  <div class="canvas-wrapper">
    <canvas ref="canvasRef" class="simulation-canvas"></canvas>

    <!-- Top Floating HUD -->
    <div class="canvas-hud">
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('pendulums.hud.modeType') }}:</span>
        <span class="hud-val mode-val">
          {{ params.type === 'simple' ? $t('pendulums.hud.simple') : $t('pendulums.hud.double') }}
        </span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('pendulums.hud.theta1') }}:</span>
        <span class="hud-val">{{ ((state.theta1 * 180) / Math.PI).toFixed(1) }}°</span>
      </div>
      <div v-if="params.type === 'double'" class="hud-stat-pill">
        <span class="hud-label">{{ $t('pendulums.hud.theta2') }}:</span>
        <span class="hud-val">{{ ((state.theta2 * 180) / Math.PI).toFixed(1) }}°</span>
      </div>
      <div v-if="params.type === 'simple'" class="hud-stat-pill">
        <span class="hud-label">{{ $t('pendulums.hud.period') }}:</span>
        <span class="hud-val">{{ state.analyticalPeriod.toFixed(3) }} s</span>
      </div>
      <div class="hud-stat-pill">
        <span class="hud-label">{{ $t('pendulums.hud.energy') }}:</span>
        <span class="hud-val">{{ state.totalEnergy.toFixed(2) }} J</span>
      </div>
      <div class="hud-controls">
        <label class="hud-toggle">
          <input v-model="showTrail" type="checkbox" />
          <span>{{ $t('common.trail') }}</span>
        </label>
        <button type="button" class="btn-hud-icon" title="Clear Trail" @click="clearTrail">
          🧹
        </button>
        <button type="button" class="btn-hud-icon" title="Reset View" @click="resetView">
          🔍
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import type { PendulumState, PendulumParams } from '../model/pendulum'
import { useAppStore } from '@/app/store'

const props = defineProps<{
  state: PendulumState
  params: PendulumParams
  mode: 'ideal' | 'real'
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const showTrail = ref(true)
const store = useAppStore()

let ctx: CanvasRenderingContext2D | null = null
let width = 0
let height = 0

// Trail points for chaotic tip
let trail: Array<{ x: number; y: number; alpha: number }> = []

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

function clearTrail() {
  trail = []
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

  const totalArm = (props.params.l1 + (props.params.type === 'double' ? props.params.l2 : 0)) * 1.3
  const scale = (Math.min(width, height) / (totalArm * 2.2)) * zoom

  const pivotX = width / 2 + panX
  const pivotY = height * 0.38 + panY

  // 1. Draw Pivot Support Base / Stand
  ctx.save()
  ctx.fillStyle = isDark ? '#334155' : '#94a3b8'
  ctx.fillRect(pivotX - 30, pivotY - 14, 60, 10)
  ctx.beginPath()
  ctx.arc(pivotX, pivotY, 8, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? '#64748b' : '#cbd5e1'
  ctx.fill()
  ctx.strokeStyle = isDark ? '#94a3b8' : '#475569'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()

  // 2. Compute Screen Coordinates
  const x1 = pivotX + props.state.x1 * scale
  const y1 = pivotY + props.state.y1 * scale
  const x2 = pivotX + props.state.x2 * scale
  const y2 = pivotY + props.state.y2 * scale

  // Record Trail
  if (showTrail.value) {
    const tipX = props.params.type === 'double' ? x2 : x1
    const tipY = props.params.type === 'double' ? y2 : y1
    trail.push({ x: tipX, y: tipY, alpha: 1.0 })
    if (trail.length > 350) trail.shift()
  }

  // 3. Draw Trajectory Trail
  if (showTrail.value && trail.length > 1) {
    ctx.save()
    for (let i = 1; i < trail.length; i++) {
      const p0 = trail[i - 1]
      const p1 = trail[i]
      const progress = i / trail.length
      ctx.strokeStyle = props.params.type === 'double'
        ? `hsla(${(i * 3) % 360}, 85%, 60%, ${progress * 0.85})`
        : `rgba(59, 130, 246, ${progress * 0.7})`
      ctx.lineWidth = props.params.type === 'double' ? 2 : 1.5
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(p1.x, p1.y)
      ctx.stroke()
    }
    ctx.restore()
  }

  // 4. Draw Arm 1 (Rod / Tether)
  ctx.save()
  ctx.strokeStyle = isDark ? '#94a3b8' : '#475569'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(pivotX, pivotY)
  ctx.lineTo(x1, y1)
  ctx.stroke()

  // 5. Draw Bob 1
  const r1 = Math.max(12, Math.min(26, Math.sqrt(props.params.m1) * 12)) * zoom
  drawBob(x1, y1, r1, '#3b82f6', '#60a5fa', `${props.params.m1.toFixed(1)}kg`, isDark)

  // 6. Draw Arm 2 & Bob 2 (Double Pendulum only)
  if (props.params.type === 'double') {
    ctx.strokeStyle = isDark ? '#cbd5e1' : '#334155'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    const r2 = Math.max(12, Math.min(26, Math.sqrt(props.params.m2) * 12)) * zoom
    drawBob(x2, y2, r2, '#ec4899', '#f472b6', `${props.params.m2.toFixed(1)}kg`, isDark)
  }

  ctx.restore()
}

function drawBob(x: number, y: number, r: number, colorBase: string, colorHighlight: string, label: string, isDark: boolean) {
  if (!ctx) return
  ctx.save()
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r)
  grad.addColorStop(0, colorHighlight)
  grad.addColorStop(0.7, colorBase)
  grad.addColorStop(1, isDark ? '#0f172a' : '#1e293b')

  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Weight text
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 10px Vazirmatn, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(label, x, y + 4)
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
  () => [store.theme, props.params.type, showTrail.value],
  () => {
    trail = []
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

.mode-val {
  color: #8b5cf6;
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
