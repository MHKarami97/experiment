<template>
  <div class="gas-laws-experiment">
    <!-- Top Global Toolbar -->
    <Toolbar
      :is-running="isRunning"
      :speed="speed"
      :mode="mode"
      :show-ruler="showRuler"
      :show-stopwatch="showStopwatch"
      @toggle-play="togglePlay"
      @reset="resetSimulation"
      @step="stepSimulation"
      @set-speed="setSpeed"
      @set-mode="setMode"
      @toggle-ruler="showRuler = !showRuler"
      @toggle-stopwatch="showStopwatch = !showStopwatch"
      @open-export="showExportModal = true"
    />

    <!-- Main Workspace -->
    <div class="experiment-workspace">
      <!-- Scene Canvas Mount -->
      <div class="scene-container">
        <div class="canvas-mount">
          <GasLawsCanvas
            ref="canvasViewRef"
            :state="currentState"
            :params="internalParams"
          />

          <!-- Overlaid Measurement Tool Widgets -->
          <RulerWidget v-if="showRuler" :visible="showRuler" @close="showRuler = false" />
          <StopwatchWidget v-if="showStopwatch" :visible="showStopwatch" @close="showStopwatch = false" />
        </div>
      </div>

      <!-- Desktop Sidebar Controls -->
      <aside class="control-sidebar desktop-only glass-panel">
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

          <!-- Thermodynamic Law / Process Mode -->
          <div class="profile-selector-group">
            <label class="control-label">{{ $t('gasLaws.lawMode') }}</label>
            <div class="process-pill-list">
              <button
                v-for="(lawItem, idx) in lawModeOptions"
                :key="idx"
                type="button"
                class="process-pill-btn"
                :class="{ active: uiParams.lawModeIndex === idx }"
                @click="onSelectLawMode(idx)"
              >
                {{ lawItem.label }}
              </button>
            </div>
          </div>

          <!-- Gas Species Selector Grid -->
          <div class="profile-selector-group">
            <label class="control-label">{{ $t('gasLaws.gasType') }}</label>
            <div class="gas-pill-grid">
              <button
                v-for="(gasItem, idx) in gasSpeciesList"
                :key="gasItem.id"
                type="button"
                class="gas-card-btn"
                :class="{ active: uiParams.gasTypeIndex === idx }"
                @click="uiParams.gasTypeIndex = idx; onParamChange()"
              >
                <span class="gas-icon">{{ gasItem.icon }}</span>
                <span class="gas-name">{{ gasItem.name }}</span>
                <span class="gas-molar" dir="ltr">M={{ gasItem.molarMass }}</span>
              </button>
            </div>
          </div>

          <!-- State Variables -->
          <VariableGroup :title="$t('common.variables')">
            <UnitSlider
              id="moles"
              v-model="uiParams.moles"
              :label="$t('gasLaws.moles')"
              unit="mol"
              :min="0.2"
              :max="4.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="volumeLiters"
              v-model="uiParams.volumeLiters"
              :label="$t('gasLaws.volume')"
              unit="L"
              :min="5"
              :max="35"
              :step="1"
              :disabled="uiParams.lawModeIndex === 3"
              @update:model-value="onVolumeSliderChange"
            />
            <UnitSlider
              id="temperatureKelvin"
              v-model="uiParams.temperatureKelvin"
              :label="$t('gasLaws.temperature')"
              unit="K"
              :min="100"
              :max="750"
              :step="10"
              :disabled="uiParams.lawModeIndex === 1"
              @update:model-value="onTempSliderChange"
            />
          </VariableGroup>

          <!-- Slot Persistence -->
          <div class="slot-manager-section">
            <SlotManager
              experiment-id="physics/thermo/gas-laws"
              :current-params="uiParams"
              :current-mode="mode"
              @load="onLoadSlot"
            />
          </div>
        </div>
      </aside>
    </div>

    <!-- Mobile Drawer for Controls -->
    <BottomSheet :title="$t('common.controls')" class="mobile-only">
      <div class="sidebar-scroll mobile-scroll">
        <PresetPicker
          :presets="presetOptions"
          :current-preset="currentPresetId"
          @select="applyPreset"
        />

        <div class="profile-selector-group">
          <label class="control-label">{{ $t('gasLaws.lawMode') }}</label>
          <div class="process-pill-list">
            <button
              v-for="(lawItem, idx) in lawModeOptions"
              :key="idx"
              type="button"
              class="process-pill-btn"
              :class="{ active: uiParams.lawModeIndex === idx }"
              @click="onSelectLawMode(idx)"
            >
              {{ lawItem.label }}
            </button>
          </div>
        </div>

        <div class="profile-selector-group">
          <label class="control-label">{{ $t('gasLaws.gasType') }}</label>
          <div class="gas-pill-grid">
            <button
              v-for="(gasItem, idx) in gasSpeciesList"
              :key="gasItem.id"
              type="button"
              class="gas-card-btn"
              :class="{ active: uiParams.gasTypeIndex === idx }"
              @click="uiParams.gasTypeIndex = idx; onParamChange()"
            >
              <span class="gas-icon">{{ gasItem.icon }}</span>
              <span class="gas-name">{{ gasItem.name }}</span>
              <span class="gas-molar" dir="ltr">M={{ gasItem.molarMass }}</span>
            </button>
          </div>
        </div>

        <VariableGroup :title="$t('common.variables')">
          <UnitSlider
            id="mMoles"
            v-model="uiParams.moles"
            :label="$t('gasLaws.moles')"
            unit="mol"
            :min="0.2"
            :max="4.0"
            :step="0.1"
            @update:model-value="onParamChange"
          />
          <UnitSlider
            id="mVolumeLiters"
            v-model="uiParams.volumeLiters"
            :label="$t('gasLaws.volume')"
            unit="L"
            :min="5"
            :max="35"
            :step="1"
            :disabled="uiParams.lawModeIndex === 3"
            @update:model-value="onVolumeSliderChange"
          />
          <UnitSlider
            id="mTemperatureKelvin"
            v-model="uiParams.temperatureKelvin"
            :label="$t('gasLaws.temperature')"
            unit="K"
            :min="100"
            :max="750"
            :step="10"
            :disabled="uiParams.lawModeIndex === 1"
            @update:model-value="onTempSliderChange"
          />
        </VariableGroup>
      </div>
    </BottomSheet>

    <!-- Bottom Analytics Workspace Tabs -->
    <div class="bottom-analytics-workspace glass-panel">
      <!-- Tabs Navigation -->
      <nav class="analytics-tabs-nav">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'graph' }"
          @click="activeTab = 'graph'"
        >
          📈 {{ $t('gasLaws.tabGraph') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'table' }"
          @click="activeTab = 'table'"
        >
          📋 {{ $t('gasLaws.tabTable') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'theory' }"
          @click="activeTab = 'theory'"
        >
          📖 {{ $t('gasLaws.tabTheory') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'notes' }"
          @click="activeTab = 'notes'"
        >
          📝 {{ $t('gasLaws.tabNotes') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'guided' }"
          @click="activeTab = 'guided'"
        >
          🎯 {{ $t('gasLaws.tabGuided') }}
        </button>
      </nav>

      <!-- Active Tab Body -->
      <div class="tab-content-area">
        <!-- Tab 1: Live Graph -->
        <div v-show="activeTab === 'graph'" class="tab-panel graph-panel-wrapper">
          <div class="live-metrics-strip">
            <div class="metric-chip">
              <span class="m-label">{{ $t('gasLaws.metricPressure') }}</span>
              <span class="m-value text-accent">{{ currentState.derived.displayedPressureKPa.toFixed(1) }} kPa</span>
            </div>
            <div class="metric-chip">
              <span class="m-label">{{ $t('gasLaws.metricVolume') }}</span>
              <span class="m-value text-vol">{{ uiParams.volumeLiters.toFixed(1) }} L</span>
            </div>
            <div class="metric-chip">
              <span class="m-label">{{ $t('gasLaws.metricTemp') }}</span>
              <span class="m-value text-temp">{{ uiParams.temperatureKelvin }} K ({{ (uiParams.temperatureKelvin - 273.15).toFixed(1) }}°C)</span>
            </div>
            <div class="metric-chip">
              <span class="m-label">{{ $t('gasLaws.metricRms') }}</span>
              <span class="m-value text-rms">{{ currentState.derived.rmsSpeed.toFixed(0) }} m/s</span>
            </div>
            <div class="metric-chip">
              <span class="m-label">{{ $t('gasLaws.metricInternalEnergy') }}</span>
              <span class="m-value">{{ (currentState.derived.totalInternalEnergyJoules / 1000).toFixed(2) }} kJ</span>
            </div>
          </div>

          <GraphPanel
            :current-series="series"
            :comparison-runs="comparisonRuns"
            @save-run="saveCurrentRun"
            @clear-runs="clearRuns"
          />
        </div>

        <!-- Tab 2: Live Data Table -->
        <div v-show="activeTab === 'table'" class="tab-panel">
          <DataTable
            :series="series"
            :max-display-rows="100"
          />
        </div>

        <!-- Tab 3: Theory & Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel">
          <FormulaPanel
            :title="$t('gasLaws.tabTheory')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('gasLaws.theoryContent') }}</p>
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
        :title="$t('experiments.gasLaws.title')"
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
  createGasLawModel,
  stepGasLawModel,
  type GasLawParams,
  type GasLawState,
  type GasType,
  type GasLawMode,
} from '../model/gas-laws';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { gasLawsConfig } from '../config';

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
import GasLawsCanvas from '../view/GasLawsCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();

const canvasViewRef = ref<InstanceType<typeof GasLawsCanvas> | null>(null);

// Simulation Controls — Starts PAUSED by default, runs only when play is pressed
const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('stpState');
const userNotes = ref<string>('');

// UI Model Parameters
const uiParams = reactive<Record<string, number>>({
  lawModeIndex: 0, // 0: ideal, 1: boyle, 2: charles, 3: gayLussac
  gasTypeIndex: 0, // 0: helium, 1: neon, 2: argon, 3: nitrogen, 4: co2
  moles: 1.0,
  volumeLiters: 15.0,
  temperatureKelvin: 300,
});

const lawKeys: GasLawMode[] = ['ideal', 'boyle', 'charles', 'gayLussac'];
const gasKeys: GasType[] = ['helium', 'neon', 'argon', 'nitrogen', 'co2'];

const lawModeOptions = computed(() => [
  { label: t('gasLaws.modeIdealGeneral'), mode: 'ideal' },
  { label: t('gasLaws.modeBoyle'), mode: 'boyle' },
  { label: t('gasLaws.modeCharles'), mode: 'charles' },
  { label: t('gasLaws.modeGayLussac'), mode: 'gayLussac' },
]);

const gasSpeciesList = [
  { id: 'helium', icon: '🎈', name: 'هلیوم (He)', molarMass: '4' },
  { id: 'neon', icon: '💡', name: 'نئون (Ne)', molarMass: '20.2' },
  { id: 'argon', icon: '🟣', name: 'آرگون (Ar)', molarMass: '40' },
  { id: 'nitrogen', icon: '💨', name: 'نیتروژن (N₂)', molarMass: '28' },
  { id: 'co2', icon: '🫧', name: 'دی‌اکسید کربن (CO₂)', molarMass: '44' },
];

const presetOptions = computed<PresetOption[]>(() =>
  gasLawsConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }))
);

