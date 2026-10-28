<template>
  <div class="pulleys-levers-experiment">
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
          <PulleysLeversCanvas
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

          <!-- Variable Group 1: Masses -->
          <VariableGroup :title="$t('pulleysLevers.controls.groupMasses')">
            <UnitSlider
              id="m1"
              v-model="params.atwood.m1"
              :label="$t('pulleysLevers.m1')"
              unit="kg"
              :min="0.5"
              :max="20"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="m2"
              v-model="params.atwood.m2"
              :label="$t('pulleysLevers.m2')"
              unit="kg"
              :min="0.5"
              :max="20"
              :step="0.1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Variable Group 2: Pulley & Real Effects -->
          <VariableGroup :title="$t('pulleysLevers.controls.groupPulley')">
            <UnitSlider
              id="pulleyMass"
              v-model="params.atwood.pulleyMass"
              :label="$t('pulleysLevers.pulleyMass')"
              unit="kg"
              :min="0"
              :max="5"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="pulleyRadius"
              v-model="params.atwood.pulleyRadius"
              :label="$t('pulleysLevers.pulleyRadius')"
              unit="m"
              :min="0.05"
              :max="0.5"
              :step="0.01"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="mode === 'real'"
              id="frictionTorque"
              v-model="params.atwood.frictionTorque"
              :label="$t('pulleysLevers.frictionTorque')"
              unit="N·m"
              :min="0"
              :max="2"
              :step="0.05"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="gravity"
              v-model="params.atwood.gravity"
              :label="$t('pulleysLevers.gravity')"
              unit="m/s²"
              :min="1"
              :max="25"
              :step="0.1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slots Persistence -->
          <SlotManager
            experiment-id="physics/motion/pulleys-levers"
            :current-params="params.atwood"
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

      <VariableGroup :title="$t('pulleysLevers.controls.groupMasses')">
        <UnitSlider
          id="m1-mobile"
          v-model="params.atwood.m1"
          :label="$t('pulleysLevers.m1')"
          unit="kg"
          :min="0.5"
          :max="20"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m2-mobile"
          v-model="params.atwood.m2"
          :label="$t('pulleysLevers.m2')"
          unit="kg"
          :min="0.5"
          :max="20"
          :step="0.1"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('pulleysLevers.controls.groupPulley')">
        <UnitSlider
          id="pulleyMass-mobile"
          v-model="params.atwood.pulleyMass"
          :label="$t('pulleysLevers.pulleyMass')"
          unit="kg"
          :min="0"
          :max="5"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="pulleyRadius-mobile"
          v-model="params.atwood.pulleyRadius"
          :label="$t('pulleysLevers.pulleyRadius')"
          unit="m"
          :min="0.05"
          :max="0.5"
          :step="0.01"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          v-if="mode === 'real'"
          id="frictionTorque-mobile"
          v-model="params.atwood.frictionTorque"
          :label="$t('pulleysLevers.frictionTorque')"
          unit="N·m"
          :min="0"
          :max="2"
          :step="0.05"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="gravity-mobile"
          v-model="params.atwood.gravity"
          :label="$t('pulleysLevers.gravity')"
          unit="m/s²"
          :min="1"
          :max="25"
          :step="0.1"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/motion/pulleys-levers"
        :current-params="params.atwood"
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
        :title="$t('experiments.pulleysLevers.title')"
        :mode="mode"
        :params="params.atwood"
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
  PulleysLeversSimulation,
  computeIdealAtwoodAnalytical,
  type PulleysLeversParams,
  type PulleysLeversState
} from '../model/pulleysLevers';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { pulleysLeversConfig } from '../config';

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
import PulleysLeversCanvas from '../view/PulleysLeversCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();
const canvasViewRef = ref<InstanceType<typeof PulleysLeversCanvas> | null>(null);

const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('atwood-standard');
const userNotes = ref<string>('');

const params = reactive<PulleysLeversParams>({
  type: 'atwood',
  atwood: {
    m1: 3.0,
    m2: 5.0,
    pulleyMass: 0.5,
    pulleyRadius: 0.15,
    frictionTorque: 0.1,
    gravity: 9.80665,
    height: 2.0
  },
  pulleySystem: {
    loadMass: 20.0,
    effortMass: 6.0,
    strands: 4,
    pulleyMass: 0.5,
    efficiency: 0.85,
    gravity: 9.80665
  },
  lever: {
    loadMass: 10.0,
    loadArm: 0.5,
    effortForce: 49.03325,
    effortArm: 1.0,
    beamMass: 2.0,
    beamLength: 2.0,
    fulcrumOffset: 0,
    frictionCoeff: 0.1,
    gravity: 9.80665
  }
});

