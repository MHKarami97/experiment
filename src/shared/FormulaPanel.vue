<template>
  <div class="formula-panel glass-panel">
    <div class="formula-header">
      <span class="title">📐 {{ title }}</span>
    </div>

    <div class="formula-body">
      <div
        v-for="(f, idx) in formulas"
        :key="idx"
        class="formula-card glass-card"
      >
        <div class="formula-title">{{ f.title }}</div>
        <div class="math-render ltr" v-html="renderMath(f.latex)"></div>
        <div class="explanation" v-if="f.explanation">{{ f.explanation }}</div>
        <div class="live-calc ltr" v-if="f.liveValue">
          <span class="calc-label">{{ $t('common.calculatedValue') }} </span>
          <bdi class="calc-val">{{ f.liveValue }}</bdi>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import katex from 'katex';
import 'katex/dist/katex.min.css';

export interface FormulaItem {
  title: string;
  latex: string;
  explanation?: string;
  liveValue?: string;
}

defineProps<{
  title: string;
  formulas: FormulaItem[];
}>();

function renderMath(latex: string): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: true
    });
  } catch (e) {
    return latex;
  }
}
</script>

<style scoped>
.formula-panel {
  display: flex;
  flex-direction: column;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  gap: var(--space-3);
  max-height: 100%;
  overflow-y: auto;
}

.formula-header {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-primary);
}

.formula-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.formula-card {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.formula-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-physics);
}

.math-render {
  padding: var(--space-1) 0;
  color: var(--text-primary);
  overflow-x: auto;
}

.explanation {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.live-calc {
  font-size: 0.85rem;
  font-family: var(--font-mono);
  background: var(--surface-hover);
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: fit-content;
}

.calc-label {
  color: var(--text-muted);
  font-family: var(--font-sans);
}

.calc-val {
  font-weight: 700;
  color: var(--color-physics);
}
</style>
