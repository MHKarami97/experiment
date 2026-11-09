<template>
  <div class="circular-motion-experiment">
    <!-- Top Interactive Toolbar -->
    <Toolbar
      :is-running="isRunning"
      :speed="speed"
      :mode="mode"
      :show-ruler="showRuler"
      :show-stopwatch="showStopwatch"
      @toggle-play="togglePlay"
      @step="stepSimulation"
      @reset="resetSimulation"
      @set-speed="setSpeed"
      @set-mode="setMode"
      @toggle-ruler="showRuler = !showRuler"
      @toggle-stopwatch="showStopwatch = !showStopwatch"
      @open-export="showExportModal = true"
    />

    <!-- Main Visual Stage & Controls -->
    <div class="experiment-workspace">
      <!-- Left/Main Stage: Canvas Simulation & Overlay Tools -->
      <div class="scene-container">
        <div class="canvas-mount">
          <CircularMotionCanvas
            ref="canvasViewRef"
            :state="currentState"
            :params="params"
            :mode="mode"
          />

          <!-- Floating Measurement Tools -->
          <RulerWidget v-if="showRuler" :visible="showRuler" @close="showRuler = false" />
          <StopwatchWidget v-if="showStopwatch" :visible="showStopwatch" @close="showStopwatch = false" />
        </div>
      </div>

      <!-- Desktop Sidebar Control Panel -->
      <aside class="control-sidebar desktop-only">
        <div class="sidebar-header">
          <h3>{{ $t('common.controls') }}</h3>
        </div>

        <div class="sidebar-scroll">
          <!-- Preset Picker -->
          <PresetPicker
            :presets="presetOptions"
            :current-preset="currentPresetId"
            @select="applyPreset"
          />

          <!-- Variable Group 1: Motion Parameters -->
          <VariableGroup :title="$t('circularMotion.controls.groupMotion')">
            <UnitSlider
              id="radius"
              v-model="params.radius"
              :label="$t('circularMotion.radius')"
              unit="m"
              :min="0.5"
              :max="5.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="mass"
              v-model="params.mass"
              :label="$t('circularMotion.mass')"
              unit="kg"
              :min="0.1"
              :max="20.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="angularVelocity"
              v-model="params.angularVelocity"
              :label="$t('circularMotion.angularVelocity')"
              unit="rad/s"
              :min="0.5"
              :max="15.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Variable Group 2: Tether & Real Effects -->
          <VariableGroup :title="$t('circularMotion.controls.groupString')">
            <UnitSlider
              id="maxTension"
              v-model="params.maxTension"
              :label="$t('circularMotion.maxTension')"
              unit="N"
              :min="20"
              :max="800"
              :step="10"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="mode === 'real'"
              id="stringStiffness"
              v-model="params.stringStiffness"
              :label="$t('circularMotion.stringStiffness')"
              unit="N/m"
              :min="200"
              :max="5000"
              :step="100"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="mode === 'real'"
              id="dragCoeff"
              v-model="params.dragCoeff"
              :label="$t('circularMotion.dragCoeff')"
              unit="—"
              :min="0"
              :max="1.2"
              :step="0.05"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slots Persistence -->
          <SlotManager
            experiment-id="physics/motion/circular-motion"
            :current-params="params"
            :current-mode="mode"
            @load="onLoadSlot"
          />
        </div>
      </aside>
    </div>

    <!-- Mobile BottomSheet Controls -->
    <BottomSheet class="mobile-only" :title="$t('common.controls')">
      <PresetPicker
        :presets="presetOptions"
        :current-preset="currentPresetId"
        @select="applyPreset"
      />

      <VariableGroup :title="$t('circularMotion.controls.groupMotion')">
        <UnitSlider
          id="radius-mobile"
          v-model="params.radius"
          :label="$t('circularMotion.radius')"
          unit="m"
          :min="0.5"
          :max="5.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="mass-mobile"
          v-model="params.mass"
          :label="$t('circularMotion.mass')"
          unit="kg"
          :min="0.1"
          :max="20.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="angularVelocity-mobile"
          v-model="params.angularVelocity"
          :label="$t('circularMotion.angularVelocity')"
          unit="rad/s"
          :min="0.5"
          :max="15.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('circularMotion.controls.groupString')">
        <UnitSlider
          id="maxTension-mobile"
          v-model="params.maxTension"
          :label="$t('circularMotion.maxTension')"
          unit="N"
          :min="20"
          :max="800"
          :step="10"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          v-if="mode === 'real'"
          id="stringStiffness-mobile"
          v-model="params.stringStiffness"
          :label="$t('circularMotion.stringStiffness')"
          unit="N/m"
          :min="200"
          :max="5000"
          :step="100"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          v-if="mode === 'real'"
          id="dragCoeff-mobile"
          v-model="params.dragCoeff"
          :label="$t('circularMotion.dragCoeff')"
          unit="—"
          :min="0"
          :max="1.2"
          :step="0.05"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/motion/circular-motion"
        :current-params="params"
        :current-mode="mode"
        @load="onLoadSlot"
      />
    </BottomSheet>

    <!-- Bottom Tabs (Graph, Table, Theory, Notes, Guided) -->
    <div class="bottom-tabs-section glass-panel">
      <div class="tabs-nav">
        <button
          v-for="tab in bottomTabs"
          :key="tab.id"
          type="button"
          class="tab-btn touch-target"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="tab-content-area">
        <!-- Tab 1: Live Graph -->
        <div v-show="activeTab === 'graph'" class="tab-panel">
          <GraphPanel
            :current-series="series"
            :comparison-runs="comparisonRuns"
          />
        </div>

        <!-- Tab 2: Data Table -->
        <div v-show="activeTab === 'table'" class="tab-panel">
          <DataTable :series="series" />
        </div>

        <!-- Tab 3: Theory & Live Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel">
          <FormulaPanel
            :title="$t('common.theory')"
            :formulas="formulaItems"
          />
        </div>

        <!-- Tab 4: Lab Notes -->
        <div v-show="activeTab === 'notes'" class="tab-panel notes-tab">
          <div class="notes-header">
            <h4>{{ $t('common.notes') }}</h4>
            <button type="button" class="btn-save-note touch-target" @click="saveNotes">
              💾 {{ $t('common.save') }}
            </button>
          </div>
          <textarea
            v-model="userNotes"
            class="notes-textarea"
            :placeholder="$t('common.notes')"
          ></textarea>
        </div>

        <!-- Tab 5: Guided Steps -->
        <div v-show="activeTab === 'guided'" class="tab-panel">
          <GuidedSteps :steps="guidedSteps" />
        </div>
      </div>
    </div>

    <!-- Export Lab Report Modal -->
    <Modal
      :is-open="showExportModal"
      :title="$t('common.export')"
      size="lg"
      @close="showExportModal = false"
    >
      <ExportReport
        :title="$t('experiments.circularMotion.title')"
        :mode="mode"
        :params="params"
        :results="calculatedResults"
        :results-rows="reportResultsRows"
        :variables-list="reportVariablesList"
        :notes="userNotes"
        :scene-canvas="canvasViewRef?.getCanvas()"
      />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  CircularMotionSimulation,
  computeIdealCircularAnalytical,
  type CircularMotionParams,
  type CircularMotionState
} from '../model/circularMotion';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { circularMotionConfig } from '../config';

