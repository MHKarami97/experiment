<template>
  <div class="preset-picker">
    <div class="preset-label">{{ $t('common.presets') }}:</div>
    <div class="preset-chips">
      <button
        v-for="preset in presets"
        :key="preset.id"
        type="button"
        class="preset-chip touch-target"
        :class="{ active: currentPresetId === preset.id }"
        @click="selectPreset(preset)"
      >
        {{ preset.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PresetOption } from './types';

defineProps<{
  presets: PresetOption[];
  currentPresetId?: string;
}>();

const emit = defineEmits<{
  (e: 'select', preset: PresetOption): void;
}>();

function selectPreset(preset: PresetOption) {
  emit('select', preset);
}
</script>

<style scoped>
.preset-picker {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding: var(--space-2) 0;
}

.preset-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.preset-chips {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.preset-chip {
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
  border-radius: var(--radius-full);
  background: var(--surface-hover);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.preset-chip:hover {
  background: var(--surface-active);
  border-color: var(--border-focus);
}

.preset-chip.active {
  background: var(--color-physics);
  color: var(--text-inverse);
  border-color: var(--color-physics);
}
</style>
