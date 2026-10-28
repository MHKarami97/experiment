<template>
  <div class="slot-manager glass-card">
    <div class="sm-header">
      <span class="sm-title">💾 {{ $t('common.saveSlot') }} / {{ $t('common.loadSlot') }}</span>
    </div>

    <div class="slots-grid">
      <div v-for="index in [1, 2, 3]" :key="index" class="slot-item">
        <div class="slot-info">
          <span class="slot-name">{{ $t('common.slotNumber', { num: formatIndex(index) }) }}</span>
          <span class="slot-date" v-if="slots[index]">
            {{ formatDate(slots[index].savedAt) }}
          </span>
          <span class="slot-empty" v-else>{{ $t('common.empty') }}</span>
        </div>

        <div class="slot-actions">
          <button
            type="button"
            class="btn-slot save touch-target"
            @click="saveToSlot(index)"
            :title="$t('common.saveSlot')"
          >
            {{ $t('common.save') }}
          </button>
          <button
            type="button"
            class="btn-slot load touch-target"
            :disabled="!slots[index]"
            @click="loadFromSlot(index)"
            :title="$t('common.loadSlot')"
          >
            {{ $t('common.load') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { db, type StoredSlot } from '../db';
import { useAppStore } from '../app/store';
import { toPersianDigits } from '../core/units';

const props = defineProps<{
  experimentId: string;
  currentParams: Record<string, number>;
  currentMode: 'ideal' | 'real';
}>();

const emit = defineEmits<{
  (e: 'load', slot: StoredSlot): void;
}>();

const { t } = useI18n();
const store = useAppStore();
const slots = ref<Record<number, StoredSlot>>({});

async function loadSlotsFromDb() {
  const records = await db.slots
    .where('experimentId')
    .equals(props.experimentId)
    .toArray();

  const map: Record<number, StoredSlot> = {};
  for (const r of records) {
    map[r.slotIndex] = r;
  }
  slots.value = map;
}

async function saveToSlot(slotIndex: number) {
  const newSlot: StoredSlot = {
    experimentId: props.experimentId,
    slotIndex,
    name: `وضعیت شماره ${slotIndex}`,
    savedAt: Date.now(),
    params: { ...props.currentParams },
    mode: props.currentMode
  };

  // Find existing
  const existing = await db.slots
    .where('[experimentId+slotIndex]')
    .equals([props.experimentId, slotIndex])
    .first();

  if (existing?.id) {
    newSlot.id = existing.id;
  }

  await db.slots.put(newSlot);
  slots.value[slotIndex] = newSlot;
  store.showToast(t('common.slotSaved', { num: formatIndex(slotIndex) }), 'success');
}

function loadFromSlot(slotIndex: number) {
  const slot = slots.value[slotIndex];
  if (slot) {
    emit('load', slot);
    store.showToast(t('common.slotLoaded', { num: formatIndex(slotIndex) }), 'info');
  }
}

function formatIndex(idx: number): string {
  return store.usePersianDigits ? toPersianDigits(idx) : String(idx);
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(store.locale === 'fa' ? 'fa-IR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

onMounted(() => {
  loadSlotsFromDb();
});
</script>

<style scoped>
.slot-manager {
  flex-shrink: 0;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sm-header {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: var(--space-2);
}

.slot-item {
  background: var(--surface-hover);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.slot-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slot-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
}

.slot-date {
  font-size: 0.7rem;
  color: var(--color-physics);
  font-family: var(--font-mono);
}

.slot-empty {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.slot-actions {
  display: flex;
  gap: var(--space-1);
}

.btn-slot {
  flex: 1;
  padding: 0.25rem 0.4rem;
  font-size: 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  background: var(--surface-card-solid);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.btn-slot.save:hover {
  border-color: var(--color-success);
  color: var(--color-success);
}

.btn-slot.load:hover:not(:disabled) {
  border-color: var(--color-physics);
  color: var(--color-physics);
}

.btn-slot:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