// Shared Components
import Toolbar from '@/shared/Toolbar.vue';
import UnitSlider from '@/shared/UnitSlider.vue';
import VariableGroup from '@/shared/VariableGroup.vue';
import GraphPanel from '@/shared/GraphPanel.vue';
import DataTable from '@/shared/DataTable.vue';
import FormulaPanel from '@/shared/FormulaPanel.vue';
import PresetPicker from '@/shared/PresetPicker.vue';
import SlotManager from '@/shared/SlotManager.vue';
import GuidedSteps from '@/shared/GuidedSteps.vue';
import BottomSheet from '@/shared/BottomSheet.vue';
import Modal from '@/shared/Modal.vue';
import ExportReport from '@/shared/ExportReport.vue';
import RulerWidget from '@/shared/ToolWidgets/RulerWidget.vue';
import StopwatchWidget from '@/shared/ToolWidgets/StopwatchWidget.vue';
import CircularMotionCanvas from '../view/CircularMotionCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();
const canvasViewRef = ref<InstanceType<typeof CircularMotionCanvas> | null>(null);

const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('standard-orbit');
const userNotes = ref<string>('');

const params = reactive<CircularMotionParams>({
  radius: 2.0,
  mass: 1.5,
  angularVelocity: 4.0,
  maxTension: 180.0,
  dragCoeff: 0.47,
  stringStiffness: 1500.0,
  frictionMu: 0.05,
  airDensity: 1.225
});

let sim = new CircularMotionSimulation(params, mode.value);
const currentState = ref<CircularMotionState>(sim.getState());

