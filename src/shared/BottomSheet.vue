<template>
  <div
    class="bottom-sheet glass-panel"
    :class="{ 'is-expanded': isExpanded, 'is-open': isOpen }"
  >
    <div
      class="sheet-handle-bar touch-target"
      @click="toggleExpand"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <div class="handle-pill"></div>
      <div class="sheet-title">
        <span>{{ title }}</span>
        <span class="chevron">{{ isExpanded ? '▼' : '▲' }}</span>
      </div>
    </div>

    <div class="sheet-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  title: string;
  isOpen?: boolean;
}>();

const isExpanded = ref(false);
let startY = 0;
let currentY = 0;

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

function onTouchStart(e: TouchEvent) {
  const t = e.touches[0];
  if (t) startY = t.clientY;
}

function onTouchMove(e: TouchEvent) {
  const t = e.touches[0];
  if (t) currentY = t.clientY;
}

function onTouchEnd() {
  const diff = currentY - startY;
  if (diff < -40) {
    // Swiped up
    isExpanded.value = true;
  } else if (diff > 40) {
    // Swiped down
    isExpanded.value = false;
  }
}
</script>

<style scoped>
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--surface-card-solid);
  border-top: 1px solid var(--border-glass);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.25);
  transition: transform var(--transition-normal), max-height var(--transition-normal);
  max-height: 4.5rem; /* Peeking mode */
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.bottom-sheet.is-expanded {
  max-height: 80vh;
}

.sheet-handle-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  cursor: pointer;
  user-select: none;
  background: var(--surface-hover);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.handle-pill {
  width: 36px;
  height: 4px;
  background: var(--border-subtle);
  border-radius: var(--radius-full);
  margin-bottom: 0.35rem;
}

.sheet-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.chevron {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.sheet-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (min-width: 1024px) {
  .bottom-sheet {
    display: none;
  }
}
</style>