let sim = new PulleysLeversSimulation(params, mode.value);
const currentState = ref<PulleysLeversState>(sim.getState());

const series = reactive<DataSeries>({
  t: [0],
  x: [0],
  y: [params.atwood.height],
  vx: [0],
  vy: [0],
  v: [0]
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

      // Map Atwood variables to Graph series:
      // x: tension1, y: y1 (height of m1), vy: velocity v, v: acceleration a
      series.t.push(nextState.t);
      series.x.push(nextState.tension1);
      series.y.push(nextState.y1);
      series.vx.push(nextState.tension2);
      series.vy.push(nextState.v);
      series.v.push(nextState.a);
    },
    onRenderStep: () => {}
  });
}

function togglePlay() {
  if (currentState.value.isStopped) {
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
  series.x = [currentState.value.tension1];
  series.y = [currentState.value.y1];
  series.vx = [currentState.value.tension2];
  series.vy = [0];
  series.v = [0];
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
  return pulleysLeversConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params
  }));
});

function applyPreset(preset: PresetOption) {
  currentPresetId.value = preset.id;
  Object.assign(params.atwood, preset.params);
  if (preset.id === 'atwood-standard' || preset.id === 'atwood-balanced') {
    mode.value = 'ideal';
  } else {
    mode.value = 'real';
  }
  resetSimulation();
}

function onLoadSlot(slot: StoredSlot) {
  Object.assign(params.atwood, slot.params);
  mode.value = slot.mode;
  resetSimulation();
}