const series = reactive<DataSeries>({
  t: [0],
  x: [params.radius],
  y: [0],
  vx: [0],
  vy: [params.radius * params.angularVelocity],
  v: [params.radius * params.angularVelocity]
});

const comparisonRuns = ref<ComparisonRun[]>([]);
let accumulator: PhysicsAccumulator | null = null;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.01,
    onPhysicsStep: (dt: number) => {
      if (currentState.value.isStopped) {
        pauseSimulation();
        onRunCompleted();
        return;
      }

      const nextState = sim.step(dt);
      currentState.value = nextState;

      // Series for chart: x: pos x, y: pos y, vx: tension Fc, vy: centripetal acc ac, v: speed
      series.t.push(nextState.t);
      series.x.push(nextState.x);
      series.y.push(nextState.y);
      series.vx.push(nextState.tension);
      series.vy.push(nextState.centripetalAcc);
      series.v.push(nextState.speed);
    },
    onRenderStep: () => {}
  });
}

function togglePlay() {
  if (currentState.value.isStopped || currentState.value.isSnapped) {
    resetSimulation();
  }
  if (accumulator) {
    isRunning.value = accumulator.toggle();
  }
}

function pauseSimulation() {
  if (accumulator) {
    accumulator.pause();
    isRunning.value = false;
  }
}

function stepSimulation() {
  if (currentState.value.isStopped) return;
  accumulator?.stepOnce();
}

function resetSimulation() {
  pauseSimulation();
  sim.setParams(params);
  sim.setMode(mode.value);
  currentState.value = sim.reset();

  series.t = [0];
  series.x = [currentState.value.x];
  series.y = [currentState.value.y];
  series.vx = [currentState.value.tension];
  series.vy = [currentState.value.centripetalAcc];
  series.v = [currentState.value.speed];
}

function setSpeed(s: number) {
  speed.value = s;
  accumulator?.setSpeed(s);
}

function setMode(m: 'ideal' | 'real') {
  mode.value = m;
  sim.setMode(m);
  resetSimulation();
}

function onParamChange() {
  currentPresetId.value = 'custom';
  resetSimulation();
}

const presetOptions = computed<PresetOption[]>(() => {
  return circularMotionConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params
  }));
});

function applyPreset(preset: PresetOption) {
  currentPresetId.value = preset.id;
  Object.assign(params, preset.params);
  if (preset.id === 'rope-snap') {
    mode.value = 'real';
  } else {
    mode.value = 'ideal';
  }
  resetSimulation();
}

function onLoadSlot(slot: StoredSlot) {
  Object.assign(params, slot.params);
  mode.value = slot.mode;
  resetSimulation();
}

async function onRunCompleted() {
  const analytical = computeIdealCircularAnalytical(
    params.radius,
    params.mass,
    params.angularVelocity
  );
  const simSpeed = currentState.value.speed;
  const simAcc = currentState.value.centripetalAcc;
  const simTension = currentState.value.tension;

  const errorSpeed = Math.abs(simSpeed - analytical.speed) / Math.max(1e-4, analytical.speed);
  const errorAcc = Math.abs(simAcc - analytical.centripetalAcc) / Math.max(1e-4, analytical.centripetalAcc);

  try {
    await db.runs.add({
      experimentId: 'physics/motion/circular-motion',
      createdAt: Date.now(),
      mode: mode.value,
      params: { ...params },
      summary: {
        speed: simSpeed,
        centripetalAcc: simAcc,
        tension: simTension,
        period: currentState.value.period,
        revolutions: currentState.value.revolutions,
        errorVsIdealPercent: errorSpeed * 100,
        accErrorPercent: errorAcc * 100
      },
      series: {
        t: [...series.t],
        x: [...series.x],
        y: [...series.y],
        vx: [...series.vx],
        vy: [...series.vy],
        v: [...series.v]
      }
    });

    if (comparisonRuns.value.length >= 3) {
      comparisonRuns.value.shift();
    }
    const runLabel = mode.value === 'ideal'
      ? t('circularMotion.runComparisonIdeal', { r: params.radius, w: params.angularVelocity })
      : t('circularMotion.runComparisonReal', { r: params.radius, w: params.angularVelocity });

    comparisonRuns.value.push({
      name: runLabel,
      color: mode.value === 'ideal' ? '#10b981' : '#f59e0b',
      series: {
        t: [...series.t],
        x: [...series.x],
        y: [...series.y],
        vx: [...series.vx],
        vy: [...series.vy],
        v: [...series.v]
      }
    });
  } catch (e) {
    console.warn('Error saving run to Dexie:', e);
  }
}

