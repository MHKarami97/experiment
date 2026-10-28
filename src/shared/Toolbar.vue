<template>
  <div class="lab-toolbar glass-panel">
    <!-- Playback Group -->
    <div class="toolbar-group">
      <button
        type="button"
        class="tool-btn primary touch-target"
        :class="{ running: isRunning }"
        @click="$emit('togglePlay')"
        :title="isRunning ? $t('common.pause') : $t('common.play')"
      >
        <span class="icon">{{ isRunning ? '⏸' : '▶' }}</span>
        <span class="label">{{ isRunning ? $t('common.pause') : $t('common.play') }}</span>
      </button>

      <button
        type="button"
        class="tool-btn touch-target"
        :disabled="isRunning"
        @click="$emit('step')"
        :title="$t('common.step')"
      >
        <span class="icon">⏭</span>
        <span class="label hide-mobile">{{ $t('common.step') }}</span>
      </button>

      <button
        type="button"
        class="tool-btn touch-target"
        @click="$emit('reset')"
        :title="$t('common.reset')"
      >
        <span class="icon">↺</span>
        <span class="label hide-mobile">{{ $t('common.reset') }}</span>
      </button>
    </div>

    <!-- Speed Control -->
    <div class="toolbar-group speed-group">
      <span class="speed-label hide-mobile">{{ $t('common.speed') }}:</span>
      <div class="speed-chips">
        <button
          v-for="s in [0.25, 0.5, 1, 2]"
          :key="s"
          type="button"
          class="speed-chip touch-target"
          :class="{ active: speed === s }"
          @click="$emit('setSpeed', s)"
        >
          {{ s }}x
        </button>
      </div>
    </div>

    <!-- Mode Toggle: Ideal vs Real -->
    <div class="toolbar-group mode-group">
      <button
        type="button"
        class="mode-btn ideal touch-target"
        :class="{ active: mode === 'ideal' }"
        @click="$emit('setMode', 'ideal')"
      >
        ✨ {{ $t('common.ideal') }}
      </button>
      <button
        type="button"
        class="mode-btn real touch-target"
        :class="{ active: mode === 'real' }"
        @click="$emit('setMode', 'real')"
      >
        🌪️ {{ $t('common.real') }}
      </button>
    </div>

    <!-- Instruments & Utility Group -->
    <div class="toolbar-group util-group">
      <button
        type="button"
        class="tool-btn touch-target"
        :class="{ active: showRuler }"
        @click="$emit('toggleRuler')"
        :title="$t('common.ruler')"
      >
        📏
      </button>

      <button
        type="button"
        class="tool-btn touch-target"
        :class="{ active: showStopwatch }"
        @click="$emit('toggleStopwatch')"
        :title="$t('common.stopwatch')"
      >
        ⏱️
      </button>

      <button
        type="button"
        class="tool-btn touch-target"
        @click="$emit('openExport')"
        :title="$t('common.export')"
      >
        📊 {{ $t('common.export') }}
      </button>

      <button
        type="button"
        class="tool-btn touch-target"
        @click="toggleFullscreen"
        :title="$t('common.fullscreen')"
      >
        ⛶
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isRunning: boolean;
  speed: number;
  mode: 'ideal' | 'real';
  showRuler: boolean;
  showStopwatch: boolean;
}>();

defineEmits<{
  (e: 'togglePlay'): void;
  (e: 'step'): void;
  (e: 'reset'): void;
  (e: 'setSpeed', speed: number): void;
  (e: 'setMode', mode: 'ideal' | 'real'): void;
  (e: 'toggleRuler'): void;
  (e: 'toggleStopwatch'): void;
  (e: 'openExport'): void;
}>();

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}
</script>

<style scoped>
.lab-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0.35rem 0.65rem;
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  background: var(--surface-hover);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.tool-btn:hover:not(:disabled) {
  background: var(--surface-active);
  border-color: var(--border-focus);
}

.tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tool-btn.primary {
  background: var(--color-physics);
  color: var(--text-inverse);
  border-color: var(--color-physics);
}

.tool-btn.primary.running {
  background: var(--color-danger);
  border-color: var(--color-danger);
}

.tool-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: var(--color-physics);
  color: var(--color-physics);
}

.speed-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-inline-end: var(--space-1);
}

.speed-chips {
  display: flex;
  background: var(--surface-hover);
  padding: 2px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.speed-chip {
  padding: 0.2rem 0.45rem;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}

.speed-chip.active {
  background: var(--surface-card-solid);
  color: var(--color-physics);
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

.mode-group {
  background: var(--surface-hover);
  padding: 2px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.mode-btn {
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.mode-btn.ideal.active {
  background: rgba(59, 130, 246, 0.2);
  color: var(--color-physics);
  font-weight: 600;
}

.mode-btn.real.active {
  background: rgba(245, 158, 11, 0.2);
  color: var(--color-warning);
  font-weight: 600;
}

@media (max-width: 640px) {
  .hide-mobile {
    display: none;
  }
}
</style>
