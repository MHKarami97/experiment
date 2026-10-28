<template>
  <div class="guided-steps glass-panel">
    <div class="guided-header">
      <span class="title">🧭 {{ $t('common.guided') }}</span>
      <span class="progress-badge">
        {{ $t('common.stepNum', { current: formatNum(currentStepIndex + 1), total: formatNum(steps.length) }) }}
      </span>
    </div>

    <div class="step-card glass-card" v-if="currentStep">
      <div class="step-title">{{ currentStep.title }}</div>
      <div class="step-instructions">{{ currentStep.instruction }}</div>

      <div class="step-hint" v-if="currentStep.hint">
        💡 <strong>{{ $t('common.hint') }}</strong> {{ currentStep.hint }}
      </div>

      <div class="step-nav">
        <button
          type="button"
          class="btn-nav touch-target"
          :disabled="currentStepIndex === 0"
          @click="prevStep"
        >
          {{ $t('common.prevStep') }}
        </button>
        <button
          type="button"
          class="btn-nav primary touch-target"
          @click="nextStep"
        >
          {{ currentStepIndex === steps.length - 1 ? $t('common.finishGuide') : $t('common.nextStep') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '../app/store';
import { toPersianDigits } from '../core/units';

export interface LabStep {
  id: string;
  title: string;
  instruction: string;
  hint?: string;
}

const props = defineProps<{
  steps: LabStep[];
}>();

const store = useAppStore();
const currentStepIndex = ref(0);

const currentStep = computed(() => props.steps[currentStepIndex.value]);

function nextStep() {
  if (currentStepIndex.value < props.steps.length - 1) {
    currentStepIndex.value++;
  } else {
    store.showToast('آزمایش هدایت‌شده با موفقیت به پایان رسید!', 'success');
  }
}

function prevStep() {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--;
  }
}

function formatNum(n: number): string {
  return store.usePersianDigits ? toPersianDigits(n) : String(n);
}
</script>

<style scoped>
.guided-steps {
  display: flex;
  flex-direction: column;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  gap: var(--space-3);
}

.guided-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.progress-badge {
  font-size: 0.75rem;
  background: var(--surface-hover);
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-full);
  color: var(--color-physics);
}

.step-card {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.step-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-physics);
}

.step-instructions {
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.5;
}

.step-hint {
  font-size: 0.8rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
}

.step-nav {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.btn-nav {
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
  border-radius: var(--radius-md);
  background: var(--surface-hover);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.btn-nav.primary {
  background: var(--color-physics);
  color: var(--text-inverse);
  border-color: var(--color-physics);
}

.btn-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