const calculatedResults = computed(() => {
  const analytical = computeIdealCircularAnalytical(
    params.radius,
    params.mass,
    params.angularVelocity
  );
  const simSpeed = currentState.value.speed;
  const simAcc = currentState.value.centripetalAcc;
  const simTension = currentState.value.tension;
  const simPeriod = currentState.value.period;

  return {
    simulatedSpeed: simSpeed,
    theoreticalSpeed: analytical.speed,
    speedError: Math.abs(simSpeed - analytical.speed) / Math.max(1e-4, analytical.speed) * 100,
    simulatedAcc: simAcc,
    theoreticalAcc: analytical.centripetalAcc,
    accError: Math.abs(simAcc - analytical.centripetalAcc) / Math.max(1e-4, analytical.centripetalAcc) * 100,
    simulatedTension: simTension,
    theoreticalTension: analytical.centripetalForce,
    tensionError: Math.abs(simTension - analytical.centripetalForce) / Math.max(1e-4, analytical.centripetalForce) * 100,
    simulatedPeriod: simPeriod,
    theoreticalPeriod: analytical.period,
    periodError: Math.abs(simPeriod - analytical.period) / Math.max(1e-4, analytical.period) * 100
  };
});

const reportResultsRows = computed(() => {
  const res = calculatedResults.value;
  return [
    {
      name: 'تندی خطی مماسی (Linear Speed)',
      simulated: `${res.simulatedSpeed.toFixed(2)} m/s`,
      theoretical: `${res.theoreticalSpeed.toFixed(2)} m/s`,
      error: `${res.speedError.toFixed(2)} %`
    },
    {
      name: 'شتاب مرکزگرا (Centripetal Acceleration)',
      simulated: `${res.simulatedAcc.toFixed(2)} m/s²`,
      theoretical: `${res.theoreticalAcc.toFixed(2)} m/s²`,
      error: `${res.accError.toFixed(2)} %`
    },
    {
      name: 'نیروی مرکزگرا / کشش (Centripetal Force)',
      simulated: `${res.simulatedTension.toFixed(1)} N`,
      theoretical: `${res.theoreticalTension.toFixed(1)} N`,
      error: `${res.tensionError.toFixed(2)} %`
    },
    {
      name: 'دوره تناوب چرخش (Period of Revolution)',
      simulated: `${res.simulatedPeriod.toFixed(3)} s`,
      theoretical: `${res.theoreticalPeriod.toFixed(3)} s`,
      error: `${res.periodError.toFixed(2)} %`
    }
  ];
});

const reportVariablesList = computed(() => [
  { name: 'شعاع مسیر دوران', symbol: 'r', value: params.radius, unit: 'm' },
  { name: 'جرم جسم دوار', symbol: 'm', value: params.mass, unit: 'kg' },
  { name: 'تندی زاویه‌ای', symbol: 'ω', value: params.angularVelocity, unit: 'rad/s' },
  { name: 'حداکثر کشش مجاز ریسمان', symbol: 'T_max', value: params.maxTension, unit: 'N' },
  { name: 'سختی فنریت ریسمان', symbol: 'k', value: params.stringStiffness, unit: 'N/m' },
  { name: 'ضریب پسار آیرودینامیک', symbol: 'C_d', value: params.dragCoeff, unit: '—' }
]);

const formulaItems = computed<FormulaItem[]>(() => {
  const res = calculatedResults.value;
  return [
    {
      title: t('circularMotion.formulas.speedTitle'),
      latex: 'v = \\omega \\cdot r',
      explanation: t('circularMotion.formulas.speedExpl'),
      liveValue: `v = ${res.simulatedSpeed.toFixed(2)} m/s`
    },
    {
      title: t('circularMotion.formulas.centripetalAccTitle'),
      latex: 'a_c = \\frac{v^2}{r} = \\omega^2 \\cdot r',
      explanation: t('circularMotion.formulas.centripetalAccExpl'),
      liveValue: `a_c = ${res.simulatedAcc.toFixed(2)} m/s²`
    },
    {
      title: t('circularMotion.formulas.centripetalForceTitle'),
      latex: 'F_c = m \\cdot a_c = m \\cdot \\omega^2 \\cdot r',
      explanation: t('circularMotion.formulas.centripetalForceExpl'),
      liveValue: `F_c = ${res.simulatedTension.toFixed(1)} N`
    },
    {
      title: t('circularMotion.formulas.periodFreqTitle'),
      latex: 'T = \\frac{2\\pi}{\\omega}, \\quad f = \\frac{\\omega}{2\\pi}',
      explanation: t('circularMotion.formulas.periodFreqExpl'),
      liveValue: `T = ${res.simulatedPeriod.toFixed(2)} s, f = ${(1 / Math.max(1e-4, res.simulatedPeriod)).toFixed(2)} Hz`
    }
  ];
});

