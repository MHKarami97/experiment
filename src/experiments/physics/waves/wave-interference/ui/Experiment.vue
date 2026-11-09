<template>
  <div class="wave-interference-experiment">
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
          <WaveInterferenceCanvas
            ref="canvasViewRef"
            :params="internalParams"
            :sim-time="simTime"
            :is-running="isRunning"
            :is-dark="store.theme === 'dark'"
            @update:probe="onProbeUpdate"
          />

          <!-- Overlaid Tool Widgets -->
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

          <!-- Mode Selector Pills -->
          <div class="control-section">
            <label class="control-label">{{ $t('waveInterference.waveMode') }}</label>
            <div class="mode-pill-list">
              <button
                v-for="(mItem, idx) in modeOptions"
                :key="idx"
                type="button"
                class="mode-pill-btn"
                :class="{ active: uiParams.waveModeIndex === idx }"
                @click="uiParams.waveModeIndex = idx; onParamChange()"
              >
                <span class="mode-icon">{{ mItem.icon }}</span>
                <span class="mode-name">{{ mItem.label }}</span>
              </button>
            </div>
          </div>

          <!-- Variables Group -->
          <VariableGroup :title="$t('common.variables')">
            <UnitSlider
              id="frequency"
              v-model="uiParams.frequency"
              :label="$t('waveInterference.frequency')"
              unit="Hz"
              :min="0.2"
              :max="4.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="waveSpeed"
              v-model="uiParams.waveSpeed"
              :label="$t('waveInterference.waveSpeed')"
              unit="cm/s"
              :min="5"
              :max="50"
              :step="1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="amplitude1"
              v-model="uiParams.amplitude1"
              :label="$t('waveInterference.amplitude1')"
              unit="cm"
              :min="0.5"
              :max="5.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="uiParams.waveModeIndex !== 2"
              id="amplitude2"
              v-model="uiParams.amplitude2"
              :label="$t('waveInterference.amplitude2')"
              unit="cm"
              :min="0.5"
              :max="5.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="uiParams.waveModeIndex === 0"
              id="sourceSeparation"
              v-model="uiParams.sourceSeparation"
              :label="$t('waveInterference.sourceSeparation')"
              unit="cm"
              :min="4"
              :max="30"
              :step="1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="uiParams.waveModeIndex !== 2"
              id="phaseDifferenceDeg"
              v-model="uiParams.phaseDifferenceDeg"
              :label="$t('waveInterference.phaseDifference')"
              unit="°"
              :min="0"
              :max="360"
              :step="15"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Real Mode Damping Group -->
          <VariableGroup v-if="mode === 'real'" :title="$t('heatEngines.modeReal')">
            <UnitSlider
              id="damping"
              v-model="uiParams.damping"
              :label="$t('waveInterference.damping')"
              unit="1/s"
              :min="0"
              :max="0.15"
              :step="0.01"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Save/Load State Slots -->
          <SlotManager
            experiment-id="physics/waves/wave-interference"
            :current-params="uiParams"
            :current-mode="mode"
            @load="onLoadSlot"
          />
        </div>
      </aside>

      <!-- Mobile Controls Drawer (BottomSheet) -->
      <BottomSheet :title="$t('common.controls')" class="mobile-only">
        <div class="mobile-controls-content">
          <PresetPicker
            :presets="presetOptions"
            :current-preset="currentPresetId"
            @select="applyPreset"
          />

          <div class="control-section">
            <label class="control-label">{{ $t('waveInterference.waveMode') }}</label>
            <div class="mode-pill-list">
              <button
                v-for="(mItem, idx) in modeOptions"
                :key="idx"
                type="button"
                class="mode-pill-btn"
                :class="{ active: uiParams.waveModeIndex === idx }"
                @click="uiParams.waveModeIndex = idx; onParamChange()"
              >
                <span class="mode-icon">{{ mItem.icon }}</span>
                <span class="mode-name">{{ mItem.label }}</span>
              </button>
            </div>
          </div>

          <VariableGroup :title="$t('common.variables')">
            <UnitSlider
              id="m-frequency"
              v-model="uiParams.frequency"
              :label="$t('waveInterference.frequency')"
              unit="Hz"
              :min="0.2"
              :max="4.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="m-waveSpeed"
              v-model="uiParams.waveSpeed"
              :label="$t('waveInterference.waveSpeed')"
              unit="cm/s"
              :min="5"
              :max="50"
              :step="1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="m-amplitude1"
              v-model="uiParams.amplitude1"
              :label="$t('waveInterference.amplitude1')"
              unit="cm"
              :min="0.5"
              :max="5.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>
        </div>
      </BottomSheet>
    </div>

    <!-- Bottom Data & Analysis Tabs -->
    <div class="bottom-analysis-area glass-panel">
      <!-- Tabs Navigation Header -->
      <nav class="analysis-tabs-nav" role="tablist">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'probe' }"
          @click="activeTab = 'probe'"
        >
          📍 {{ $t('waveInterference.probeReadings') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'graph' }"
          @click="activeTab = 'graph'"
        >
          📈 {{ $t('common.graph') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'table' }"
          @click="activeTab = 'table'"
        >
          📋 {{ $t('common.table') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'theory' }"
          @click="activeTab = 'theory'"
        >
          📖 {{ $t('common.theory') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'notes' }"
          @click="activeTab = 'notes'"
        >
          📝 {{ $t('common.notes') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'guided' }"
          @click="activeTab = 'guided'"
        >
          🎯 {{ $t('common.guided') }}
        </button>
      </nav>

      <!-- Tab Content Area -->
      <div class="tab-content-container">
        <!-- Tab 1: Probe Readings & Interference Status -->
        <div v-show="activeTab === 'probe'" class="tab-panel probe-tab">
          <div class="probe-cards-grid">
            <div class="probe-card highlight-card">
              <span class="card-title">{{ $t('waveInterference.interferenceState') }}</span>
              <span class="card-value" :class="probeStatusClass">
                {{ probeInterferenceText }}
              </span>
              <span class="card-sub">
                {{ probeInfo.isConstructive ? 'Δr = mλ (تقویت)' : probeInfo.isDestructive ? 'Δr = (m+0.5)λ (گره)' : 'تداخل میانی' }}
              </span>
            </div>

            <div class="probe-card">
              <span class="card-title">{{ $t('waveInterference.pathDifference') }}</span>
              <span class="card-value ltr-island">
                {{ probeInfo.pathDifference.toFixed(2) }} cm
              </span>
              <span class="card-sub ltr-island">
                {{ probeInfo.pathDiffInWavelengths.toFixed(2) }} × λ
              </span>
            </div>

            <div class="probe-card">
              <span class="card-title">{{ $t('waveInterference.wavelength') }} (λ)</span>
              <span class="card-value ltr-island">
                {{ constants.wavelength.toFixed(2) }} cm
              </span>
              <span class="card-sub ltr-island">
                k = {{ constants.wavenumber.toFixed(2) }} rad/cm
              </span>
            </div>

            <div class="probe-card">
              <span class="card-title">{{ $t('waveInterference.totalDisplacement') }}</span>
              <span class="card-value ltr-island">
                {{ probeInfo.totalDisplacement.toFixed(2) }} cm
              </span>
              <span class="card-sub ltr-island">
                A_env = {{ probeInfo.resultantAmplitude.toFixed(2) }} cm
              </span>
            </div>
          </div>
        </div>

        <!-- Tab 2: Oscilloscope / Waveform Graph -->
        <div v-show="activeTab === 'graph'" class="tab-panel">
          <GraphPanel
            :current-series="series"
            :comparison-runs="comparisonRuns"
            x-label="Time (s)"
            y-label="Displacement (cm)"
            x-key="t"
            y-key="y"
          />
        </div>

        <!-- Tab 3: Data Table -->
        <div v-show="activeTab === 'table'" class="tab-panel">
          <DataTable
            :series="series"
            :column-keys="['t', 'x', 'y', 'vx', 'vy']"
            :column-labels="[
              $t('common.time'),
              $t('waveInterference.wave1') + ' (cm)',
              $t('waveInterference.totalDisplacement') + ' (cm)',
              $t('waveInterference.wave2') + ' (cm)',
              $t('waveInterference.pathDifference') + ' (cm)'
            ]"
          />
        </div>

        <!-- Tab 4: Theory & Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel">
          <FormulaPanel
            :title="$t('waveInterference.theoryTitle')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('waveInterference.theoryP1') }}</p>
            <p>{{ $t('waveInterference.theoryP2') }}</p>
            <p>{{ $t('waveInterference.theoryP3') }}</p>
          </div>
        </div>

        <!-- Tab 5: Notes -->
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

        <!-- Tab 6: Guided Lab Steps -->
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
        :title="$t('experiments.waveInterference.title')"
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
  type WaveMode,
  type WaveInterferenceParams,
  type WaveDerivedConstants,
  type ProbeMeasurement,
  calculateWaveConstants,
  calculateProbeMeasurement
} from '../model/wave-interference';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { waveInterferenceConfig } from '../config';

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
import WaveInterferenceCanvas from '../view/WaveInterferenceCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();

const canvasViewRef = ref<InstanceType<typeof WaveInterferenceCanvas> | null>(null);

// Simulation Controls — Starts PAUSED by default, runs only when play is pressed
const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('probe');
const userNotes = ref('');

const waveModeKeys: WaveMode[] = ['ripple2d', 'transverse1d', 'longitudinal1d'];

const modeOptions = computed(() => [
  { label: t('waveInterference.mode_ripple2d'), icon: '🌊' },
  { label: t('waveInterference.mode_transverse1d'), icon: '〰️' },
  { label: t('waveInterference.mode_longitudinal1d'), icon: '🔊' },
]);

const currentPresetId = ref<string>('in_phase_constructive');

const presetOptions = computed<PresetOption[]>(() =>
  waveInterferenceConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }))
);

