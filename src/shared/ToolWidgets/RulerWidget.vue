<template>
  <div
    v-if="visible"
    class="ruler-widget glass-card"
    :style="{
      transform: `translate(${pos.x}px, ${pos.y}px) rotate(${rotation}deg)`,
      width: `${lengthPx}px`
    }"
    @mousedown="startDrag"
    @touchstart.passive="startDragTouch"
  >
    <div class="ruler-bar">
      <div
        v-for="i in numTicks"
        :key="i"
        class="tick"
        :class="{ major: i % 5 === 0, super: i % 10 === 0 }"
      >
        <span v-if="i % 10 === 0" class="tick-label ltr">{{ (i / 10) * unitStep }}</span>
      </div>
    </div>

    <div class="ruler-controls" @mousedown.stop @touchstart.stop>
      <button type="button" class="ctrl-btn" @click="rotate(-15)" :title="$t('common.rotateCcw')">↺</button>
      <button type="button" class="ctrl-btn" @click="rotate(15)" :title="$t('common.rotateCw')">↻</button>
      <span class="unit-badge ltr">{{ unitLabel }}</span>
      <button type="button" class="ctrl-close" @click="$emit('close')">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

withDefaults(
  defineProps<{
    visible: boolean;
    lengthPx?: number;
    numTicks?: number;
    unitStep?: number;
    unitLabel?: string;
  }>(),
  {
    lengthPx: 320,
    numTicks: 30,
    unitStep: 1,
    unitLabel: 'm'
  }
);

defineEmits<{
  (e: 'close'): void;
}>();

const pos = ref({ x: 60, y: 120 });
const rotation = ref(0);
let isDragging = false;
let startX = 0;
let startY = 0;

function rotate(delta: number) {
  rotation.value = (rotation.value + delta) % 360;
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
</script>

<style scoped>
.ruler-widget {
  position: absolute;
  top: 0;
  left: 0;
  height: 52px;
  background: rgba(254, 240, 138, 0.88);
  color: #1e293b;
  border: 1px solid rgba(234, 179, 8, 0.6);
  border-radius: var(--radius-sm);
  cursor: grab;
  user-select: none;
  z-index: 50;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: var(--shadow-lg);
  transform-origin: 20px 20px;
}

.ruler-widget:active {
  cursor: grabbing;
}

.ruler-bar {
  display: flex;
  justify-content: space-between;
  height: 22px;
  border-bottom: 1px solid #713f12;
  padding: 0 4px;
}

.tick {
  width: 1px;
  height: 8px;
  background: #713f12;
  position: relative;
}

.tick.major {
  height: 14px;
}

.tick.super {
  height: 18px;
  background: #000;
  width: 1.5px;
}

.tick-label {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.65rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #713f12;
}

.ruler-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-1);
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.05);
}

.ctrl-btn {
  font-size: 0.85rem;
  padding: 0 4px;
  color: #1e293b;
}

.ctrl-close {
  font-size: 0.8rem;
  color: #dc2626;
  font-weight: 700;
}

.unit-badge {
  font-size: 0.7rem;
  font-weight: bold;
  margin-right: 4px;
}
</style>