const internalParams = computed<GasLawParams>(() => ({
  lawMode: lawKeys[uiParams.lawModeIndex] || 'ideal',
  gasType: gasKeys[uiParams.gasTypeIndex] || 'helium',
  moles: uiParams.moles,
  volumeLiters: uiParams.volumeLiters,
  temperatureKelvin: uiParams.temperatureKelvin,
  particleCount: 80,
  isRealMode: mode.value === 'real',
}));

const currentState = ref<GasLawState>(createGasLawModel(internalParams.value));

// Live Data Series for Graph and Table
const series = reactive<DataSeries>({
  t: [0],
  x: [uiParams.volumeLiters], // Volume (L)
  y: [currentState.value.derived.displayedPressureKPa], // Pressure (kPa)
  vx: [uiParams.temperatureKelvin], // Temperature (K)
  vy: [currentState.value.derived.rmsSpeed], // v_rms (m/s)
  v: [currentState.value.derived.totalInternalEnergyJoules / 1000], // Internal Energy (kJ)
});

const comparisonRuns = ref<ComparisonRun[]>([]);

const formulaItems = computed<FormulaItem[]>(() =>
  gasLawsConfig.formulas.map((f) => ({
    title: t(f.titleKey),
    latex: f.latex,
    explanation: t(f.explanationKey),
  }))
);

