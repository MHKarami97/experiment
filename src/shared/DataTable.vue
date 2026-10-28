<template>
  <div class="data-table-panel glass-panel">
    <div class="table-header">
      <div class="info">
        <span class="count">{{ $t('common.table') }}: {{ $t('common.dataPoints', { count: formatNum(totalPoints) }) }}</span>
      </div>
      <div class="actions">
        <button type="button" class="btn-export touch-target" @click="exportCSV">
          📥 {{ $t('common.exportCsv') }}
        </button>
      </div>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>t (s)</th>
            <th>x (m)</th>
            <th>y (m)</th>
            <th>vₓ (m/s)</th>
            <th>vᵧ (m/s)</th>
            <th>v (m/s)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in displayRows" :key="idx">
            <td>{{ formatNum(row.index) }}</td>
            <td class="ltr"><bdi>{{ formatVal(row.t, 3) }}</bdi></td>
            <td class="ltr"><bdi>{{ formatVal(row.x, 2) }}</bdi></td>
            <td class="ltr"><bdi>{{ formatVal(row.y, 2) }}</bdi></td>
            <td class="ltr"><bdi>{{ formatVal(row.vx, 2) }}</bdi></td>
            <td class="ltr"><bdi>{{ formatVal(row.vy, 2) }}</bdi></td>
            <td class="ltr"><bdi>{{ formatVal(row.v, 2) }}</bdi></td>
          </tr>
          <tr v-if="displayRows.length === 0">
            <td colspan="7" class="empty-state">{{ $t('common.noDataRecorded') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DataSeries } from './GraphPanel.vue';
import { formatScientificValue, toPersianDigits } from '../core/units';
import { useAppStore } from '../app/store';

const props = defineProps<{
  series: DataSeries;
  maxDisplayRows?: number;
}>();

const store = useAppStore();

const totalPoints = computed(() => props.series?.t?.length ?? 0);

const displayRows = computed(() => {
  const s = props.series;
  if (!s || !s.t || s.t.length === 0) return [];
  const max = props.maxDisplayRows ?? 100;
  const len = s.t.length;
  const step = Math.max(1, Math.floor(len / max));

  const rows = [];
  for (let i = 0; i < len; i += step) {
    rows.push({
      index: i + 1,
      t: s.t[i],
      x: s.x[i],
      y: s.y[i],
      vx: s.vx[i],
      vy: s.vy[i],
      v: s.v[i]
    });
  }
  return rows;
});

function formatVal(val: number, decimals: number): string {
  return formatScientificValue(val, {
    decimals,
    usePersianDigits: store.usePersianDigits
  });
}

function formatNum(num: number): string {
  if (store.usePersianDigits) {
    return toPersianDigits(num);
  }
  return String(num);
}

function exportCSV() {
  const s = props.series;
  if (!s || !s.t || s.t.length === 0) return;

  const header = 't (s),x (m),y (m),vx (m/s),vy (m/s),v (m/s)\r\n';
  let csvContent = '\uFEFF' + header; // UTF-8 BOM for Persian / Excel compatibility

  for (let i = 0; i < s.t.length; i++) {
    csvContent += `${s.t[i].toFixed(4)},${s.x[i].toFixed(4)},${s.y[i].toFixed(4)},${s.vx[i].toFixed(4)},${s.vy[i].toFixed(4)},${s.v[i].toFixed(4)}\r\n`;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `projectile-data-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.data-table-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 280px;
  border-radius: var(--radius-lg);
  padding: var(--space-2);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.count {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.btn-export {
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  background: var(--surface-hover);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  transition: background var(--transition-fast);
}

.btn-export:hover {
  background: var(--surface-active);
}

.table-container {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-card);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  font-family: var(--font-mono);
  text-align: center;
}

.data-table th {
  position: sticky;
  top: 0;
  background: var(--surface-hover);
  color: var(--text-secondary);
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-subtle);
  font-weight: 600;
  z-index: 1;
}

.data-table td {
  padding: 0.4rem;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.data-table tr:hover td {
  background: var(--surface-hover);
}

.empty-state {
  padding: 2rem;
  color: var(--text-muted);
  font-family: var(--font-sans);
}
</style>
