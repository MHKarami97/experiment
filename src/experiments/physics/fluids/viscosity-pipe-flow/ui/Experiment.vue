<template>
  <div class="viscosity-pipe-experiment">
    <!-- Top Global Toolbar -->
    <Toolbar
      :is-running="isRunning"
      :speed="speed"
      :mode="mode"
      :show-ruler="showRuler"
      :show-stopwatch="showStopwatch"
      @toggle-running="togglePlay"
      @reset="resetSimulation"
      @step="stepSimulation"
      @update:speed="setSpeed"
      @update:mode="setMode"
      @toggle-ruler="showRuler = !showRuler"
      @toggle-stopwatch="showStopwatch = !showStopwatch"
      @open-export="showExportModal = true"
    />

    <!-- Main Workspace: Visual Simulation + Controls Sidebar -->
    <div class="experiment-workspace">
      <!-- Left/Center: Visual Scene Mount -->
      <div class="scene-container">
        <div class="canvas-mount">
          <ViscosityCanvas
            ref="canvasViewRef"
            :state="currentState"
            :params="internalParams"
          />

          <!-- Floating Overlaid Measurement Tool Widgets -->
          <RulerWidget v-if="showRuler" :visible="showRuler" @close="showRuler = false" />
          <StopwatchWidget v-if="showStopwatch" :visible="showStopwatch" @close="showStopwatch = false" />
        </div>
      </div>

      <!-- Right/Side: Controls & Parameter Sidebar (Desktop) -->
      <aside class="control-sidebar desktop-only glass-panel">
        <div class="sidebar-header">
          <h3>{{ $t('common.controls') }}</h3>
        </div>

        <div class="sidebar-scroll">
          <!-- Preset Selector -->
          <PresetPicker
            :presets="presetOptions"
            :current-preset="currentPresetId"
            @select="applyPreset"
          />

          <!-- Fluid Substance Selector -->
          <div class="profile-selector-group">
            <label class="control-label">{{ $t('viscosityPipe.fluidType') }}</label>
            <div class="profile-pill-list">
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

          <!-- Pressure & Geometry Controls -->
          <VariableGroup :title="$t('viscosityPipe.pressureDiff')">
            <UnitSlider
              id="pressureDiff"
              v-model="uiParams.pressureDiff"
              :label="$t('viscosityPipe.pressureDiff')"
              unit="Pa"
              :min="50"
              :max="5000"
              :step="50"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="pipeDiameter"
              v-model="uiParams.pipeDiameter"
              :label="$t('viscosityPipe.pipeDiameter')"
              unit="cm"
              :min="1.0"
              :max="10.0"
              :step="0.5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="pipeLength"
              v-model="uiParams.pipeLength"
              :label="$t('viscosityPipe.pipeLength')"
              unit="m"
              :min="0.5"
              :max="5.0"
              :step="0.25"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Temperature & Wall Friction -->
          <VariableGroup :title="$t('viscosityPipe.temperature')">
            <UnitSlider
              id="temperatureC"
              v-model="uiParams.temperatureC"
              :label="$t('viscosityPipe.temperature')"
              unit="°C"
              :min="5"
              :max="95"
              :step="1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="mode === 'real'"
              id="wallRoughnessMm"
              v-model="uiParams.wallRoughnessMm"
              :label="$t('viscosityPipe.wallRoughness')"
              unit="mm"
              :min="0.0"
              :max="0.5"
              :step="0.01"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slot Save/Load Persistence -->
          <SlotManager
            experiment-id="physics/fluids/viscosity-pipe-flow"
            :current-params="uiParams"
            :current-mode="mode"
            @load="onLoadSlot"
          />
        </div>
      </aside>
    </div>

    <!-- Mobile Draggable Bottom Sheet for Controls -->
    <BottomSheet :title="$t('common.controls')" class="mobile-only">
      <PresetPicker
        :presets="presetOptions"
        :current-preset="currentPresetId"
        @select="applyPreset"
      />

      <div class="profile-selector-group">
        <label class="control-label">{{ $t('viscosityPipe.fluidType') }}</label>
        <div class="profile-pill-list">
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

      <VariableGroup :title="$t('viscosityPipe.pressureDiff')">
        <UnitSlider
          id="pressureDiff-mobile"
          v-model="uiParams.pressureDiff"
          :label="$t('viscosityPipe.pressureDiff')"
          unit="Pa"
          :min="50"
          :max="5000"
          :step="50"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="pipeDiameter-mobile"
          v-model="uiParams.pipeDiameter"
          :label="$t('viscosityPipe.pipeDiameter')"
          unit="cm"
          :min="1.0"
          :max="10.0"
          :step="0.5"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="pipeLength-mobile"
          v-model="uiParams.pipeLength"
          :label="$t('viscosityPipe.pipeLength')"
          unit="m"
          :min="0.5"
          :max="5.0"
          :step="0.25"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="temperatureC-mobile"
          v-model="uiParams.temperatureC"
          :label="$t('viscosityPipe.temperature')"
          unit="°C"
          :min="5"
          :max="95"
          :step="1"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/fluids/viscosity-pipe-flow"
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

        <!-- Tab 3: Theory & Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel">
          <FormulaPanel
            :title="$t('viscosityPipe.tabTheory')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('viscosityPipe.theoryContent') }}</p>
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
        :title="$t('experiments.viscosityPipe.title')"
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
  createViscosityModel,
  stepViscosityModel,
  type ViscosityParams,
  type ViscosityState,
  type FluidType,
} from '../model/viscosity-pipe';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { viscosityPipeConfig } from '../config';

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
import ViscosityCanvas from '../view/ViscosityCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();