const guidedSteps = computed<LabStep[]>(() => [
  { id: 'step1', title: t('gasLaws.step1Title'), instruction: t('gasLaws.step1Desc') },
  { id: 'step2', title: t('gasLaws.step2Title'), instruction: t('gasLaws.step2Desc') },
  { id: 'step3', title: t('gasLaws.step3Title'), instruction: t('gasLaws.step3Desc') },
  { id: 'step4', title: t('gasLaws.step4Title'), instruction: t('gasLaws.step4Desc') },
]);

// Results & Reports
const calculatedResults = computed<Record<string, number | string>>(() => ({
  'Pressure (kPa)': currentState.value.derived.displayedPressureKPa.toFixed(2),
  'Volume (L)': uiParams.volumeLiters.toFixed(1),
  'Temperature (K)': uiParams.temperatureKelvin,
  'RMS Speed (m/s)': currentState.value.derived.rmsSpeed.toFixed(0),
  'Gas Species': gasKeys[uiParams.gasTypeIndex],
  'Law Process': lawKeys[uiParams.lawModeIndex],
}));

const reportResultsRows = computed(() => [
  { name: t('gasLaws.metricPressure'), simulated: `${currentState.value.derived.displayedPressureKPa.toFixed(2)} kPa` },
  { name: t('gasLaws.metricVolume'), simulated: `${uiParams.volumeLiters.toFixed(1)} L` },
  { name: t('gasLaws.metricTemp'), simulated: `${uiParams.temperatureKelvin} K` },
  { name: t('gasLaws.metricRms'), simulated: `${currentState.value.derived.rmsSpeed.toFixed(0)} m/s` },
  { name: t('gasLaws.metricInternalEnergy'), simulated: `${(currentState.value.derived.totalInternalEnergyJoules / 1000).toFixed(2)} kJ` },
]);

