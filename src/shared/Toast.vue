<template>
  <div class="toast-container" aria-live="polite">
    <transition-group name="toast-slide">
      <div
        v-for="toast in store.toasts"
        :key="toast.id"
        class="toast-item glass-card"
        :class="toast.type"
        @click="store.removeToast(toast.id)"
      >
        <span class="icon">{{ getIcon(toast.type) }}</span>
        <span class="text">{{ toast.text }}</span>
        <button type="button" class="close-btn" @click.stop="store.removeToast(toast.id)">✕</button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../app/store';

const store = useAppStore();

function getIcon(type: string): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'warning':
      return '⚠️';
    case 'danger':
      return '✕';
    default:
      return 'ℹ️';
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
  inset-inline-start: var(--space-4);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
  max-width: 90vw;
  width: 360px;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  font-size: 0.85rem;
  color: var(--text-primary);
  background: var(--surface-card-solid);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
}

.toast-item.success {
  border-inline-start: 4px solid var(--color-success);
}
.toast-item.warning {
  border-inline-start: 4px solid var(--color-warning);
}
.toast-item.danger {
  border-inline-start: 4px solid var(--color-danger);
}
.toast-item.info {
  border-inline-start: 4px solid var(--color-info);
}

.icon {
  font-size: 1rem;
}

.text {
  flex: 1;
}

.close-btn {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all var(--transition-normal);
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
