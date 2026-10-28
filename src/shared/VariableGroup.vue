<template>
  <div class="variable-group" :class="{ 'is-collapsed': isCollapsed }">
    <button type="button" class="group-header" @click="toggleCollapse">
      <div class="title-wrap">
        <span class="icon" v-if="icon">{{ icon }}</span>
        <span class="title">{{ title }}</span>
        <span v-if="badge" class="badge">{{ badge }}</span>
      </div>
      <span class="chevron" :class="{ 'is-rotated': isCollapsed }">▼</span>
    </button>
    <div v-show="!isCollapsed" class="group-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  title: string;
  icon?: string;
  badge?: string;
}>();

const isCollapsed = ref(false);

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}
</script>

<style scoped>
.variable-group {
  flex-shrink: 0;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  background: var(--surface-card);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.variable-group:hover {
  border-color: var(--border-focus);
}

.group-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--surface-hover);
  color: var(--text-primary);
  font-weight: 700;
  font-size: 0.92rem;
  text-align: start;
  cursor: pointer;
  border-bottom: 1px solid var(--border-subtle);
  transition: background var(--transition-fast);
}

.group-header:hover {
  background: var(--surface-active);
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.icon {
  font-size: 1.15rem;
}

.title {
  font-weight: 700;
}

.badge {
  font-size: 0.68rem;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.15);
  color: var(--color-physics);
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-full);
}

.chevron {
  font-size: 0.7rem;
  transition: transform var(--transition-normal);
  color: var(--text-muted);
}

.chevron.is-rotated {
  transform: rotate(-90deg);
}

.group-body {
  padding: 0.75rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
