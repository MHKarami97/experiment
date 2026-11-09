<template>
  <div class="buoyancy-experiment">
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
          <BuoyancyCanvas
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

          <!-- Material & Fluid Substances -->
          <VariableGroup :title="$t('buoyancy.apparatusConfig')">
            <div class="profile-selector-group">
              <label class="control-label">{{ $t('buoyancy.material') }}</label>
              <div class="profile-pill-list vertical-pills">
                <button
                  v-for="(matName, idx) in materialOptions"
                  :key="idx"
                  type="button"
                  class="profile-pill-btn"
                  :class="{ active: uiParams.materialIndex === idx }"
                  @click="uiParams.materialIndex = idx; onParamChange()"
                >
                  {{ matName }}
                </button>
              </div>
            </div>

            <div class="profile-selector-group">
              <label class="control-label">{{ $t('buoyancy.fluidType') }}</label>
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

          <!-- Volume & Suspension Setup -->
          <VariableGroup :title="$t('buoyancy.controlsTitle')">
            <UnitSlider
              id="blockVolumeLiters"
              v-model="uiParams.blockVolumeLiters"
              :label="$t('buoyancy.blockVolume')"
              unit="L"
              :min="0.2"
              :max="5.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="gravity"
              v-model="uiParams.gravity"
              :label="$t('buoyancy.gravity')"
              unit="m/s²"
              :min="1.6"
              :max="25.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <div class="profile-selector-group">
              <label class="control-label">{{ $t('buoyancy.tetherMode') }}</label>
              <div class="profile-pill-list">
                <button
                  type="button"
                  class="profile-pill-btn"
                  :class="{ active: uiParams.tetherMode === 0 }"
                  @click="uiParams.tetherMode = 0; onParamChange()"
                >
                  {{ $t('buoyancy.modeFreeFloat') }}
                </button>
                <button
                  type="button"
                  class="profile-pill-btn"
                  :class="{ active: uiParams.tetherMode === 1 }"
                  @click="uiParams.tetherMode = 1; onParamChange()"
                >
                  {{ $t('buoyancy.modeSuspended') }}
                </button>
              </div>
            </div>
            <UnitSlider
              v-if="uiParams.tetherMode === 1"
              id="suspensionDepth"
              v-model="uiParams.suspensionDepth"
              :label="$t('buoyancy.suspensionDepth')"
              unit="m"
              :min="0.0"
              :max="0.8"
              :step="0.05"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slot Management -->
          <SlotManager
            experiment-id="physics/fluids/buoyancy-archimedes"
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

      <VariableGroup :title="$t('buoyancy.apparatusConfig')">
        <div class="profile-selector-group">
          <label class="control-label">{{ $t('buoyancy.material') }}</label>
          <div class="profile-pill-list vertical-pills">
            <button
              v-for="(matName, idx) in materialOptions"
              :key="idx"
              type="button"
              class="profile-pill-btn"
              :class="{ active: uiParams.materialIndex === idx }"
              @click="uiParams.materialIndex = idx; onParamChange()"
            >
              {{ matName }}
            </button>
          </div>
        </div>

        <div class="profile-selector-group">
          <label class="control-label">{{ $t('buoyancy.fluidType') }}</label>
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

      <VariableGroup :title="$t('buoyancy.controlsTitle')">
        <UnitSlider
          id="blockVolumeLiters-mobile"
          v-model="uiParams.blockVolumeLiters"
          :label="$t('buoyancy.blockVolume')"
          unit="L"
          :min="0.2"
          :max="5.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="gravity-mobile"
          v-model="uiParams.gravity"
          :label="$t('buoyancy.gravity')"
          unit="m/s²"
          :min="1.6"
          :max="25.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <div class="profile-selector-group">
          <label class="control-label">{{ $t('buoyancy.tetherMode') }}</label>
          <div class="profile-pill-list">
            <button
              type="button"
              class="profile-pill-btn"
              :class="{ active: uiParams.tetherMode === 0 }"
              @click="uiParams.tetherMode = 0; onParamChange()"
            >
              {{ $t('buoyancy.modeFreeFloat') }}
            </button>
            <button
              type="button"
              class="profile-pill-btn"
              :class="{ active: uiParams.tetherMode === 1 }"
              @click="uiParams.tetherMode = 1; onParamChange()"
            >
              {{ $t('buoyancy.modeSuspended') }}
            </button>
          </div>
        </div>
        <UnitSlider
          v-if="uiParams.tetherMode === 1"
          id="suspensionDepth-mobile"
          v-model="uiParams.suspensionDepth"
          :label="$t('buoyancy.suspensionDepth')"
          unit="m"
          :min="0.0"
          :max="0.8"
          :step="0.05"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/fluids/buoyancy-archimedes"
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
            :title="$t('buoyancy.tabTheory')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('buoyancy.theoryContent') }}</p>
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
        :title="$t('experiments.buoyancy.title')"
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
  createBuoyancyModel,
  stepBuoyancyModel,
  type BuoyancyParams,
  type BuoyancyState,
  type BlockMaterial,
  type FluidSubstance,
} from '../model/buoyancy';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { buoyancyConfig } from '../config';

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
import BuoyancyCanvas from '../view/BuoyancyCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();