const reportVariablesList = computed(() => [
  { name: t('gasLaws.lawMode'), symbol: 'Mode', value: lawKeys[uiParams.lawModeIndex], unit: '' },
  { name: t('gasLaws.gasType'), symbol: 'Gas', value: gasKeys[uiParams.gasTypeIndex], unit: '' },
  { name: t('gasLaws.moles'), symbol: 'n', value: uiParams.moles, unit: 'mol' },
  { name: t('gasLaws.volume'), symbol: 'V', value: uiParams.volumeLiters, unit: 'L' },
  { name: t('gasLaws.temperature'), symbol: 'T', value: uiParams.temperatureKelvin, unit: 'K' },
]);

let accumulator: PhysicsAccumulator | null = null;
let sampleTimer = 0;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.05,
    onPhysicsStep: (dt: number) => {
      currentState.value = stepGasLawModel(currentState.value, internalParams.value, dt * speed.value);
      sampleTimer += dt * speed.value;
      if (sampleTimer >= 0.1) {
        sampleTimer = 0;
        recordDataPoint();
      }
    },
    onRenderStep: () => {
      // view renders via reactive state
    },
  });
  // Do NOT auto-start accumulator here — wait until user presses play
}

function recordDataPoint() {
  const tSec = Number(currentState.value.t.toFixed(1));

  series.t.push(tSec);
  series.x.push(Number(uiParams.volumeLiters.toFixed(1)));
  series.y.push(Number(currentState.value.derived.displayedPressureKPa.toFixed(1)));
  series.vx.push(uiParams.temperatureKelvin);
  series.vy.push(Number(currentState.value.derived.rmsSpeed.toFixed(0)));
  series.v.push(Number((currentState.value.derived.totalInternalEnergyJoules / 1000).toFixed(2)));

  if (series.t.length > 150) {
    series.t.shift();
    series.x.shift();
    series.y.shift();
    series.vx.shift();
    series.vy.shift();
    series.v.shift();
  }
}

