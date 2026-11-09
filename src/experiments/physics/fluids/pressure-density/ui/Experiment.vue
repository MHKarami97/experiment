<template>
  <div class="fluid-pressure-experiment">
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
          <PressureCanvas
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

          <!-- Chamber & Fluid Mode -->
          <VariableGroup :title="$t('pressureDensity.tankConfig')">
            <div class="profile-selector-group">
              <label class="control-label">{{ $t('pressureDensity.tankMode') }}</label>
              <div class="profile-pill-list">
                <button
                  type="button"
                  class="profile-pill-btn"
                  :class="{ active: uiParams.tankModeIndex === 0 }"
                  @click="uiParams.tankModeIndex = 0; onParamChange()"
                >
                  {{ $t('pressureDensity.modeTank') }}
                </button>
                <button
                  type="button"
                  class="profile-pill-btn"
                  :class="{ active: uiParams.tankModeIndex === 1 }"
                  @click="uiParams.tankModeIndex = 1; onParamChange()"
                >
                  {{ $t('pressureDensity.modeUTube') }}
                </button>
              </div>
            </div>

            <div class="profile-selector-group">
              <label class="control-label">{{ $t('pressureDensity.fluidType') }}</label>
              <div class="profile-pill-list vertical-pills">
                <button
                  v-for="(fluidName, idx) in fluidOptions"
                  :key="idx"
                  type="button"
                  class="profile-pill-btn"
                  :class="{ active: uiParams.fluidTypeIndex === idx }"
                  @click="uiParams.fluidTypeIndex = idx; onParamChange()"
                >
                  {{ fluidName }}
                </button>
              </div>
            </div>
          </VariableGroup>

          <!-- Hydrostatic Depth & Environment Variables -->
          <VariableGroup :title="$t('pressureDensity.controlsTitle')">
            <UnitSlider
              id="probeDepth"
              v-model="uiParams.probeDepth"
              :label="$t('pressureDensity.probeDepth')"
              unit="m"
              :min="0.0"
              :max="4.5"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="gravity"
              v-model="uiParams.gravity"
              :label="$t('pressureDensity.gravity')"
              unit="m/s²"
              :min="1.6"
              :max="25.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <div class="profile-selector-group">
              <label class="control-label">{{ $t('pressureDensity.includeAtmosphere') }}</label>
              <div class="profile-pill-list">
                <button
                  type="button"
                  class="profile-pill-btn"
                  :class="{ active: uiParams.includeAtmosphere === 1 }"
                  @click="uiParams.includeAtmosphere = 1; onParamChange()"
                >
                  {{ $t('pressureDensity.pressAbsolute') }}
                </button>
                <button
                  type="button"
                  class="profile-pill-btn"
                  :class="{ active: uiParams.includeAtmosphere === 0 }"
                  @click="uiParams.includeAtmosphere = 0; onParamChange()"
                >
                  {{ $t('pressureDensity.pressGauge') }}
                </button>
              </div>
            </div>
            <UnitSlider
              v-if="mode === 'real'"
              id="temperature"
              v-model="uiParams.temperature"
              :label="$t('pressureDensity.temperature')"
              unit="°C"
              :min="0"
              :max="90"
              :step="1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slot Management -->
          <SlotManager
            experiment-id="physics/fluids/pressure-density"
            :current-params="uiParams"
            :current-mode="mode"
            @load="onLoadSlot"
          />
        </div>
      </aside>
    </div>

    <!-- Mobile Drawer for Controls -->
    <BottomSheet class="mobile-only" :title="$t('common.controls')">
      <PresetPicker
        :presets="presetOptions"
        :current-preset="currentPresetId"
        @select="applyPreset"
      />

      <VariableGroup :title="$t('pressureDensity.tankConfig')">
        <div class="profile-selector-group">
          <label class="control-label">{{ $t('pressureDensity.tankMode') }}</label>
          <div class="profile-pill-list">
            <button
              type="button"
              class="profile-pill-btn"
              :class="{ active: uiParams.tankModeIndex === 0 }"
              @click="uiParams.tankModeIndex = 0; onParamChange()"
            >
              {{ $t('pressureDensity.modeTank') }}
            </button>
            <button
              type="button"
              class="profile-pill-btn"
              :class="{ active: uiParams.tankModeIndex === 1 }"
              @click="uiParams.tankModeIndex = 1; onParamChange()"
            >
              {{ $t('pressureDensity.modeUTube') }}
            </button>
          </div>
        </div>

        <div class="profile-selector-group">
          <label class="control-label">{{ $t('pressureDensity.fluidType') }}</label>
          <div class="profile-pill-list vertical-pills">
            <button
              v-for="(fluidName, idx) in fluidOptions"
              :key="idx"
              type="button"
              class="profile-pill-btn"
              :class="{ active: uiParams.fluidTypeIndex === idx }"
              @click="uiParams.fluidTypeIndex = idx; onParamChange()"
            >
              {{ fluidName }}
            </button>
          </div>
        </div>
      </VariableGroup>

      <VariableGroup :title="$t('pressureDensity.controlsTitle')">
        <UnitSlider
          id="probeDepth-mobile"
          v-model="uiParams.probeDepth"
          :label="$t('pressureDensity.probeDepth')"
          unit="m"
          :min="0.0"
          :max="4.5"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="gravity-mobile"
          v-model="uiParams.gravity"
          :label="$t('pressureDensity.gravity')"
          unit="m/s²"
          :min="1.6"
          :max="25.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <div class="profile-selector-group">
          <label class="control-label">{{ $t('pressureDensity.includeAtmosphere') }}</label>
          <div class="profile-pill-list">
            <button
              type="button"
              class="profile-pill-btn"
              :class="{ active: uiParams.includeAtmosphere === 1 }"
              @click="uiParams.includeAtmosphere = 1; onParamChange()"
            >
              {{ $t('pressureDensity.pressAbsolute') }}
            </button>
            <button
              type="button"
              class="profile-pill-btn"
              :class="{ active: uiParams.includeAtmosphere === 0 }"
              @click="uiParams.includeAtmosphere = 0; onParamChange()"
            >
              {{ $t('pressureDensity.pressGauge') }}
            </button>
          </div>
        </div>
        <UnitSlider
          v-if="mode === 'real'"
          id="temperature-mobile"
          v-model="uiParams.temperature"
          :label="$t('pressureDensity.temperature')"
          unit="°C"
          :min="0"
          :max="90"
          :step="1"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/fluids/pressure-density"
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
        <!-- Tab 1: Live Depth vs Pressure Graph -->
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

        <!-- Tab 3: Theory & Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel">
          <FormulaPanel
            :title="$t('pressureDensity.tabTheory')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('pressureDensity.theoryContent') }}</p>
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
        :title="$t('experiments.pressureDensity.title')"
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
  createFluidPressureModel,
  stepFluidPressureModel,
  type FluidPressureParams,
  type FluidPressureState,
  type FluidType,
  type TankMode,
} from '../model/fluidPressure';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { fluidPressureConfig } from '../config';

