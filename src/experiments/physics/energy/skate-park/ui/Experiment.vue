<template>
  <div class="skate-park-experiment">
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

    <!-- Main Workspace -->
    <div class="experiment-workspace">
      <!-- Simulation Stage -->
      <div class="scene-container">
        <div class="canvas-mount">
          <SkateParkCanvas
            ref="canvasViewRef"
            :state="currentState"
            :params="internalParams"
            :mode="mode"
          />

          <!-- Floating Measurement Tools -->
          <RulerWidget v-if="showRuler" :visible="showRuler" @close="showRuler = false" />
          <StopwatchWidget v-if="showStopwatch" :visible="showStopwatch" @close="showStopwatch = false" />
        </div>
      </div>

      <!-- Desktop Sidebar Controls -->
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

          <!-- Variable Group 1: Track Geometry -->
          <VariableGroup :title="$t('skatePark.trackGeometry')">
            <div class="shape-selector-group">
              <label class="control-label">{{ $t('skatePark.trackShape') }}</label>
              <div class="shape-pill-list">
                <button
                  v-for="(shapeName, idx) in shapeLabels"
                  :key="idx"
                  type="button"
                  class="shape-pill-btn"
                  :class="{ active: uiParams.trackShapeIndex === idx }"
                  @click="setShapeIndex(idx)"
                >
                  {{ shapeName }}
                </button>
              </div>
            </div>

            <UnitSlider
              id="initialHeight"
              v-model="uiParams.initialHeight"
              :label="$t('skatePark.initialHeight')"
              unit="m"
              :min="1.0"
              :max="6.0"
              :step="0.2"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Variable Group 2: Skater & Environment -->
          <VariableGroup :title="$t('skatePark.controlsTitle')">
            <UnitSlider
              id="skaterMass"
              v-model="uiParams.skaterMass"
              :label="$t('skatePark.skaterMass')"
              unit="kg"
              :min="20"
              :max="120"
              :step="1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="gravity"
              v-model="uiParams.gravity"
              :label="$t('skatePark.gravity')"
              unit="m/s²"
              :min="1.0"
              :max="25.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="mode === 'real'"
              id="trackFrictionMu"
              v-model="uiParams.trackFrictionMu"
              :label="$t('skatePark.trackFrictionMu')"
              unit=""
              :min="0.0"
              :max="0.2"
              :step="0.01"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slot Save/Load Persistence -->
          <SlotManager
            experiment-id="physics/energy/skate-park"
            :current-params="uiParams"
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

      <VariableGroup :title="$t('skatePark.trackGeometry')">
        <div class="shape-selector-group">
          <label class="control-label">{{ $t('skatePark.trackShape') }}</label>
          <div class="shape-pill-list">
            <button
              v-for="(shapeName, idx) in shapeLabels"
              :key="idx"
              type="button"
              class="shape-pill-btn"
              :class="{ active: uiParams.trackShapeIndex === idx }"
              @click="setShapeIndex(idx)"
            >
              {{ shapeName }}
            </button>
          </div>
        </div>

        <UnitSlider
          id="initialHeight-mobile"
          v-model="uiParams.initialHeight"
          :label="$t('skatePark.initialHeight')"
          unit="m"
          :min="1.0"
          :max="6.0"
          :step="0.2"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('skatePark.controlsTitle')">
        <UnitSlider
          id="skaterMass-mobile"
          v-model="uiParams.skaterMass"
          :label="$t('skatePark.skaterMass')"
          unit="kg"
          :min="20"
          :max="120"
          :step="1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="gravity-mobile"
          v-model="uiParams.gravity"
          :label="$t('skatePark.gravity')"
          unit="m/s²"
          :min="1.0"
          :max="25.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          v-if="mode === 'real'"
          id="trackFrictionMu-mobile"
          v-model="uiParams.trackFrictionMu"
          :label="$t('skatePark.trackFrictionMu')"
          unit=""
          :min="0.0"
          :max="0.2"
          :step="0.01"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/energy/skate-park"
        :current-params="uiParams"
        :current-mode="mode"
        @load="onLoadSlot"
      />
    </BottomSheet>

    <!-- Bottom Analysis Tabs -->
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

        <!-- Tab 3: Energy Conservation Theory & Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel">
          <FormulaPanel
            :title="$t('skatePark.tabTheory')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('skatePark.theoryContent') }}</p>
          </div>
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
        :title="$t('experiments.skatePark.title')"
        :mode="mode"
        :params="uiParams"
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
  createSkateParkModel,
  stepSkateParkModel,
  type SkateParkParams,
  type SkateParkState,
  type TrackShape
} from '../model/skatePark';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { skateParkConfig } from '../config';

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
import SkateParkCanvas from '../view/SkateParkCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();
const canvasViewRef = ref<InstanceType<typeof SkateParkCanvas> | null>(null);