// User Actions
function togglePlay() {
  if (accumulator) {
    isRunning.value = accumulator.toggle();
  } else {
    isRunning.value = !isRunning.value;
  }
}

function resetSimulation() {
  if (accumulator) {
    accumulator.pause();
    accumulator.resetAccumulator();
  }
  isRunning.value = false;
  currentState.value = createGasLawModel(internalParams.value);
  series.t = [0];
  series.x = [uiParams.volumeLiters];
  series.y = [currentState.value.derived.displayedPressureKPa];
  series.vx = [uiParams.temperatureKelvin];
  series.vy = [currentState.value.derived.rmsSpeed];
  series.v = [currentState.value.derived.totalInternalEnergyJoules / 1000];
  sampleTimer = 0;
}

function stepSimulation() {
  if (accumulator) {
    accumulator.stepOnce();
  } else {
    currentState.value = stepGasLawModel(currentState.value, internalParams.value, 0.05);
    recordDataPoint();
  }
}

function setSpeed(newSpeed: number) {
  speed.value = newSpeed;
  if (accumulator) {
    accumulator.setSpeed(newSpeed);
  }
}

function setMode(newMode: 'ideal' | 'real') {
  mode.value = newMode;
  currentState.value = createGasLawModel(internalParams.value);
}

function onSelectLawMode(modeIdx: number) {
  uiParams.lawModeIndex = modeIdx;
  if (modeIdx === 1) {
    // Boyle: Fix T at 300K
    uiParams.temperatureKelvin = 300;
  } else if (modeIdx === 3) {
    // Gay-Lussac: Fix V at 15L
    uiParams.volumeLiters = 15;
  }
  onParamChange();
}

function onVolumeSliderChange() {
  onParamChange();
}

function onTempSliderChange() {
  // If Charles mode (isobaric), expanding T automatically expands V proportionally: V = V_base * (T / T_base)
  if (uiParams.lawModeIndex === 2) {
    const targetV = Math.min(35, Math.max(5, (15.0 * uiParams.temperatureKelvin) / 300.0));
    uiParams.volumeLiters = Number(targetV.toFixed(1));
  }
  onParamChange();
}

function onParamChange() {
  currentState.value = createGasLawModel(internalParams.value);
}

function applyPreset(preset: PresetOption) {
  currentPresetId.value = preset.id;
  Object.assign(uiParams, preset.params);
  resetSimulation();
}

function onLoadSlot(slot: StoredSlot) {
  if (!slot.params) return;
  Object.assign(uiParams, slot.params);
  if (slot.mode) mode.value = slot.mode;
  resetSimulation();
}