// Shared Components & Types
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
import PressureCanvas from '../view/PressureCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();

const canvasViewRef = ref<InstanceType<typeof PressureCanvas> | null>(null);

// Simulation Controls
const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('deepWaterTank');
const userNotes = ref<string>('');

// UI Model Parameters
const uiParams = reactive({
  tankModeIndex: 0,
  fluidTypeIndex: 0,
  probeDepth: 2.0,
  gravity: 9.8,
  includeAtmosphere: 1,
  temperature: 20,
});

const fluidTypes: FluidType[] = ['water', 'gasoline', 'seawater', 'honey', 'mercury'];

const fluidOptions = computed(() => [
  t('pressureDensity.fluidWater'),
  t('pressureDensity.fluidGasoline'),
  t('pressureDensity.fluidSeawater'),
  t('pressureDensity.fluidHoney'),
  t('pressureDensity.fluidMercury'),
]);

const internalParams = computed<FluidPressureParams>(() => {
  const currentFluid = fluidTypes[uiParams.fluidTypeIndex] || 'water';
  const tankMode: TankMode = uiParams.tankModeIndex === 1 ? 'u-tube' : 'tank';
  const isReal = mode.value === 'real';

  return {
    tankMode,
    fluidType: currentFluid,
    customDensity: 1000,
    fluid2Density: 13600, // Mercury as opposing dense fluid in U-tube
    gravity: uiParams.gravity,
    probeDepth: uiParams.probeDepth,
    atmosphericPressure: 101325,
    includeAtmosphere: uiParams.includeAtmosphere === 1,
    temperature: uiParams.temperature,
    sensorNoiseLevel: isReal ? 120 : 0, // 120 Pa transducer noise in real mode
    isRealMode: isReal,
  };
});