const canvasViewRef = ref<InstanceType<typeof ViscosityCanvas> | null>(null);

// Simulation Controls
const isRunning = ref(true);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('waterTransition');
const userNotes = ref<string>('');

// UI Model Parameters
const uiParams = reactive({
  fluidTypeIndex: 0, // 0: water, 1: motor-oil, 2: glycerin, 3: honey, 4: air
  pressureDiff: 600,
  pipeDiameter: 3.0, // cm
  pipeLength: 2.0, // m
  temperatureC: 20, // °C
  wallRoughnessMm: 0.02, // mm
});

const fluidTypes: FluidType[] = ['water', 'motor-oil', 'glycerin', 'honey', 'air'];

const fluidOptions = computed(() => [
  t('viscosityPipe.fluidWater'),
  t('viscosityPipe.fluidMotorOil'),
  t('viscosityPipe.fluidGlycerin'),
  t('viscosityPipe.fluidHoney'),
  t('viscosityPipe.fluidAir'),
]);

const internalParams = computed<ViscosityParams>(() => {
  const isReal = mode.value === 'real';
  const fType = fluidTypes[uiParams.fluidTypeIndex] || 'water';

  return {
    fluidType: fType,
    pressureDiff: uiParams.pressureDiff,
    pipeDiameter: uiParams.pipeDiameter / 100, // cm to m
    pipeLength: uiParams.pipeLength,
    temperatureC: uiParams.temperatureC,
    wallRoughnessMm: isReal ? uiParams.wallRoughnessMm : 0,
    isRealMode: isReal,
  };
});

// Simulation State
const currentState = ref<ViscosityState>(createViscosityModel(internalParams.value));

// Preset Definitions
const presetOptions = computed<PresetOption[]>(() => {
  return (viscosityPipeConfig.presets || []).map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }));
});

// Tabs
const bottomTabs = computed(() => [
  { id: 'graph', label: t('common.graph') },
  { id: 'table', label: t('common.table') },
  { id: 'theory', label: t('viscosityPipe.tabTheory') },
  { id: 'notes', label: t('common.notes') },
  { id: 'guided', label: t('common.guided') },
]);

