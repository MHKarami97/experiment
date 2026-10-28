<template>
  <div class="unit-slider" :class="{ 'has-real-effect': !!realModeEffect && isRealMode }">
    <!-- Top row: Label and numeric controls -->
    <div class="slider-header">
      <div class="label-col">
        <label :for="`slider-${id}`" class="slider-label" :title="description || label">
          {{ label }}
        </label>
        <span v-if="realModeEffect && isRealMode" class="badge-real" :title="realModeEffect">
          {{ realModeEffect }}
        </span>
      </div>

      <!-- Stepper and numeric input -->
      <div class="input-stepper-wrap">
        <button
          type="button"
          class="step-btn minus"
          @click="stepValue(-1)"
          title="کاهش"
          tabindex="-1"
        >
          −
        </button>

        <input
          :id="`num-${id}`"
          type="text"
          inputmode="decimal"
          class="num-input ltr"
          :value="localInputValue"
          @focus="onFocus"
          @input="onTextInput"
          @blur="onBlur"
          @keydown.enter="onKeyDownEnter"
        />

        <button
          type="button"
          class="step-btn plus"
          @click="stepValue(1)"
          title="افزایش"
          tabindex="-1"
        >
          +
        </button>

        <span class="unit-badge ltr"><bdi>{{ unit }}</bdi></span>
      </div>
    </div>

    <!-- Middle row: Range Slider Track -->
    <div class="slider-track-wrap">
      <input
        :id="`slider-${id}`"
        type="range"
        class="range-input"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="computedStep"
        @input="onRangeChange"
      />
    </div>

    <!-- Bottom row: Min / Max Limits & Description -->
    <div class="slider-footer">
      <span class="limit ltr"><bdi>{{ formatVal(min) }}</bdi></span>
      <span class="description" v-if="description">{{ description }}</span>
      <span class="limit ltr"><bdi>{{ formatVal(max) }}</bdi></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { formatScientificValue, clamp } from '../core/units';
import { useAppStore } from '../app/store';

const props = withDefaults(
  defineProps<{
    id: string;
    modelValue: number;
    label: string;
    unit: string;
    min: number;
    max: number;
    step?: number;
    description?: string;
    realModeEffect?: string | null;
    isRealMode?: boolean;
  }>(),
  {
    step: 1,
    isRealMode: false
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const store = useAppStore();
const localInputValue = ref(String(props.modelValue));
const isFocused = ref(false);

const computedStep = computed(() => props.step ?? 1);

// Normalizes Persian/Arabic digits and comma decimals into standard format
function normalizeNumberString(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/٫/g, '.')
    .replace(/,/g, '.');
}

// Keep local input in sync when external modelValue changes (only when user is not actively typing)
watch(
  () => props.modelValue,
  (newVal) => {
    if (!isFocused.value) {
      localInputValue.value = String(newVal);
    }
  }
);

function onRangeChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const val = parseFloat(target.value);
  if (!Number.isNaN(val)) {
    emit('update:modelValue', val);
    localInputValue.value = String(val);
  }
}

function onFocus(event: FocusEvent) {
  isFocused.value = true;
  const target = event.target as HTMLInputElement;
  target.select();
}

function onTextInput(event: Event) {
  const target = event.target as HTMLInputElement;
  localInputValue.value = target.value;

  const normalized = normalizeNumberString(target.value.trim());
  const parsed = parseFloat(normalized);
  // If it's a completely valid in-bounds number, emit live update
  if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
    if (parsed >= props.min && parsed <= props.max) {
      emit('update:modelValue', parsed);
    }
  }
}

function onBlur() {
  isFocused.value = false;
  const normalized = normalizeNumberString(localInputValue.value.trim());
  const parsed = parseFloat(normalized);

  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    // Reset to previous valid value
    localInputValue.value = String(props.modelValue);
    return;
  }

  const clamped = clamp(parsed, props.min, props.max);
  const precision = getPrecision(computedStep.value);
  const rounded = Number(clamped.toFixed(precision));

  emit('update:modelValue', rounded);
  localInputValue.value = String(rounded);
}

function onKeyDownEnter(event: KeyboardEvent) {
  (event.target as HTMLInputElement).blur();
}

function stepValue(direction: number) {
  const step = computedStep.value;
  const current = props.modelValue;
  const next = clamp(current + direction * step, props.min, props.max);
  const precision = getPrecision(step);
  const rounded = Number(next.toFixed(precision));

  emit('update:modelValue', rounded);
  localInputValue.value = String(rounded);
}

function getPrecision(s: number): number {
  if (Math.floor(s) === s) return 0;
  const str = s.toString();
  return str.split('.')[1]?.length ?? 2;
}

function formatVal(val: number): string {
  return formatScientificValue(val, {
    usePersianDigits: store.usePersianDigits
  });
}
</script>

<style scoped>
.unit-slider {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0.75rem 0.85rem;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.unit-slider:hover {
  border-color: var(--border-focus);
}

.unit-slider.has-real-effect {
  border-inline-start: 4px solid var(--color-warning);
}

.slider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.label-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.slider-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-real {
  font-size: 0.68rem;
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-warning);
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-sm);
  width: fit-content;
}

.input-stepper-wrap {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: var(--surface-hover);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 2px 4px;
  flex-shrink: 0;
}

.step-btn {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--surface-card-solid);
  color: var(--text-primary);
  font-weight: 700;
  font-size: 0.95rem;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
}

.step-btn:hover {
  background: var(--color-physics);
  color: var(--text-inverse);
  border-color: var(--color-physics);
}

.num-input {
  width: 4.4rem;
  padding: 0.2rem 0.3rem;
  font-size: 0.9rem;
  font-family: var(--font-mono);
  font-weight: 600;
  background: var(--surface-input);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  text-align: center;
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.num-input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
  background: var(--surface-card-solid);
}

.unit-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  padding: 0 3px;
  min-width: 24px;
  text-align: center;
}

.slider-track-wrap {
  width: 100%;
  padding: 2px 0;
}

.range-input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: var(--surface-hover);
  border-radius: var(--radius-full);
  outline: none;
  cursor: pointer;
  border: 1px solid var(--border-subtle);
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-physics);
  border: 2px solid #ffffff;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: transform var(--transition-fast), background var(--transition-fast);
}

.range-input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-physics);
  border: 2px solid #ffffff;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: transform var(--transition-fast);
}

.range-input::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.range-input::-moz-range-thumb:hover {
  transform: scale(1.15);
}

.slider-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.description {
  max-width: 65%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