const canvasViewRef = ref<InstanceType<typeof BuoyancyCanvas> | null>(null);

// Simulation Controls
const isRunning = ref(true);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('floatingWood');
const userNotes = ref<string>('');

// UI Model Parameters
const uiParams = reactive({
  materialIndex: 1, // pine
  fluidTypeIndex: 0, // water
  blockVolumeLiters: 1.5,
  gravity: 9.8,
  tetherMode: 0,
  suspensionDepth: 0.2,
});

const materials: BlockMaterial[] = ['wood-balsa', 'wood-pine', 'ice', 'aluminum', 'iron', 'lead'];
const fluids: FluidSubstance[] = ['water', 'gasoline', 'seawater', 'honey', 'mercury'];

const materialOptions = computed(() => [
  t('buoyancy.matBalsa'),
  t('buoyancy.matPine'),
  t('buoyancy.matIce'),
  t('buoyancy.matAluminum'),
  t('buoyancy.matIron'),
  t('buoyancy.matLead'),
]);

const fluidOptions = computed(() => [
  t('buoyancy.fluidWater'),
  t('buoyancy.fluidGasoline'),
  t('buoyancy.fluidSeawater'),
  t('buoyancy.fluidHoney'),
  t('buoyancy.fluidMercury'),
]);

const internalParams = computed<BuoyancyParams>(() => {
  const currentMaterial = materials[uiParams.materialIndex] || 'wood-pine';
  const currentFluid = fluids[uiParams.fluidTypeIndex] || 'water';
  const isReal = mode.value === 'real';

  return {
    material: currentMaterial,
    customBlockDensity: 600,
    fluidType: currentFluid,
    blockVolume: uiParams.blockVolumeLiters / 1000, // L to m^3
    blockCrossSection: 0.015,
    gravity: uiParams.gravity,
    fluidViscosity: isReal ? 0.05 : 0.001,
    sensorNoiseLevel: isReal ? 0.15 : 0, // 0.15 N scale noise in real mode
    isRealMode: isReal,
    tetherAttached: uiParams.tetherMode === 1,
    suspensionHeight: -uiParams.suspensionDepth,
  };
});

// Simulation State
const currentState = ref<BuoyancyState>(createBuoyancyModel(internalParams.value));

// Preset Definitions
const presetOptions = computed<PresetOption[]>(() => {
  return (buoyancyConfig.presets || []).map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }));
});

// Tabs
const bottomTabs = computed(() => [
  { id: 'graph', label: t('common.graph') },
  { id: 'table', label: t('common.table') },
  { id: 'theory', label: t('buoyancy.tabTheory') },
  { id: 'notes', label: t('common.notes') },
  { id: 'guided', label: t('common.guided') },
]);

// Guided Steps
const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step-1',
    title: t('experiments.buoyancy.title'),
    instruction: t('buoyancy.archimedesExpl'),
    hint: 'Fb = rho_fluid * V_sub * g',
  },
  {
    id: 'step-2',
    title: t('buoyancy.tetherMode'),
    instruction: t('buoyancy.tetherMode_desc'),
    hint: 'Switch to Suspended mode to observe Apparent Weight reduction on the spring scale.',
  },
  {
    id: 'step-3',
    title: t('buoyancy.preset_mercuryIronFloat'),
    instruction: t('buoyancy.floatingExpl'),
    hint: 'Select Iron in Liquid Mercury to observe dense iron floating like a cork!',
  },
  {
    id: 'step-4',
    title: t('buoyancy.tabTheory'),
    instruction: t('buoyancy.theoryContent'),
  },
]);

// Formulas
const formulaItems = computed<FormulaItem[]>(() => [
  {
    title: t('buoyancy.formula_archimedes'),
    latex: 'F_b = \\rho_{\\text{fluid}} V_{\\text{sub}} g',
    explanation: t('buoyancy.archimedesExpl'),
    liveValue: `F_b = ${currentState.value.buoyantForce.toFixed(2)} \\text{ N}`,
  },
  {
    title: t('buoyancy.formula_floating'),
    latex: '\\frac{V_{\\text{sub}}}{V} = \\frac{\\rho_{\\text{block}}}{\\rho_{\\text{fluid}}}',
    explanation: t('buoyancy.floatingExpl'),
    liveValue: `${(currentState.value.submergedFraction * 100).toFixed(1)}\\%`,
  },
  {
    title: t('buoyancy.formula_apparentWeight'),
    latex: 'W_{\\text{apparent}} = W - F_b',
    explanation: t('buoyancy.apparentWeightExpl'),
    liveValue: `W_{\\text{app}} = ${currentState.value.apparentWeight.toFixed(2)} \\text{ N}`,
  },
  {
    title: t('buoyancy.formula_netForce'),
    latex: 'F_{\\text{net}} = F_b - m g',
    explanation: t('buoyancy.netForceExpl'),
    liveValue: `F_{\\text{net}} = ${currentState.value.netForce.toFixed(2)} \\text{ N}`,
  },
]);

