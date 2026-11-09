<template>
  <div class="orbital-experiment">
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
          <OrbitCanvas
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

          <!-- Variable Group 1: Orbital Geometry -->
          <VariableGroup :title="$t('orbitalGravity.orbitParameters')">
            <UnitSlider
              id="semiMajorAxis"
              v-model="uiParams.semiMajorAxis"
              :label="$t('orbitalGravity.semiMajorAxis')"
              unit="km"
              :min="6800"
              :max="45000"
              :step="100"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="eccentricity"
              v-model="uiParams.eccentricity"
              :label="$t('orbitalGravity.eccentricity')"
              unit=""
              :min="0.0"
              :max="0.85"
              :step="0.01"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Variable Group 2: Masses & Real Perturbations -->
          <VariableGroup :title="$t('orbitalGravity.controlsTitle')">
            <UnitSlider
              id="primaryMassFactor"
              v-model="uiParams.primaryMassFactor"
              :label="$t('orbitalGravity.primaryMassFactor')"
              unit="M⊕"
              :min="0.2"
              :max="5.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="satelliteMass"
              v-model="uiParams.satelliteMass"
              :label="$t('orbitalGravity.satelliteMass')"
              unit="kg"
              :min="100"
              :max="20000"
              :step="100"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="mode === 'real'"
              id="atmosphericDrag"
              v-model="uiParams.atmosphericDrag"
              :label="$t('orbitalGravity.atmosphericDrag')"
              unit=""
              :min="0.0"
              :max="1.0"
              :step="0.05"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slot Save/Load Persistence -->
          <SlotManager
            experiment-id="physics/motion/orbital-gravity"
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

      <VariableGroup :title="$t('orbitalGravity.orbitParameters')">
        <UnitSlider
          id="semiMajorAxis-mobile"
          v-model="uiParams.semiMajorAxis"
          :label="$t('orbitalGravity.semiMajorAxis')"
          unit="km"
          :min="6800"
          :max="45000"
          :step="100"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="eccentricity-mobile"
          v-model="uiParams.eccentricity"
          :label="$t('orbitalGravity.eccentricity')"
          unit=""
          :min="0.0"
          :max="0.85"
          :step="0.01"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('orbitalGravity.controlsTitle')">
        <UnitSlider
          id="primaryMassFactor-mobile"
          v-model="uiParams.primaryMassFactor"
          :label="$t('orbitalGravity.primaryMassFactor')"
          unit="M⊕"
          :min="0.2"
          :max="5.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="satelliteMass-mobile"
          v-model="uiParams.satelliteMass"
          :label="$t('orbitalGravity.satelliteMass')"
          unit="kg"
          :min="100"
          :max="20000"
          :step="100"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          v-if="mode === 'real'"
          id="atmosphericDrag-mobile"
          v-model="uiParams.atmosphericDrag"
          :label="$t('orbitalGravity.atmosphericDrag')"
          unit=""
          :min="0.0"
          :max="1.0"
          :step="0.05"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/motion/orbital-gravity"
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

        <!-- Tab 3: Keplerian Theory & Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel">
          <FormulaPanel
            :title="$t('orbitalGravity.tabTheory')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('orbitalGravity.theoryContent') }}</p>
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
        :title="$t('experiments.orbitalGravity.title')"
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
  createOrbitModel,
  stepOrbitModel,
  type OrbitParams,
  type OrbitState
} from '../model/orbital';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { orbitalGravityConfig } from '../config';

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
import OrbitCanvas from '../view/OrbitCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();
const canvasViewRef = ref<InstanceType<typeof OrbitCanvas> | null>(null);

const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('leo');
const userNotes = ref<string>('');

const EARTH_MASS = 5.972e24; // kg
const G_CONST = 6.6743e-11;

// UI level parameters (km, factor)
interface UIParams extends Record<string, number> {
  semiMajorAxis: number;
  eccentricity: number;
  primaryMassFactor: number;
  satelliteMass: number;
  atmosphericDrag: number;
}