const uiParams = reactive<Record<string, number>>({
  waveModeIndex: 0,
  amplitude1: 2.0,
  amplitude2: 2.0,
  frequency: 1.5,
  waveSpeed: 20,
  sourceSeparation: 12,
  phaseDifferenceDeg: 0,
  damping: 0.02,
  probeX: 0,
  probeY: 10,
});

const internalParams = computed<WaveInterferenceParams>(() => ({
  mode: waveModeKeys[uiParams.waveModeIndex] || 'ripple2d',
  amplitude1: uiParams.amplitude1,
  amplitude2: uiParams.amplitude2,
  frequency: uiParams.frequency,
  waveSpeed: uiParams.waveSpeed,
  sourceSeparation: uiParams.sourceSeparation,
  phaseDifferenceDeg: uiParams.phaseDifferenceDeg,
  damping: uiParams.damping,
  realMode: mode.value === 'real',
  probeX: uiParams.probeX,
  probeY: uiParams.probeY,
}));

const constants = computed<WaveDerivedConstants>(() => calculateWaveConstants(internalParams.value));

const simTime = ref(0);

const probeInfo = computed<ProbeMeasurement>(() =>
  calculateProbeMeasurement(simTime.value, internalParams.value, constants.value)
);

const probeInterferenceText = computed(() => {
  if (probeInfo.value.isConstructive) return t('waveInterference.constructive');
  if (probeInfo.value.isDestructive) return t('waveInterference.destructive');
  return t('waveInterference.intermediate');
});