const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('classicU');
const userNotes = ref<string>('');

const SHAPES: TrackShape[] = ['u-ramp', 'double-well', 'slope'];

interface UIParams extends Record<string, number> {
  trackShapeIndex: number;
  skaterMass: number;
  initialHeight: number;
  gravity: number;
  trackFrictionMu: number;
}

const uiParams = reactive<UIParams>({
  trackShapeIndex: 0,
  skaterMass: 60,
  initialHeight: 4.0,
  gravity: 9.8,
  trackFrictionMu: 0.04,
});

const shapeLabels = computed(() => [
  t('skatePark.shapeURamp'),
  t('skatePark.shapeDoubleDip'),
  t('skatePark.shapeSlope'),
]);

function setShapeIndex(idx: number) {
  uiParams.trackShapeIndex = idx;
  resetSimulation();
}

const internalParams = computed<SkateParkParams>(() => {
  const shape = SHAPES[Math.max(0, Math.min(2, Math.round(uiParams.trackShapeIndex)))];
  return {
    trackShape: shape,
    skaterMass: uiParams.skaterMass,
    gravity: uiParams.gravity,
    trackFrictionMu: mode.value === 'real' ? uiParams.trackFrictionMu : 0,
    initialHeight: uiParams.initialHeight,
    isRealMode: mode.value === 'real',
  };
});

let state = createSkateParkModel(internalParams.value);
const currentState = ref<SkateParkState>(state);

const series = reactive<DataSeries>({
  t: [0],
  x: [state.x],
  y: [state.y],
  vx: [state.speed],
  vy: [state.potentialEnergy],
  v: [state.kineticEnergy],
});

const comparisonRuns = ref<ComparisonRun[]>([]);
let accumulator: PhysicsAccumulator | null = null;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.01,
    onPhysicsStep: (dt: number) => {
      const nextState = stepSkateParkModel(currentState.value, internalParams.value, dt * speed.value);
      currentState.value = nextState;

      if (series.t.length > 500) {
        series.t.shift();
        series.x.shift();
        series.y.shift();
        series.vx.shift();
        series.vy.shift();
        series.v.shift();
      }

      series.t.push(nextState.t);
      series.x.push(nextState.x);
      series.y.push(nextState.y);
      series.vx.push(nextState.speed);
      series.vy.push(nextState.potentialEnergy);
      series.v.push(nextState.kineticEnergy);
    },
    onRenderStep: () => {},
  });
}

function togglePlay() {
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
  pauseSimulation();
  currentState.value = stepSkateParkModel(currentState.value, internalParams.value, 0.01);
}

function resetSimulation() {
  pauseSimulation();
  currentState.value = createSkateParkModel(internalParams.value);

  series.t = [0];
  series.x = [currentState.value.x];
  series.y = [currentState.value.y];
  series.vx = [currentState.value.speed];
  series.vy = [currentState.value.potentialEnergy];
  series.v = [currentState.value.kineticEnergy];
}

function setSpeed(newSpeed: number) {
  speed.value = newSpeed;
}

function setMode(newMode: 'ideal' | 'real') {
  mode.value = newMode;
  resetSimulation();
}

function onParamChange() {
  resetSimulation();
}

const presetOptions = computed<PresetOption[]>(() => {
  return (skateParkConfig.presets || []).map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }));
});

function applyPreset(preset: PresetOption) {
  currentPresetId.value = preset.id;
  Object.assign(uiParams, preset.params);
  resetSimulation();
}