async function onRunCompleted() {
  const analytical = computeIdealAtwoodAnalytical(
    params.atwood.m1,
    params.atwood.m2,
    params.atwood.gravity
  );
  const simAcc = currentState.value.a;
  const errorAcc = Math.abs(simAcc - analytical.acceleration) / Math.max(1e-4, Math.abs(analytical.acceleration));

  try {
    await db.runs.add({
      experimentId: 'physics/motion/pulleys-levers',
      createdAt: Date.now(),
      mode: mode.value,
      params: { ...params.atwood },
      summary: {
        acceleration: simAcc,
        tension1: currentState.value.tension1,
        tension2: currentState.value.tension2,
        finalVelocity: currentState.value.v,
        errorVsIdealPercent: errorAcc * 100
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
      ? t('pulleysLevers.runComparisonIdeal', { m1: params.atwood.m1, m2: params.atwood.m2 })
      : t('pulleysLevers.runComparisonReal', { m1: params.atwood.m1, m2: params.atwood.m2 });

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
  const analytical = computeIdealAtwoodAnalytical(
    params.atwood.m1,
    params.atwood.m2,
    params.atwood.gravity
  );
  const simAcc = currentState.value.a;
  const simT1 = currentState.value.tension1;
  const simT2 = currentState.value.tension2;

  return {
    simulatedAcceleration: simAcc,
    theoreticalAcceleration: analytical.acceleration,
    accError: Math.abs(simAcc - analytical.acceleration) / Math.max(1e-4, Math.abs(analytical.acceleration)) * 100,
    simulatedTension1: simT1,
    simulatedTension2: simT2,
    theoreticalTension: analytical.tension,
    tensionError: Math.abs(simT1 - analytical.tension) / Math.max(1e-4, analytical.tension) * 100
  };
});

const reportResultsRows = computed(() => {
  const res = calculatedResults.value;
  return [
    {
      name: 'شتاب سیستم (Linear Acceleration)',
      simulated: `${res.simulatedAcceleration.toFixed(3)} m/s²`,
      theoretical: `${res.theoreticalAcceleration.toFixed(3)} m/s²`,
      error: `${res.accError.toFixed(2)} %`
    },
    {
      name: 'کشش ریسمان چپ (Tension T₁)',
      simulated: `${res.simulatedTension1.toFixed(2)} N`,
      theoretical: `${res.theoreticalTension.toFixed(2)} N`,
      error: `${res.tensionError.toFixed(2)} %`
    },
    {
      name: 'کشش ریسمان راست (Tension T₂)',
      simulated: `${res.simulatedTension2.toFixed(2)} N`,
      theoretical: `${res.theoreticalTension.toFixed(2)} N`,
      error: '—'
    }
  ];
});

const reportVariablesList = computed(() => [
  { name: 'جرم وزنه ۱', symbol: 'm₁', value: params.atwood.m1, unit: 'kg' },
  { name: 'جرم وزنه ۲', symbol: 'm₂', value: params.atwood.m2, unit: 'kg' },
  { name: 'جرم قرقره', symbol: 'M_p', value: params.atwood.pulleyMass, unit: 'kg' },
  { name: 'شعاع قرقره', symbol: 'R', value: params.atwood.pulleyRadius, unit: 'm' },
  { name: 'گشتاور اصطکاک', symbol: 'τ_f', value: params.atwood.frictionTorque, unit: 'N·m' },
  { name: 'شتاب گرانش', symbol: 'g', value: params.atwood.gravity, unit: 'm/s²' }
]);

const formulaItems = computed<FormulaItem[]>(() => {
  const res = calculatedResults.value;
  return [
    {
      title: t('pulleysLevers.formulas.atwoodAccTitle'),
      latex: 'a = \\frac{m_2 - m_1}{m_1 + m_2} g',
      explanation: t('pulleysLevers.formulas.atwoodAccExpl'),
      liveValue: `a_{\\text{ideal}} = ${res.theoreticalAcceleration.toFixed(2)} m/s²`
    },
    {
      title: t('pulleysLevers.formulas.atwoodTensionTitle'),
      latex: 'T = \\frac{2 m_1 m_2}{m_1 + m_2} g',
      explanation: t('pulleysLevers.formulas.atwoodTensionExpl'),
      liveValue: `T_{\\text{ideal}} = ${res.theoreticalTension.toFixed(2)} N`
    },
    {
      title: t('pulleysLevers.formulas.realInertiaTitle'),
      latex: 'a_{\\text{real}} = \\frac{(m_2 - m_1)g - \\frac{\\tau_f}{R}}{m_1 + m_2 + \\frac{1}{2}M_p}',
      explanation: t('pulleysLevers.formulas.realInertiaExpl'),
      liveValue: `a_{\\text{sim}} = ${res.simulatedAcceleration.toFixed(2)} m/s²`
    },
    {
      title: t('pulleysLevers.formulas.maTitle'),
      latex: 'IMA = N, \\quad AMA = \\frac{F_{\\text{load}}}{F_{\\text{effort}}} = \\eta \\cdot IMA',
      explanation: t('pulleysLevers.formulas.maExpl')
    }
  ];
});

const bottomTabs = computed(() => [
  { id: 'graph', label: `📈 ${t('pulleysLevers.tabs.graph')}` },
  { id: 'table', label: `📊 ${t('pulleysLevers.tabs.table')}` },
  { id: 'theory', label: `📐 ${t('pulleysLevers.tabs.theory')}` },
  { id: 'notes', label: `📝 ${t('pulleysLevers.tabs.notes')}` },
  { id: 'guided', label: `🧭 ${t('pulleysLevers.tabs.guided')}` }
]);

const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step1',
    title: t('pulleysLevers.steps.step1Title'),
    instruction: t('pulleysLevers.steps.step1Instr'),
    hint: t('pulleysLevers.steps.step1Hint')
  },
  {
    id: 'step2',
    title: t('pulleysLevers.steps.step2Title'),
    instruction: t('pulleysLevers.steps.step2Instr'),
    hint: t('pulleysLevers.steps.step2Hint')
  },
  {
    id: 'step3',
    title: t('pulleysLevers.steps.step3Title'),
    instruction: t('pulleysLevers.steps.step3Instr'),
    hint: t('pulleysLevers.steps.step3Hint')
  }
]);

async function loadNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/motion/pulleys-levers').first();
    if (existing) {
      userNotes.value = existing.content;
    }
  } catch (e) {
    console.warn('Could not load notes:', e);
  }
}

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/motion/pulleys-levers').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now()
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/motion/pulleys-levers',
        content: userNotes.value,
        updatedAt: Date.now()
      });
    }
    store.showToast(t('pulleysLevers.notesSaved'), 'success');
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
.pulleys-levers-experiment {
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
  .pulleys-levers-experiment {
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