const probeStatusClass = computed(() => {
  if (probeInfo.value.isConstructive) return 'text-success';
  if (probeInfo.value.isDestructive) return 'text-danger';
  return 'text-primary';
});

// Live Data Series for Graph and Table
const series = reactive<DataSeries>({
  t: [0],
  x: [probeInfo.value.displacement1], // y1 (cm)
  y: [probeInfo.value.totalDisplacement], // y_tot (cm)
  vx: [probeInfo.value.displacement2], // y2 (cm)
  vy: [probeInfo.value.pathDifference], // Path difference (cm)
  v: [probeInfo.value.resultantAmplitude], // Amplitude envelope (cm)
});

const comparisonRuns = ref<ComparisonRun[]>([]);

const formulaItems = computed<FormulaItem[]>(() =>
  waveInterferenceConfig.formulas.map((f) => ({
    title: t(f.titleKey),
    latex: f.latex,
    explanation: t(f.explanationKey),
  }))
);

const guidedSteps = computed<LabStep[]>(() => [
  { id: 'step1', title: t('waveInterference.preset_in_phase'), instruction: t('waveInterference.formula_constructive_desc') },
  { id: 'step2', title: t('waveInterference.preset_out_of_phase'), instruction: t('waveInterference.formula_destructive_desc') },
  { id: 'step3', title: t('waveInterference.tool_probe'), instruction: t('waveInterference.tool_probe') },
]);