function onLoadSlot(slot: StoredSlot) {
  if (slot.params) {
    Object.assign(uiParams, slot.params);
  }
  if (slot.mode) {
    mode.value = slot.mode;
  }
  resetSimulation();
}

const bottomTabs = computed(() => [
  { id: 'graph', label: t('common.graph') },
  { id: 'table', label: t('common.table') },
  { id: 'theory', label: t('skatePark.tabTheory') },
  { id: 'notes', label: t('common.notes') },
  { id: 'guided', label: t('common.guided') },
]);

const formulaItems = computed<FormulaItem[]>(() => {
  const g = internalParams.value.gravity;
  const h = internalParams.value.initialHeight;
  const vMax = Math.sqrt(2 * g * h);

  return [
    {
      title: t('skatePark.formula_totalEnergy'),
      latex: `E_{\\text{total}} = PE + KE + E_{\\text{thermal}}`,
      explanation: t('skatePark.totalEnergyExpl'),
      liveValue: `E = ${currentState.value.totalEnergy.toFixed(0)} \\text{ J}`,
    },
    {
      title: t('skatePark.formula_potentialEnergy'),
      latex: `PE = m g y`,
      explanation: t('skatePark.potentialEnergyExpl'),
      liveValue: `PE = ${currentState.value.potentialEnergy.toFixed(0)} \\text{ J}`,
    },
    {
      title: t('skatePark.formula_kineticEnergy'),
      latex: `KE = \\frac{1}{2} m v^2`,
      explanation: t('skatePark.kineticEnergyExpl'),
      liveValue: `KE = ${currentState.value.kineticEnergy.toFixed(0)} \\text{ J}`,
    },
    {
      title: t('skatePark.formula_torricelli'),
      latex: `v_{\\max} = \\sqrt{2 g \\Delta y}`,
      explanation: t('skatePark.torricelliExpl'),
      liveValue: `v_{\\max} = ${vMax.toFixed(2)} \\text{ m/s}`,
    },
  ];
});

const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step-1',
    title: t('skatePark.preset_classicU'),
    instruction: 'Release the skater on the U-Ramp and watch the bar chart at top right as PE converts entirely to KE at the bottom and back to PE at the crest.',
    hint: 'Notice that in Ideal mode, the skater reaches exactly the initial height on the opposite side.',
  },
  {
    id: 'step-2',
    title: t('skatePark.preset_doubleDip'),
    instruction: 'Switch to the Double Dip Rollercoaster and observe the partial speed drops when crossing the central crest.',
    hint: 'As the skater ascends the middle hill, KE converts back to PE, lowering speed while keeping total energy constant.',
  },
  {
    id: 'step-3',
    title: 'Friction & Thermal Heat',
    instruction: 'Switch to Real mode and notice how thermal energy (orange bar) grows continuously with distance traveled.',
    hint: 'Friction dissipates mechanical energy until the skater comes to a complete rest at the lowest dip.',
  },
]);

const calculatedResults = computed(() => ({
  speed: currentState.value.speed,
  height: currentState.value.y,
  potentialEnergy: currentState.value.potentialEnergy,
  kineticEnergy: currentState.value.kineticEnergy,
  totalEnergy: currentState.value.totalEnergy,
}));

const reportResultsRows = computed(() => [
  {
    name: t('skatePark.speed'),
    simulated: `${currentState.value.speed.toFixed(2)} m/s`,
  },
  {
    name: t('skatePark.height'),
    simulated: `${currentState.value.y.toFixed(2)} m`,
  },
  {
    name: t('skatePark.potentialEnergy'),
    simulated: `${currentState.value.potentialEnergy.toFixed(0)} J`,
  },
  {
    name: t('skatePark.kineticEnergy'),
    simulated: `${currentState.value.kineticEnergy.toFixed(0)} J`,
  },
  {
    name: t('skatePark.totalEnergy'),
    simulated: `${currentState.value.totalEnergy.toFixed(0)} J`,
  },
]);