const uiParams = reactive<UIParams>({
  semiMajorAxis: 12000,
  eccentricity: 0.35,
  primaryMassFactor: 1.0,
  satelliteMass: 1500,
  atmosphericDrag: 0.2,
});

// Converts UI parameters to pure SI model parameters
const internalParams = computed<OrbitParams>(() => {
  return {
    primaryMass: EARTH_MASS * uiParams.primaryMassFactor,
    satelliteMass: uiParams.satelliteMass,
    semiMajorAxis: uiParams.semiMajorAxis * 1000, // km -> meters
    eccentricity: uiParams.eccentricity,
    trueAnomaly0: 0,
    gConst: G_CONST,
    isRealMode: mode.value === 'real' && uiParams.atmosphericDrag > 0,
  };
});

let state = createOrbitModel(internalParams.value);
const currentState = ref<OrbitState>(state);

const series = reactive<DataSeries>({
  t: [0],
  x: [state.x / 1000], // km
  y: [state.y / 1000],
  vx: [state.speed / 1000], // km/s
  vy: [state.r / 1000], // orbital radius in km
  v: [state.specificEnergy / 1e6], // MJ/kg
});

const comparisonRuns = ref<ComparisonRun[]>([]);
let accumulator: PhysicsAccumulator | null = null;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.02,
    onPhysicsStep: (dt: number) => {
      // Time warp factor based on orbital period so orbits finish in reasonable lab time
      const simPeriod = currentState.value.period || 6000;
      const timeScale = (simPeriod / 35) * speed.value;
      const simDt = dt * timeScale;

      const nextState = stepOrbitModel(currentState.value, internalParams.value, simDt);
      currentState.value = nextState;

      // Append chart telemetry (limit series length)
      if (series.t.length > 500) {
        series.t.shift();
        series.x.shift();
        series.y.shift();
        series.vx.shift();
        series.vy.shift();
        series.v.shift();
      }

      series.t.push(nextState.t);
      series.x.push(nextState.x / 1000);
      series.y.push(nextState.y / 1000);
      series.vx.push(nextState.speed / 1000);
      series.vy.push(nextState.r / 1000);
      series.v.push(nextState.specificEnergy / 1e6);
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
  const simPeriod = currentState.value.period || 6000;
  const simDt = 0.02 * (simPeriod / 35);
  currentState.value = stepOrbitModel(currentState.value, internalParams.value, simDt);
}

function resetSimulation() {
  pauseSimulation();
  currentState.value = createOrbitModel(internalParams.value);

  series.t = [0];
  series.x = [currentState.value.x / 1000];
  series.y = [currentState.value.y / 1000];
  series.vx = [currentState.value.speed / 1000];
  series.vy = [currentState.value.r / 1000];
  series.v = [currentState.value.specificEnergy / 1e6];
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
  return (orbitalGravityConfig.presets || []).map((p: ExperimentPresetDef) => ({
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
  { id: 'theory', label: t('orbitalGravity.tabTheory') },
  { id: 'notes', label: t('common.notes') },
  { id: 'guided', label: t('common.guided') },
]);

const formulaItems = computed<FormulaItem[]>(() => {
  const mu = G_CONST * internalParams.value.primaryMass;
  const a = internalParams.value.semiMajorAxis;
  const e = internalParams.value.eccentricity;
  const period = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu);
  const vP = Math.sqrt(mu * (2 / (a * (1 - e)) - 1 / a));
  const vA = Math.sqrt(mu * (2 / (a * (1 + e)) - 1 / a));

  return [
    {
      title: t('orbitalGravity.formula_vis_viva'),
      latex: `v(r) = \\sqrt{\\mu \\left(\\frac{2}{r} - \\frac{1}{a}\\right)}`,
      explanation: t('orbitalGravity.speed'),
      liveValue: `v_P = ${(vP / 1000).toFixed(2)} \\text{ km/s}, \\; v_A = ${(vA / 1000).toFixed(2)} \\text{ km/s}`,
    },
    {
      title: t('orbitalGravity.formula_kepler_third'),
      latex: `T = 2\\pi \\sqrt{\\frac{a^3}{GM}}`,
      explanation: t('orbitalGravity.orbitalPeriod'),
      liveValue: `T = ${(period / 3600).toFixed(2)} \\text{ h}`,
    },
    {
      title: t('orbitalGravity.formula_angular_momentum'),
      latex: `h = \\sqrt{GM a (1 - e^2)}`,
      explanation: t('orbitalGravity.angularMomentum'),
      liveValue: `h = ${(Math.sqrt(mu * a * (1 - e * e)) / 1e9).toFixed(2)} \\times 10^9 \\text{ m}^2/\\text{s}`,
    },
  ];
});

const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step-1',
    title: t('orbitalGravity.preset_leo'),
    instruction: 'Select the Low Earth Orbit preset and observe the nearly constant circular speed and small orbital radius.',
    hint: 'Near Earth, satellites must travel at approximately 7.8 km/s to balance gravitational attraction.',
  },
  {
    id: 'step-2',
    title: t('orbitalGravity.preset_molniya'),
    instruction: 'Select the Molniya preset and watch the satellite dramatically accelerate at periapsis and linger at apoapsis.',
    hint: 'Kepler\'s second law ensures equal areas swept in equal time, so craft move much slower at the distant apoapsis.',
  },
  {
    id: 'step-3',
    title: 'Real Atmospheric Drag',
    instruction: 'Switch to Real mode and notice how trace atmospheric friction at perigee causes orbital decay and shrinkage.',
    hint: 'As the spacecraft slows down at periapsis, the apoapsis drops first, circularizing and lowering the orbit.',
  },
]);