const calculatedResults = computed<Record<string, number | string>>(() => ({
  'Mode': waveModeKeys[uiParams.waveModeIndex],
  'Wavelength (cm)': constants.value.wavelength.toFixed(2),
  'Period (s)': constants.value.period.toFixed(2),
  'Path Difference (cm)': probeInfo.value.pathDifference.toFixed(2),
  'Interference': probeInterferenceText.value,
  'Total y (cm)': probeInfo.value.totalDisplacement.toFixed(2),
}));

const reportResultsRows = computed(() => [
  { name: t('waveInterference.wavelength'), simulated: `${constants.value.wavelength.toFixed(2)} cm` },
  { name: t('waveInterference.pathDifference'), simulated: `${probeInfo.value.pathDifference.toFixed(2)} cm` },
  { name: t('waveInterference.interferenceState'), simulated: probeInterferenceText.value },
  { name: t('waveInterference.totalDisplacement'), simulated: `${probeInfo.value.totalDisplacement.toFixed(2)} cm` },
]);

const reportVariablesList = computed(() => [
  { name: t('waveInterference.waveMode'), symbol: 'Mode', value: waveModeKeys[uiParams.waveModeIndex], unit: '' },
  { name: t('waveInterference.frequency'), symbol: 'f', value: uiParams.frequency, unit: 'Hz' },
  { name: t('waveInterference.waveSpeed'), symbol: 'v', value: uiParams.waveSpeed, unit: 'cm/s' },
  { name: t('waveInterference.amplitude1'), symbol: 'A1', value: uiParams.amplitude1, unit: 'cm' },
  { name: t('waveInterference.sourceSeparation'), symbol: 'd', value: uiParams.sourceSeparation, unit: 'cm' },
]);

let accumulator: PhysicsAccumulator | null = null;
let sampleTimer = 0;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.02,
    onPhysicsStep: (dt: number) => {
      simTime.value += dt * speed.value;
      sampleTimer += dt * speed.value;

      if (sampleTimer >= 0.06) {
        sampleTimer = 0;
        recordDataPoint();
      }
    },
    onRenderStep: () => {
      // view renders via reactive state
    },
  });
  // Do NOT start accumulator here — wait until play is pressed
}