// Simulation State
const currentState = ref<FluidPressureState>(createFluidPressureModel(internalParams.value));

// Preset Definitions
const presetOptions = computed<PresetOption[]>(() => {
  return (fluidPressureConfig.presets || []).map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }));
});

// Tabs
const bottomTabs = computed(() => [
  { id: 'graph', label: t('common.graph') },
  { id: 'table', label: t('common.table') },
  { id: 'theory', label: t('pressureDensity.tabTheory') },
  { id: 'notes', label: t('common.notes') },
  { id: 'guided', label: t('common.guided') },
]);

// Guided Steps
const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step-1',
    title: t('experiments.pressureDensity.title'),
    instruction: t('pressureDensity.hydrostaticExpl'),
    hint: 'P = P0 + rho * g * h',
  },
  {
    id: 'step-2',
    title: t('pressureDensity.fluidType'),
    instruction: t('pressureDensity.fluidType_desc'),
    hint: 'Select denser fluids like Mercury (13600 kg/m³) to observe higher pressures.',
  },
  {
    id: 'step-3',
    title: t('pressureDensity.probeDepth'),
    instruction: t('pressureDensity.probeDepth_desc'),
    hint: 'Submerge the probe deeper to observe linear pressure increase.',
  },
  {
    id: 'step-4',
    title: t('pressureDensity.tabTheory'),
    instruction: t('pressureDensity.theoryContent'),
  },
]);

// Formulas
const formulaItems = computed<FormulaItem[]>(() => [
  {
    title: t('pressureDensity.formula_hydrostatic'),
    latex: 'P = P_0 + \\rho g h',
    explanation: t('pressureDensity.hydrostaticExpl'),
    liveValue: `P = ${(currentState.value.absolutePressure / 1000).toFixed(2)} \\text{ kPa}`,
  },
  {
    title: t('pressureDensity.formula_gauge'),
    latex: 'P_{\\text{gauge}} = \\rho g h = P - P_0',
    explanation: t('pressureDensity.gaugeExpl'),
    liveValue: `P_{\\text{gauge}} = ${(currentState.value.gaugePressure / 1000).toFixed(2)} \\text{ kPa}`,
  },
  {
    title: t('pressureDensity.formula_uTube'),
    latex: '\\rho_1 h_1 = \\rho_2 h_2 \\implies h_2 = h_1 \\frac{\\rho_1}{\\rho_2}',
    explanation: t('pressureDensity.uTubeExpl'),
    liveValue: `\\Delta h = ${currentState.value.manometerDeltaH.toFixed(2)} \\text{ m}`,
  },
  {
    title: t('pressureDensity.formula_thermalExp'),
    latex: '\\rho(T) = \\frac{\\rho_0}{1 + \\beta \\Delta T}',
    explanation: t('pressureDensity.thermalExpExpl'),
    liveValue: `\\rho = ${currentState.value.density.toFixed(1)} \\text{ kg/m}^3`,
  },
]);

// Data Series for Live Graph and Table
const series = reactive<DataSeries>({
  t: [0],
  x: [currentState.value.depth],
  y: [Number((currentState.value.measuredPressure / 1000).toFixed(2))],
  vx: [Number((currentState.value.gaugePressure / 1000).toFixed(2))],
  vy: [Number((currentState.value.absolutePressure / 1000).toFixed(2))],
  v: [currentState.value.density],
});