// Guided Steps
const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step-1',
    title: t('viscosityPipe.formula_poiseuille'),
    instruction: t('viscosityPipe.theoryContent'),
    hint: 'Q scales with R^4: doubling pipe diameter increases flow rate by 16 times!',
  },
  {
    id: 'step-2',
    title: t('viscosityPipe.formula_reynolds'),
    instruction: t('viscosityPipe.reynoldsExpl'),
    hint: 'Observe the Reynolds dye filament: straight line (Re < 2300) vs chaotic turbulence (Re > 4000).',
  },
  {
    id: 'step-3',
    title: t('viscosityPipe.temperature'),
    instruction: t('viscosityPipe.temperature_desc'),
    hint: 'Heat motor oil from 20 °C to 80 °C and watch the dramatic drop in viscosity and increase in flow rate.',
  },
]);

// KaTeX Formulas
const formulaItems = computed<FormulaItem[]>(() => [
  {
    title: t('viscosityPipe.formula_poiseuille'),
    latex: 'Q = \\frac{\\pi R^4 \\Delta P}{8 \\eta L}',
    explanation: t('viscosityPipe.poiseuilleExpl'),
    liveValue: `Q = ${(currentState.value.derived.volumeFlowRate * 1000).toFixed(2)} \\text{ L/s}`,
  },
  {
    title: t('viscosityPipe.formula_reynolds'),
    latex: 'Re = \\frac{\\rho v D}{\\eta}',
    explanation: t('viscosityPipe.reynoldsExpl'),
    liveValue: `Re = ${currentState.value.derived.reynoldsNumber.toFixed(0)} \\text{ (${currentState.value.derived.regime})}`,
  },
  {
    title: t('viscosityPipe.formula_velocityProfile'),
    latex: 'v(r) = v_{\\max} \\left(1 - \\frac{r^2}{R^2}\\right)',
    explanation: t('viscosityPipe.velocityProfileExpl'),
    liveValue: `v_{\\max} = ${currentState.value.derived.maxVelocity.toFixed(3)} \\text{ m/s}`,
  },
  {
    title: t('viscosityPipe.formula_wallStress'),
    latex: '\\tau_w = \\frac{\\Delta P \\cdot R}{2 L}',
    explanation: t('viscosityPipe.wallStressExpl'),
    liveValue: `\\tau_w = ${currentState.value.derived.wallShearStress.toFixed(1)} \\text{ Pa}`,
  },
]);

// Live Data Series for Graph and Table
const series = reactive<DataSeries>({
  t: [0],
  x: [0], // Re
  y: [0], // Q (L/s)
  vx: [0], // v_avg (m/s)
  vy: [0], // eta (mPa·s)
  v: [0], // tau_w (Pa)
});

const comparisonRuns = ref<ComparisonRun[]>([]);

// Report Data
const calculatedResults = computed(() => ({
  reynoldsNumber: currentState.value.derived.reynoldsNumber,
  flowRate: currentState.value.derived.volumeFlowRate,
  avgVelocity: currentState.value.derived.avgVelocity,
  viscosity: currentState.value.derived.dynamicViscosity,
  regime: currentState.value.derived.regime,
  shearStress: currentState.value.derived.wallShearStress,
}));

const reportResultsRows = computed(() => [
  { name: 'عدد رینولدز (Re)', simulated: `${currentState.value.derived.reynoldsNumber.toFixed(0)} (${currentState.value.derived.regime})` },
  { name: 'دبی حجمی (Q)', simulated: `${(currentState.value.derived.volumeFlowRate * 1000).toFixed(3)} L/s` },
  { name: 'سرعت متوسط (v_avg)', simulated: `${currentState.value.derived.avgVelocity.toFixed(3)} m/s` },
  { name: 'سرعت بیشینه مرکز (v_max)', simulated: `${currentState.value.derived.maxVelocity.toFixed(3)} m/s` },
  { name: 'گرانروی دینامیکی (η)', simulated: `${(currentState.value.derived.dynamicViscosity * 1000).toFixed(2)} mPa·s` },
  { name: 'تنش برشی دیواره (τ_w)', simulated: `${currentState.value.derived.wallShearStress.toFixed(1)} Pa` },
]);