const bottomTabs = computed(() => [
  { id: 'graph', label: `📈 ${t('circularMotion.tabs.graph')}` },
  { id: 'table', label: `📊 ${t('circularMotion.tabs.table')}` },
  { id: 'theory', label: `📐 ${t('circularMotion.tabs.theory')}` },
  { id: 'notes', label: `📝 ${t('circularMotion.tabs.notes')}` },
  { id: 'guided', label: `🧭 ${t('circularMotion.tabs.guided')}` }
]);

const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step1',
    title: t('circularMotion.steps.step1Title'),
    instruction: t('circularMotion.steps.step1Instr'),
    hint: t('circularMotion.steps.step1Hint')
  },
  {
    id: 'step2',
    title: t('circularMotion.steps.step2Title'),
    instruction: t('circularMotion.steps.step2Instr'),
    hint: t('circularMotion.steps.step2Hint')
  },
  {
    id: 'step3',
    title: t('circularMotion.steps.step3Title'),
    instruction: t('circularMotion.steps.step3Instr'),
    hint: t('circularMotion.steps.step3Hint')
  }
]);

async function loadNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/motion/circular-motion').first();
    if (existing) {
      userNotes.value = existing.content;
    }
  } catch (e) {
    console.warn('Could not load notes:', e);
  }
}

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/motion/circular-motion').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now()
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/motion/circular-motion',
        content: userNotes.value,
        updatedAt: Date.now()
      });
    }
    store.showToast(t('circularMotion.notesSaved'), 'success');
  } catch (e) {
    console.error('Failed to save notes:', e);
  }
}

onMounted(() => {
  initLoop();
  resetSimulation();
  loadNotes();
});

onBeforeUnmount(() => {
  if (accumulator) {
    accumulator.pause();
    accumulator = null;
  }
});
</script>

<style scoped>
.circular-motion-experiment {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.experiment-workspace {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  min-height: auto;
}

@media (min-width: 1024px) {
  .experiment-workspace {
    grid-template-columns: 1fr 340px;
    align-items: stretch;
  }
}

.scene-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  position: relative;
  min-height: auto;
}

.canvas-mount {
  position: relative;
  flex: 1;
  height: 480px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-subtle);
}

.control-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--surface-glass);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  max-height: 600px;
  overflow: hidden;
}

.sidebar-header h3 {
  font-size: var(--text-md);
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.sidebar-scroll {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  overflow-y: auto;
  min-height: 0;
  padding-inline-end: var(--space-1);
}

.bottom-tabs-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-xl);
}

.tabs-nav {
  display: flex;
  gap: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--space-2);
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast);
  white-space: nowrap;
}

.tab-btn:hover {
  background: var(--surface-overlay);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--primary-surface);
  color: var(--primary);
}

.tab-content-area {
  min-height: 280px;
}

.tab-panel {
  width: 100%;
}

.notes-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notes-header h4 {
  margin: 0;
  font-size: var(--text-md);
  color: var(--text-primary);
}

.btn-save-note {
  padding: var(--space-2) var(--space-3);
  background: var(--primary);
  color: var(--text-on-primary);
  border: none;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--duration-fast);
}

.btn-save-note:hover {
  opacity: 0.9;
}

.notes-textarea {
  width: 100%;
  min-height: 200px;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface-base);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-sm);
  resize: vertical;
}

.notes-textarea:focus {
  outline: none;
  border-color: var(--primary);
}

@media (max-width: 1023px) {
  .experiment-workspace {
    min-height: auto;
  }
  .canvas-mount {
    height: clamp(260px, 38vh, 420px);
  }
  .desktop-only {
    display: none !important;
  }
}

@media (max-width: 640px) {
  .circular-motion-experiment {
    padding: var(--space-2);
    gap: var(--space-2);
  }
  .bottom-tabs-section {
    padding: var(--space-2);
  }
  .tab-btn {
    padding: 0.45rem 0.8rem;
    font-size: 0.8rem;
  }
}

@media (min-width: 1024px) {
  .mobile-only {
    display: none !important;
  }
}
</style>