const reportVariablesList = computed(() => [
  { name: t('skatePark.trackShape'), symbol: 'Track', value: shapeLabels.value[uiParams.trackShapeIndex] || 'U-Ramp', unit: '' },
  { name: t('skatePark.skaterMass'), symbol: 'm', value: uiParams.skaterMass, unit: 'kg' },
  { name: t('skatePark.initialHeight'), symbol: 'y₀', value: uiParams.initialHeight, unit: 'm' },
  { name: t('skatePark.gravity'), symbol: 'g', value: uiParams.gravity, unit: 'm/s²' },
  { name: t('skatePark.trackFrictionMu'), symbol: 'μ', value: uiParams.trackFrictionMu, unit: '' },
]);

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/energy/skate-park').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/energy/skate-park',
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    }
    store.showToast(t('common.save'), 'success');
  } catch (e) {
    console.error('Failed to save notes:', e);
  }
}

async function loadNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/energy/skate-park').first();
    if (existing) {
      userNotes.value = existing.content;
    }
  } catch (e) {
    console.error('Failed to load notes:', e);
  }
}

onMounted(() => {
  initLoop();
  loadNotes();
});

onBeforeUnmount(() => {
  if (accumulator) {
    accumulator.destroy();
    accumulator = null;
  }
});
</script>

<style scoped>
.skate-park-experiment {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
  width: 100%;
}

.experiment-workspace {
  display: flex;
  gap: var(--space-4, 16px);
  width: 100%;
  align-items: flex-start;
}

.scene-container {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.canvas-mount {
  position: relative;
  width: 100%;
  height: 520px;
  background-color: var(--color-surface, #0f172a);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

.control-sidebar {
  width: 320px;
  flex-shrink: 0;
  background: var(--color-surface, rgba(255, 255, 255, 0.7));
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
  border-radius: var(--radius-lg, 12px);
  padding: var(--space-4, 16px);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
}

.sidebar-header h3 {
  margin: 0 0 var(--space-3, 12px) 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text, #1e293b);
}

.sidebar-scroll {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.shape-selector-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.control-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text, #334155);
}

.shape-pill-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.shape-pill-btn {
  padding: 6px 10px;
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.15));
  background: rgba(0, 0, 0, 0.03);
  border-radius: var(--radius-md, 8px);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  color: var(--color-text, #334155);
  transition: all 0.15s ease;
  text-align: start;
}

.shape-pill-btn:hover {
  background: rgba(2, 132, 199, 0.08);
  border-color: #38bdf8;
}

.shape-pill-btn.active {
  background: #0284c7;
  border-color: #0284c7;
  color: #ffffff;
  font-weight: 600;
}

.bottom-tabs-section {
  width: 100%;
  background: var(--color-surface, rgba(255, 255, 255, 0.7));
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
}

.tabs-nav {
  display: flex;
  gap: var(--space-2, 8px);
  padding: var(--space-2, 8px) var(--space-4, 16px);
  border-bottom: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
  background: rgba(0, 0, 0, 0.02);
  overflow-x: auto;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary, #64748b);
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--color-text, #1e293b);
  background: rgba(0, 0, 0, 0.04);
}

.tab-btn.active {
  color: #0284c7;
  background: rgba(2, 132, 199, 0.1);
  font-weight: 600;
}

.tab-content-area {
  padding: var(--space-4, 16px);
  min-height: 280px;
}

.tab-panel {
  width: 100%;
}

.theory-prose {
  margin-top: var(--space-4, 16px);
  padding: var(--space-4, 16px);
  background: rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-md, 8px);
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-line;
}

.notes-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notes-header h4 {
  margin: 0;
  font-size: 1rem;
}

.btn-save-note {
  padding: 6px 14px;
  background: #0284c7;
  color: #ffffff;
  border: none;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  font-weight: 500;
}

.notes-textarea {
  width: 100%;
  min-height: 160px;
  padding: 12px;
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
  background: var(--color-bg, #ffffff);
  color: var(--color-text, #0f172a);
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
}

@media (max-width: 1023px) {
  .desktop-only {
    display: none !important;
  }
}

@media (min-width: 1024px) {
  .mobile-only {
    display: none !important;
  }
}
</style>