function recordDataPoint() {
  const tSec = Number(simTime.value.toFixed(2));
  const p = probeInfo.value;

  series.t.push(tSec);
  series.x.push(Number(p.displacement1.toFixed(2)));
  series.y.push(Number(p.totalDisplacement.toFixed(2)));
  series.vx.push(Number(p.displacement2.toFixed(2)));
  series.vy.push(Number(p.pathDifference.toFixed(2)));
  series.v.push(Number(p.resultantAmplitude.toFixed(2)));

  if (series.t.length > 150) {
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
  simTime.value = 0;
  sampleTimer = 0;
  series.t = [0];
  series.x = [probeInfo.value.displacement1];
  series.y = [probeInfo.value.totalDisplacement];
  series.vx = [probeInfo.value.displacement2];
  series.vy = [probeInfo.value.pathDifference];
  series.v = [probeInfo.value.resultantAmplitude];
}

function stepSimulation() {
  if (accumulator) {
    accumulator.pause();
  }
  isRunning.value = false;
  simTime.value += 0.04;
  recordDataPoint();
}

function setSpeed(val: number) {
  speed.value = val;
  if (accumulator) {
    accumulator.setSpeed(val);
  }
}

function setMode(val: 'ideal' | 'real') {
  mode.value = val;
  onParamChange();
}

function onProbeUpdate(coords: { x: number; y: number }) {
  uiParams.probeX = coords.x;
  uiParams.probeY = coords.y;
}

function onParamChange() {
  // Re-evaluated by computed properties
}

function applyPreset(preset: PresetOption) {
  currentPresetId.value = preset.id;
  Object.assign(uiParams, preset.params);
  resetSimulation();
}

function onLoadSlot(slot: StoredSlot) {
  if (slot.params) {
    Object.assign(uiParams, slot.params);
  }
  if (slot.mode) mode.value = slot.mode;
  resetSimulation();
}

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/waves/wave-interference').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, { content: userNotes.value, updatedAt: Date.now() });
    } else {
      await db.notes.add({
        experimentId: 'physics/waves/wave-interference',
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    }
  } catch (err) {
    console.error('Failed to save notes:', err);
  }
}

onMounted(async () => {
  initLoop();
  try {
    const saved = await db.notes.where('experimentId').equals('physics/waves/wave-interference').first();
    if (saved) userNotes.value = saved.content;
  } catch {
    // ignore
  }
});

onBeforeUnmount(() => {
  accumulator?.pause();
});
</script>

<style scoped>
.wave-interference-experiment {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: var(--space-4, 16px);
  padding: 12px;
  background: var(--bg-page);
  color: var(--text-primary);
}

.experiment-workspace {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
  width: 100%;
  align-items: flex-start;
}

@media (max-width: 1024px) {
  .experiment-workspace {
    grid-template-columns: 1fr;
  }
}

.scene-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.canvas-mount {
  position: relative;
  width: 100%;
  height: 480px;
  background: var(--bg-page);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
}

.control-sidebar {
  width: 340px;
  height: 480px;
  max-height: 480px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg, 12px);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.sidebar-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(0, 0, 0, 0.02);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
}

.sidebar-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.mode-pill-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mode-pill-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: right;
}

.mode-pill-btn.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: var(--accent-physics, #3b82f6);
  color: var(--accent-physics, #3b82f6);
  font-weight: 700;
}

.mode-icon {
  font-size: 14px;
}

.bottom-analysis-area {
  width: 100%;
  border-radius: var(--radius-lg, 12px);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.analysis-tabs-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(0, 0, 0, 0.02);
}

.tab-btn {
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn.active {
  background: var(--surface-input);
  color: var(--accent-physics, #3b82f6);
  font-weight: 700;
}

.tab-content-container {
  padding: 16px;
  min-height: 200px;
}

.probe-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.probe-card {
  padding: 14px;
  border-radius: 8px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.probe-card.highlight-card {
  border-color: #3b82f6;
}

.card-title {
  font-size: 11.5px;
  color: var(--text-secondary);
}

.card-value {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
}

.card-sub {
  font-size: 11px;
  color: var(--text-secondary);
}

.text-danger {
  color: #ef4444;
}

.text-success {
  color: #10b981;
}

.text-primary {
  color: var(--text-primary);
}

.theory-prose {
  margin-top: 14px;
  line-height: 1.8;
  font-size: 13px;
  color: var(--text-secondary);
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notes-textarea {
  width: 100%;
  min-height: 120px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--surface-input);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 12.5px;
  resize: vertical;
}

.btn-save-note {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: var(--surface-input);
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
}

.ltr-island {
  direction: ltr;
  display: inline-block;
}

@media (min-width: 1024px) {
  .mobile-only {
    display: none !important;
  }
}

@media (max-width: 1023px) {
  .desktop-only {
    display: none !important;
  }
  .experiment-workspace {
    grid-template-columns: 1fr;
  }
}
</style>
