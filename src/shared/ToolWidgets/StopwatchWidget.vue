<template>
  <div
    v-if="visible"
    class="stopwatch-widget glass-card"
    :style="{ transform: `translate(${pos.x}px, ${pos.y}px)` }"
    @mousedown="startDrag"
    @touchstart.passive="startDragTouch"
  >
    <div class="sw-header">
      <span class="sw-title">⏱️ {{ $t('common.stopwatch') }}</span>
      <button type="button" class="ctrl-close" @click="$emit('close')">✕</button>
    </div>

    <div class="sw-display ltr">
      <span class="digits">{{ formattedTime }}</span>
    </div>

    <div class="sw-actions" @mousedown.stop @touchstart.stop>
      <button
        type="button"
        class="sw-btn"
        :class="{ running: isRunning }"
        @click="toggle"
      >
        {{ isRunning ? $t('common.stop') : $t('common.start') }}
      </button>
      <button type="button" class="sw-btn" @click="reset">{{ $t('common.resetZero') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';

defineProps<{
  visible: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const pos = ref({ x: 220, y: 120 });
const isRunning = ref(false);
const elapsedTimeMs = ref(0);
let timerId: number | null = null;
let lastTick = 0;

let isDragging = false;
let startX = 0;
let startY = 0;

const formattedTime = computed(() => {
  const totalMs = elapsedTimeMs.value;
  const s = Math.floor(totalMs / 1000);
  const ms = Math.floor((totalMs % 1000) / 10);
  const m = Math.floor(s / 60);
  const remS = s % 60;
  return `${String(m).padStart(2, '0')}:${String(remS).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
});

function toggle() {
  if (isRunning.value) {
    isRunning.value = false;
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  } else {
    isRunning.value = true;
    lastTick = performance.now();
    timerId = window.setInterval(() => {
      const now = performance.now();
      elapsedTimeMs.value += now - lastTick;
      lastTick = now;
    }, 20);
  }
}

function reset() {
  isRunning.value = false;
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  elapsedTimeMs.value = 0;
}

function startDrag(e: MouseEvent) {
  isDragging = true;
  startX = e.clientX - pos.value.x;
  startY = e.clientY - pos.value.y;

  const onMouseMove = (ev: MouseEvent) => {
    if (!isDragging) return;
    pos.value = {
      x: ev.clientX - startX,
      y: ev.clientY - startY
    };
  };

  const onMouseUp = () => {
    isDragging = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function startDragTouch(e: TouchEvent) {
  const touch = e.touches[0];
  if (!touch) return;
  isDragging = true;
  startX = touch.clientX - pos.value.x;
  startY = touch.clientY - pos.value.y;

  const onTouchMove = (ev: TouchEvent) => {
    if (!isDragging) return;
    const t = ev.touches[0];
    if (t) {
      pos.value = {
        x: t.clientX - startX,
        y: t.clientY - startY
      };
    }
  };

  const onTouchEnd = () => {
    isDragging = false;
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
  };

  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchend', onTouchEnd);
}

onBeforeUnmount(() => {
  if (timerId !== null) clearInterval(timerId);
});
</script>

<style scoped>
.stopwatch-widget {
  position: absolute;
  top: 0;
  left: 0;
  width: 170px;
  background: var(--surface-card-solid);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-2);
  cursor: grab;
  user-select: none;
  z-index: 50;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.stopwatch-widget:active {
  cursor: grabbing;
}

.sw-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sw-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
}

.ctrl-close {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.sw-display {
  background: #0f172a;
  color: #38bdf8;
  padding: 0.4rem;
  border-radius: var(--radius-sm);
  text-align: center;
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.sw-actions {
  display: flex;
  gap: var(--space-1);
}

.sw-btn {
  flex: 1;
  padding: 0.3rem 0;
  font-size: 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--surface-hover);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
}

.sw-btn.running {
  background: rgba(239, 68, 68, 0.2);
  color: var(--color-danger);
  border-color: var(--color-danger);
}
</style>