const comparisonRuns = ref<ComparisonRun[]>([]);

// Report Data
const calculatedResults = computed(() => ({
  depth: currentState.value.depth,
  effectiveDensity: currentState.value.density,
  gaugePressure: currentState.value.gaugePressure,
  absolutePressure: currentState.value.absolutePressure,
  measuredPressure: currentState.value.measuredPressure,
  manometerDeltaH: currentState.value.manometerDeltaH,
}));

const reportResultsRows = computed(() => [
  {
    name: t('pressureDensity.depth'),
    simulated: `${currentState.value.depth.toFixed(2)} m`,
  },
  {
    name: t('pressureDensity.effectiveDensity'),
    simulated: `${currentState.value.density.toFixed(1)} kg/m³`,
  },
  {
    name: t('pressureDensity.gaugePressure'),
    simulated: `${(currentState.value.gaugePressure / 1000).toFixed(2)} kPa`,
  },
  {
    name: t('pressureDensity.absolutePressure'),
    simulated: `${(currentState.value.absolutePressure / 1000).toFixed(2)} kPa`,
  },
  {
    name: t('pressureDensity.measuredPressure'),
    simulated: `${(currentState.value.measuredPressure / 1000).toFixed(2)} kPa`,
  },
  {
    name: t('pressureDensity.manometerDeltaH'),
    simulated: `${currentState.value.manometerDeltaH.toFixed(2)} m`,
  },
]);

const reportVariablesList = computed(() => [
  {
    name: t('pressureDensity.tankMode'),
    symbol: 'Mode',
    value: uiParams.tankModeIndex === 0 ? t('pressureDensity.modeTank') : t('pressureDensity.modeUTube'),
    unit: '',
  },
  {
    name: t('pressureDensity.fluidType'),
    symbol: 'Fluid',
    value: fluidOptions.value[uiParams.fluidTypeIndex] || 'Water',
    unit: '',
  },
  {
    name: t('pressureDensity.probeDepth'),
    symbol: 'h',
    value: uiParams.probeDepth.toFixed(1),
    unit: 'm',
  },
  {
    name: t('pressureDensity.gravity'),
    symbol: 'g',
    value: uiParams.gravity.toFixed(1),
    unit: 'm/s²',
  },
  {
    name: t('pressureDensity.includeAtmosphere'),
    symbol: 'P₀',
    value: uiParams.includeAtmosphere === 1 ? t('pressureDensity.pressAbsolute') : t('pressureDensity.pressGauge'),
    unit: '',
  },
  {
    name: t('pressureDensity.temperature'),
    symbol: 'T',
    value: uiParams.temperature,
    unit: '°C',
  },
]);

// Physics Accumulator Engine
let accumulator: PhysicsAccumulator | null = null;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.05,
    onPhysicsStep: (dt: number) => {
      currentState.value = stepFluidPressureModel(currentState.value, internalParams.value, dt * speed.value);
      recordDataPoint();
    },
    onRenderStep: () => {},
  });
}

function recordDataPoint() {
  const maxSamples = 200;
  const time = Number(currentState.value.t.toFixed(2));
  const depth = Number(currentState.value.depth.toFixed(2));
  const measured = Number((currentState.value.measuredPressure / 1000).toFixed(2));
  const gauge = Number((currentState.value.gaugePressure / 1000).toFixed(2));
  const abs = Number((currentState.value.absolutePressure / 1000).toFixed(2));
  const rho = Number(currentState.value.density.toFixed(1));

  series.t.push(time);
  series.x.push(depth);
  series.y.push(measured);
  series.vx.push(gauge);
  series.vy.push(abs);
  series.v.push(rho);

  if (series.t.length > maxSamples) {
    series.t.shift();
    series.x.shift();
    series.y.shift();
    series.vx.shift();
    series.vy.shift();
    series.v.shift();
  }
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
  currentState.value = stepFluidPressureModel(currentState.value, internalParams.value, 0.05);
  recordDataPoint();
}