const reportVariablesList = computed(() => [
  { name: t('viscosityPipe.fluidType'), symbol: 'Fluid', value: fluidOptions.value[uiParams.fluidTypeIndex] || '', unit: '' },
  { name: t('viscosityPipe.pressureDiff'), symbol: 'ΔP', value: uiParams.pressureDiff, unit: 'Pa' },
  { name: t('viscosityPipe.pipeDiameter'), symbol: 'D', value: uiParams.pipeDiameter, unit: 'cm' },
  { name: t('viscosityPipe.pipeLength'), symbol: 'L', value: uiParams.pipeLength, unit: 'm' },
  { name: t('viscosityPipe.temperature'), symbol: 'T', value: uiParams.temperatureC, unit: '°C' },
  { name: t('common.mode'), symbol: 'Mode', value: mode.value, unit: '' },
]);

// Physics Accumulator Engine
let accumulator: PhysicsAccumulator | null = null;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.05,
    onPhysicsStep: (dt: number) => {
      currentState.value = stepViscosityModel(currentState.value, internalParams.value, dt * speed.value);
      recordDataPoint();
    },
    onRenderStep: () => {},
  });
  if (isRunning.value) {
    accumulator.start();
  }
}

function recordDataPoint() {
  const maxSamples = 200;
  series.t.push(Number(currentState.value.t.toFixed(2)));
  series.x.push(Number(currentState.value.derived.reynoldsNumber.toFixed(0)));
  series.y.push(Number((currentState.value.derived.volumeFlowRate * 1000).toFixed(3)));
  series.vx.push(Number(currentState.value.derived.avgVelocity.toFixed(3)));
  series.vy.push(Number((currentState.value.derived.dynamicViscosity * 1000).toFixed(2)));
  series.v.push(Number(currentState.value.derived.wallShearStress.toFixed(1)));

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
  currentState.value = stepViscosityModel(currentState.value, internalParams.value, 0.05);
  recordDataPoint();
}

function resetSimulation() {
  pauseSimulation();
  currentState.value = createViscosityModel(internalParams.value);
  series.t = [0];
  series.x = [0];
  series.y = [0];
  series.vx = [0];
  series.vy = [0];
  series.v = [0];
}

function setSpeed(newSpeed: number) {
  speed.value = newSpeed;
}

function setMode(newMode: 'ideal' | 'real') {
  mode.value = newMode;
  onParamChange();
}

function onParamChange() {
  currentState.value = createViscosityModel(internalParams.value);
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
    const existing = await db.notes.where('experimentId').equals('physics/fluids/viscosity-pipe-flow').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/fluids/viscosity-pipe-flow',
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
    const existing = await db.notes.where('experimentId').equals('physics/fluids/viscosity-pipe-flow').first();
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
.viscosity-pipe-experiment {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  gap: var(--space-4, 16px);
  padding: var(--space-4, 16px);
  box-sizing: border-box;
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

.profile-pill-btn {
  flex: 1;
  min-width: 85px;
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
  white-space: nowrap;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--surface-hover);
}

.tab-btn.active {
  color: var(--color-physics, #0284c7);
  background: var(--surface-card);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.tab-content-area {
  padding: var(--space-4, 16px);
  min-height: 240px;
}

.tab-panel {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.theory-prose {
  padding: 1rem;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-secondary);
  white-space: pre-line;
}

.notes-tab {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 0.5rem;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notes-header h4 {
  margin: 0;
  color: var(--text-primary);
}

.btn-save-note {
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  background: #0284c7;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
}

.notes-textarea {
  flex: 1;
  width: 100%;
  min-height: 120px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 0.75rem;
  color: var(--text-primary);
  resize: vertical;
  font-family: inherit;
}

@media (max-width: 1023px) {
  .experiment-workspace {
    grid-template-columns: 1fr;
  }

  .canvas-mount {
    height: 380px;
  }

  .control-sidebar {
    display: none;
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