function saveCurrentRun() {
  comparisonRuns.value.push({
    name: `${gasKeys[uiParams.gasTypeIndex]} (${lawKeys[uiParams.lawModeIndex]})`,
    color: comparisonRuns.value.length === 0 ? '#10b981' : '#ec4899',
    series: {
      t: [...series.t],
      x: [...series.x],
      y: [...series.y],
      vx: [...series.vx],
      vy: [...series.vy],
      v: [...series.v],
    },
  });
}

function clearRuns() {
  comparisonRuns.value = [];
}

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/thermo/gas-laws').first();
    if (existing?.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/thermo/gas-laws',
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
    const existing = await db.notes.where('experimentId').equals('physics/thermo/gas-laws').first();
    if (existing) {
      userNotes.value = existing.content;
    }
  } catch (err) {
    console.warn('Failed to load notes:', err);
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
.gas-laws-experiment {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-page);
  color: var(--text-primary);
}

.experiment-workspace {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-md);
  align-items: stretch;
}

@media (max-width: 1024px) {
  .experiment-workspace {
    grid-template-columns: 1fr;
  }
}

.scene-container {
  display: flex;
  flex-direction: column;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow-sm);
}

.canvas-mount {
  width: 100%;
  height: 520px;
  position: relative;
  background: var(--bg-page);
}

.control-sidebar {
  display: flex;
  flex-direction: column;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  gap: var(--space-sm);
  max-height: 720px;
  overflow: hidden;
}

.sidebar-scroll {
  overflow-y: auto;
  padding-right: var(--space-xs);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.mobile-scroll {
  max-height: 55vh;
  padding: var(--space-sm);
}

.sidebar-header h3 {
  font-size: var(--text-lg);
  margin-bottom: var(--space-xs);
  color: var(--text-primary);
}

.profile-selector-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.control-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
}

/* Process Mode Pills */
.process-pill-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.process-pill-btn {
  padding: 8px 10px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: right;
}

.process-pill-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.process-pill-btn.active {
  background: var(--brand-primary);
  color: #ffffff;
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}

/* Gas Species Card Grid */
.gas-pill-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.gas-card-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 2px;
}

.gas-card-btn:hover {
  background: var(--surface-hover);
  border-color: #38bdf8;
}

.gas-card-btn.active {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  color: #ffffff;
}

.gas-icon {
  font-size: 14px;
}

.gas-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
}

.gas-card-btn.active .gas-name {
  color: #ffffff;
}

.gas-molar {
  font-size: 9px;
  font-family: monospace;
  color: var(--text-secondary);
}

.gas-card-btn.active .gas-molar {
  color: rgba(255, 255, 255, 0.9);
}

.bottom-analytics-workspace {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.analytics-tabs-nav {
  display: flex;
  gap: var(--space-xs);
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--space-xs);
  overflow-x: auto;
}

.tab-btn {
  background: none;
  border: none;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--brand-primary);
  color: #ffffff;
}

.tab-content-area {
  min-height: 260px;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.live-metrics-strip {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.metric-chip {
  flex: 1 1 140px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.m-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.m-value {
  font-size: var(--text-md);
  font-weight: 600;
  font-family: monospace;
}

.text-accent {
  color: var(--brand-primary);
}

.text-vol {
  color: #06b6d4;
}

.text-temp {
  color: #f59e0b;
}

.text-rms {
  color: #10b981;
}

.notes-tab {
  gap: var(--space-sm);
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notes-textarea {
  width: 100%;
  min-height: 140px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  color: var(--text-primary);
  font-family: inherit;
  resize: vertical;
}

.btn-save-note {
  background: var(--surface-hover);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-sm);
  color: var(--text-primary);
  cursor: pointer;
}

.btn-save-note:hover {
  background: var(--brand-primary);
  color: #ffffff;
}

.theory-prose {
  line-height: 1.7;
  color: var(--text-secondary);
  white-space: pre-line;
}

.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

@media (max-width: 1024px) {
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: block !important;
  }
}
</style>