function resetSimulation() {
  pauseSimulation();
  currentState.value = createFluidPressureModel(internalParams.value);
  series.t = [0];
  series.x = [currentState.value.depth];
  series.y = [Number((currentState.value.measuredPressure / 1000).toFixed(2))];
  series.vx = [Number((currentState.value.gaugePressure / 1000).toFixed(2))];
  series.vy = [Number((currentState.value.absolutePressure / 1000).toFixed(2))];
  series.v = [currentState.value.density];
}

function setSpeed(newSpeed: number) {
  speed.value = newSpeed;
}

function setMode(newMode: 'ideal' | 'real') {
  mode.value = newMode;
  onParamChange();
}

function onParamChange() {
  currentState.value = createFluidPressureModel(internalParams.value);
  recordDataPoint();
}

function applyPreset(preset: PresetOption) {
  currentPresetId.value = preset.id;
  if (preset.params) {
    Object.assign(uiParams, preset.params);
  }
  resetSimulation();
}

function onLoadSlot(slot: StoredSlot) {
  if (!slot.params) return;
  Object.assign(uiParams, slot.params);
  if (slot.mode) mode.value = slot.mode;
  resetSimulation();
}

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/fluids/pressure-density').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/fluids/pressure-density',
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    }
    store.showToast(t('common.save'), 'success');
  } catch (err) {
    console.error('Failed to save notes:', err);
  }
}

async function loadNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/fluids/pressure-density').first();
    if (existing) {
      userNotes.value = existing.content;
    }
  } catch (err) {
    console.error('Failed to load notes:', err);
  }
}

onMounted(() => {
  initLoop();
  resetSimulation();
  loadNotes();
});

onBeforeUnmount(() => {
  if (accumulator) {
    accumulator.destroy();
  }
});
</script>

<style scoped>
.fluid-pressure-experiment {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
  width: 100%;
}

.experiment-workspace {
  display: grid;
  grid-template-columns: 1fr 340px;
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
  background-color: var(--bg-scene, #0f172a);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.control-sidebar {
  width: 340px;
  flex-shrink: 0;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg, 12px);
  padding: var(--space-4, 16px);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 580px;
}

.sidebar-header {
  padding-bottom: var(--space-3, 12px);
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding-top: var(--space-3, 12px);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.profile-selector-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.control-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.profile-pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.profile-pill-list.vertical-pills {
  flex-direction: column;
}

.profile-pill-btn {
  flex: 1;
  min-width: 90px;
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.profile-pill-list.vertical-pills .profile-pill-btn {
  text-align: start;
}

.profile-pill-btn:hover {
  background: var(--surface-hover);
  border-color: #38bdf8;
  color: var(--text-primary);
}

.profile-pill-btn.active {
  background: #0284c7;
  border-color: #38bdf8;
  color: #ffffff;
  font-weight: 600;
}

.bottom-tabs-section {
  width: 100%;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.tabs-nav {
  display: flex;
  gap: var(--space-2, 8px);
  padding: var(--space-2, 8px) var(--space-4, 16px);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-hover);
  overflow-x: auto;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--surface-active);
}

.tab-btn.active {
  color: var(--color-physics, #0284c7);
  background: var(--surface-card);
  font-weight: 600;
}

.tab-content-area {
  padding: var(--space-4, 16px);
  min-height: 280px;
}

.tab-panel {
  width: 100%;
  height: 100%;
}

.theory-prose {
  margin-top: var(--space-4, 16px);
  padding: var(--space-4, 16px);
  background: var(--surface-hover);
  border-radius: var(--radius-md, 8px);
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-secondary);
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
  color: var(--text-primary);
}

.btn-save-note {
  padding: 6px 14px;
  background: var(--color-physics, #0284c7);
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
  border: 1px solid var(--border-subtle);
  background: var(--surface-input);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
}

@media (max-width: 1023px) {
  .experiment-workspace {
    grid-template-columns: 1fr;
  }
  .canvas-mount {
    height: clamp(300px, 45vh, 440px);
  }
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