const calculatedResults = computed(() => ({
  period: currentState.value.period,
  vPeriapsis: currentState.value.vPeriapsis,
  vApoapsis: currentState.value.vApoapsis,
  periapsis: currentState.value.periapsis,
  apoapsis: currentState.value.apoapsis,
}));

const reportResultsRows = computed(() => [
  {
    name: t('orbitalGravity.orbitalPeriod'),
    simulated: `${(currentState.value.period / 3600).toFixed(2)} h`,
    theoretical: `${(currentState.value.period / 3600).toFixed(2)} h`,
  },
  {
    name: t('orbitalGravity.vPeriapsis'),
    simulated: `${(currentState.value.vPeriapsis / 1000).toFixed(2)} km/s`,
    theoretical: `${(currentState.value.vPeriapsis / 1000).toFixed(2)} km/s`,
  },
  {
    name: t('orbitalGravity.vApoapsis'),
    simulated: `${(currentState.value.vApoapsis / 1000).toFixed(2)} km/s`,
    theoretical: `${(currentState.value.vApoapsis / 1000).toFixed(2)} km/s`,
  },
  {
    name: t('orbitalGravity.periapsis'),
    simulated: `${(currentState.value.periapsis / 1000).toLocaleString()} km`,
    theoretical: `${(currentState.value.periapsis / 1000).toLocaleString()} km`,
  },
  {
    name: t('orbitalGravity.apoapsis'),
    simulated: `${(currentState.value.apoapsis / 1000).toLocaleString()} km`,
    theoretical: `${(currentState.value.apoapsis / 1000).toLocaleString()} km`,
  },
]);

const reportVariablesList = computed(() => [
  { name: t('orbitalGravity.semiMajorAxis'), symbol: 'a', value: uiParams.semiMajorAxis, unit: 'km' },
  { name: t('orbitalGravity.eccentricity'), symbol: 'e', value: uiParams.eccentricity, unit: '' },
  { name: t('orbitalGravity.primaryMassFactor'), symbol: 'M', value: uiParams.primaryMassFactor, unit: 'M⊕' },
  { name: t('orbitalGravity.satelliteMass'), symbol: 'm', value: uiParams.satelliteMass, unit: 'kg' },
]);

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/motion/orbital-gravity').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/motion/orbital-gravity',
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
    const existing = await db.notes.where('experimentId').equals('physics/motion/orbital-gravity').first();
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
.orbital-experiment {
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