// Data Series for Live Graph and Table
const series = reactive<DataSeries>({
  t: [0],
  x: [Number((currentState.value.submergedVolume * 1000).toFixed(2))],
  y: [Number(currentState.value.buoyantForce.toFixed(2))],
  vx: [Number(currentState.value.weight.toFixed(2))],
  vy: [Number(currentState.value.apparentWeight.toFixed(2))],
  v: [Number((currentState.value.submergedFraction * 100).toFixed(1))],
});

const comparisonRuns = ref<ComparisonRun[]>([]);

// Report Data
const calculatedResults = computed(() => ({
  weight: currentState.value.weight,
  buoyantForce: currentState.value.buoyantForce,
  apparentWeight: currentState.value.apparentWeight,
  submergedFraction: currentState.value.submergedFraction * 100,
  displacedMass: currentState.value.displacedMass,
  submergedVolume: currentState.value.submergedVolume * 1000,
}));

const reportResultsRows = computed(() => [
  {
    name: t('buoyancy.weight'),
    simulated: `${currentState.value.weight.toFixed(2)} N`,
  },
  {
    name: t('buoyancy.buoyantForce'),
    simulated: `${currentState.value.buoyantForce.toFixed(2)} N`,
  },
  {
    name: t('buoyancy.apparentWeight'),
    simulated: `${currentState.value.apparentWeight.toFixed(2)} N`,
  },
  {
    name: t('buoyancy.submergedFraction'),
    simulated: `${(currentState.value.submergedFraction * 100).toFixed(1)}%`,
  },
  {
    name: t('buoyancy.displacedMass'),
    simulated: `${currentState.value.displacedMass.toFixed(3)} kg`,
  },
]);

const reportVariablesList = computed(() => [
  {
    name: t('buoyancy.material'),
    symbol: 'Material',
    value: materialOptions.value[uiParams.materialIndex] || 'Pine',
    unit: '',
  },
  {
    name: t('buoyancy.fluidType'),
    symbol: 'Fluid',
    value: fluidOptions.value[uiParams.fluidTypeIndex] || 'Water',
    unit: '',
  },
  {
    name: t('buoyancy.blockVolume'),
    symbol: 'V',
    value: uiParams.blockVolumeLiters.toFixed(1),
    unit: 'L',
  },
  {
    name: t('buoyancy.gravity'),
    symbol: 'g',
    value: uiParams.gravity.toFixed(1),
    unit: 'm/s²',
  },
  {
    name: t('buoyancy.tetherMode'),
    symbol: 'Mode',
    value: uiParams.tetherMode === 0 ? t('buoyancy.modeFreeFloat') : t('buoyancy.modeSuspended'),
    unit: '',
  },
]);

// Physics Accumulator Engine
let accumulator: PhysicsAccumulator | null = null;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.05,
    onPhysicsStep: (dt: number) => {
      currentState.value = stepBuoyancyModel(currentState.value, internalParams.value, dt * speed.value);
      recordDataPoint();
    },
    onRenderStep: () => {},
  });
}

function recordDataPoint() {
  const maxSamples = 200;
  const time = Number(currentState.value.t.toFixed(2));
  const subVol = Number((currentState.value.submergedVolume * 1000).toFixed(2));
  const fb = Number(currentState.value.buoyantForce.toFixed(2));
  const w = Number(currentState.value.weight.toFixed(2));
  const appW = Number(currentState.value.apparentWeight.toFixed(2));
  const subPct = Number((currentState.value.submergedFraction * 100).toFixed(1));

  series.t.push(time);
  series.x.push(subVol);
  series.y.push(fb);
  series.vx.push(w);
  series.vy.push(appW);
  series.v.push(subPct);

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
  currentState.value = stepBuoyancyModel(currentState.value, internalParams.value, 0.05);
  recordDataPoint();
}

function resetSimulation() {
  pauseSimulation();
  currentState.value = createBuoyancyModel(internalParams.value);
  series.t = [0];
  series.x = [Number((currentState.value.submergedVolume * 1000).toFixed(2))];
  series.y = [Number(currentState.value.buoyantForce.toFixed(2))];
  series.vx = [Number(currentState.value.weight.toFixed(2))];
  series.vy = [Number(currentState.value.apparentWeight.toFixed(2))];
  series.v = [Number((currentState.value.submergedFraction * 100).toFixed(1))];
}

function setSpeed(newSpeed: number) {
  speed.value = newSpeed;
}

function setMode(newMode: 'ideal' | 'real') {
  mode.value = newMode;
  onParamChange();
}

function onParamChange() {
  currentState.value = createBuoyancyModel(internalParams.value);
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
    const existing = await db.notes.where('experimentId').equals('physics/fluids/buoyancy-archimedes').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/fluids/buoyancy-archimedes',
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
    const existing = await db.notes.where('experimentId').equals('physics/fluids/buoyancy-archimedes').first();
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
.buoyancy-experiment {
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
