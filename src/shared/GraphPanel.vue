<template>
  <div class="graph-panel glass-panel">
    <div class="graph-header">
      <div class="chart-selector">
        <button
          v-for="opt in chartOptions"
          :key="opt.id"
          type="button"
          class="chart-tab touch-target"
          :class="{ active: selectedChart === opt.id }"
          @click="selectedChart = opt.id"
        >
          {{ opt.label }}
        </button>
      </div>

      <div class="graph-actions">
        <button
          type="button"
          class="btn-icon touch-target"
          @click="resetZoom"
          :title="$t('common.reset')"
        >
          🔍 100%
        </button>
      </div>
    </div>

    <div ref="chartContainer" class="chart-container ltr"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

export interface DataSeries {
  t: number[];
  x: number[];
  y: number[];
  vx: number[];
  vy: number[];
  v: number[];
}

export interface ComparisonRun {
  name: string;
  series: DataSeries;
  color: string;
}

const props = defineProps<{
  currentSeries: DataSeries;
  comparisonRuns?: ComparisonRun[];
}>();

const { t } = useI18n();

const chartOptions = computed(() => [
  { id: 'yx', label: t('common.chartYx') },
  { id: 'yt', label: t('common.chartYt') },
  { id: 'xt', label: t('common.chartXt') },
  { id: 'vt', label: t('common.chartVt') }
]);

const selectedChart = ref('yx');
const chartContainer = ref<HTMLDivElement | null>(null);
let uplotInstance: uPlot | null = null;
let resizeObserver: ResizeObserver | null = null;

function buildUPlotData(): uPlot.AlignedData {
  const current = props.currentSeries;
  if (!current || current.t.length === 0) {
    return [[0], [0]];
  }

  let xData: number[] = [];
  let yData: number[] = [];

  switch (selectedChart.value) {
    case 'yx':
      xData = current.x;
      yData = current.y;
      break;
    case 'yt':
      xData = current.t;
      yData = current.y;
      break;
    case 'xt':
      xData = current.t;
      yData = current.x;
      break;
    case 'vt':
      xData = current.t;
      yData = current.v;
      break;
  }

  // Comparison series
  const data: uPlot.AlignedData = [xData, yData];
  if (props.comparisonRuns && props.comparisonRuns.length > 0) {
    for (const comp of props.comparisonRuns) {
      if (selectedChart.value === 'yx') {
        data.push(comp.series.y);
      } else if (selectedChart.value === 'yt') {
        data.push(comp.series.y);
      } else if (selectedChart.value === 'xt') {
        data.push(comp.series.x);
      } else if (selectedChart.value === 'vt') {
        data.push(comp.series.v);
      }
    }
  }

  return data;
}

function initChart() {
  if (!chartContainer.value) return;

  if (uplotInstance) {
    uplotInstance.destroy();
    uplotInstance = null;
  }

  const rect = chartContainer.value.getBoundingClientRect();
  const width = Math.max(300, rect.width || 600);
  const height = Math.max(220, rect.height || 260);

  const seriesOpts: uPlot.Series[] = [
    {},
    {
      label: 'اجرای جاری',
      stroke: '#3b82f6',
      width: 2.5
    }
  ];

  if (props.comparisonRuns) {
    props.comparisonRuns.forEach((comp) => {
      seriesOpts.push({
        label: comp.name,
        stroke: comp.color,
        width: 1.8,
        dash: [5, 5]
      });
    });
  }

  let xLabel = 'x (m)';
  let yLabel = 'y (m)';
  if (selectedChart.value === 'yt') {
    xLabel = 't (s)';
    yLabel = 'y (m)';
  } else if (selectedChart.value === 'xt') {
    xLabel = 't (s)';
    yLabel = 'x (m)';
  } else if (selectedChart.value === 'vt') {
    xLabel = 't (s)';
    yLabel = 'v (m/s)';
  }

  const opts: uPlot.Options = {
    width,
    height,
    scales: {
      x: { time: false },
      y: { auto: true }
    },
    axes: [
      {
        stroke: '#94a3b8',
        grid: { stroke: 'rgba(148, 163, 184, 0.15)', width: 1 },
        label: xLabel,
        size: 35
      },
      {
        stroke: '#94a3b8',
        grid: { stroke: 'rgba(148, 163, 184, 0.15)', width: 1 },
        label: yLabel,
        size: 45
      }
    ],
    series: seriesOpts
  };

  const data = buildUPlotData();
  uplotInstance = new uPlot(opts, data, chartContainer.value);
}

function updateChart() {
  if (!uplotInstance) {
    initChart();
    return;
  }
  const data = buildUPlotData();
  uplotInstance.setData(data);
}

function resetZoom() {
  if (uplotInstance) {
    uplotInstance.setData(buildUPlotData(), true);
  }
}

watch(selectedChart, () => {
  initChart();
});

watch(
  () => props.currentSeries.t.length,
  () => {
    updateChart();
  }
);

watch(
  () => props.comparisonRuns,
  () => {
    initChart();
  },
  { deep: true }
);

onMounted(() => {
  initChart();
  if (chartContainer.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (uplotInstance && entry.contentRect.width > 0) {
          uplotInstance.setSize({
            width: Math.floor(entry.contentRect.width),
            height: 240
          });
        }
      }
    });
    resizeObserver.observe(chartContainer.value);
  }
});

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (uplotInstance) uplotInstance.destroy();
});
</script>

<style scoped>
.graph-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 280px;
  border-radius: var(--radius-lg);
  padding: var(--space-2);
  gap: var(--space-2);
}

.graph-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chart-selector {
  display: flex;
  gap: var(--space-1);
  background: var(--surface-hover);
  padding: 2px;
  border-radius: var(--radius-md);
}

.chart-tab {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.chart-tab.active {
  background: var(--surface-card-solid);
  color: var(--color-physics);
  box-shadow: var(--shadow-sm);
}

.btn-icon {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  color: var(--text-secondary);
}

.chart-container {
  width: 100%;
  height: 250px;
  min-height: 250px;
  position: relative;
  overflow: hidden;
}

:deep(.uplot) {
  font-family: var(--font-mono);
}
</style>
