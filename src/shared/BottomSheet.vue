<template>
  <div>
    <div v-if="isExpanded" class="sheet-backdrop" @click="isExpanded = false"></div>
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
          <span class="title-text">🎛️ {{ title }}</span>
          <span class="sheet-hint">{{ isExpanded ? '▼ بستن' : '▲ لمس برای تنظیم متغیرها' }}</span>
        </div>
      </div>

      <div class="sheet-content">
        <slot />
      </div>
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
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  z-index: 998;
}

.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background: var(--surface-card-solid);
  border-top: 2px solid var(--primary);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.35);
  transition: max-height 250ms cubic-bezier(0.2, 0.8, 0.2, 1);
  max-height: 3.8rem; /* Peeking mode */
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.bottom-sheet.is-expanded {
  max-height: 82vh;
}

.sheet-handle-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1rem;
  cursor: pointer;
  user-select: none;
  background: var(--surface-hover);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  border-bottom: 1px solid var(--border-subtle);
}

.handle-pill {
  width: 44px;
  height: 5px;
  background: var(--primary);
  opacity: 0.6;
  border-radius: var(--radius-full);
  margin-bottom: 0.35rem;
}

.sheet-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}

.title-text {
  color: var(--primary);
}

.sheet-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.sheet-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--surface-base);
}

@media (min-width: 1024px) {
  .sheet-backdrop,
  .bottom-sheet {
    display: none !important;
  }
}
</style>
