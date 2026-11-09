<template>
  <div class="standing-waves-experiment">
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
          <StandingWavesCanvas
            ref="canvasViewRef"
            :params="internalParams"
            :derived="derivedConstants"
            :sim-time="simTime"
            :is-running="isRunning"
            :is-dark="store.theme === 'dark'"
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

          <!-- System Mode Selector Pills -->
          <div class="control-section">
            <label class="control-label">{{ $t('standingWaves.systemMode') }}</label>
            <div class="mode-pill-list">
              <button
                v-for="(sItem, idx) in systemOptions"
                :key="idx"
                type="button"
                class="mode-pill-btn"
                :class="{ active: uiParams.systemModeIndex === idx }"
                @click="uiParams.systemModeIndex = idx; onParamChange()"
              >
                <span class="mode-icon">{{ sItem.icon }}</span>
                <span class="mode-name">{{ sItem.label }}</span>
              </button>
            </div>
          </div>

          <!-- Variables Group -->
          <VariableGroup :title="$t('common.variables')">
            <UnitSlider
              id="harmonicNumber"
              v-model="uiParams.harmonicNumber"
              :label="$t('standingWaves.harmonicNumber')"
              unit=""
              :min="1"
              :max="6"
              :step="1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="length"
              v-model="uiParams.length"
              :label="$t('standingWaves.length')"
              unit="m"
              :min="0.5"
              :max="2.5"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="uiParams.systemModeIndex === 0"
              id="tension"
              v-model="uiParams.tension"
              :label="$t('standingWaves.tension')"
              unit="N"
              :min="5"
              :max="100"
              :step="5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="uiParams.systemModeIndex === 0"
              id="linearDensity"
              v-model="uiParams.linearDensityGPerM"
              :label="$t('standingWaves.linearDensity')"
              unit="g/m"
              :min="0.5"
              :max="8.0"
              :step="0.5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="uiParams.systemModeIndex !== 0"
              id="soundSpeed"
              v-model="uiParams.soundSpeed"
              :label="$t('standingWaves.soundSpeed')"
              unit="m/s"
              :min="320"
              :max="360"
              :step="1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Real Mode Damping Group -->
          <VariableGroup v-if="mode === 'real'" :title="$t('heatEngines.modeReal')">
            <UnitSlider
              id="damping"
              v-model="uiParams.damping"
              :label="$t('standingWaves.damping')"
              unit=""
              :min="0.01"
              :max="0.08"
              :step="0.005"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Save/Load State Slots -->
          <SlotManager
            experiment-id="physics/waves/standing-waves"
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
            <label class="control-label">{{ $t('standingWaves.systemMode') }}</label>
            <div class="mode-pill-list">
              <button
                v-for="(sItem, idx) in systemOptions"
                :key="idx"
                type="button"
                class="mode-pill-btn"
                :class="{ active: uiParams.systemModeIndex === idx }"
                @click="uiParams.systemModeIndex = idx; onParamChange()"
              >
                <span class="mode-icon">{{ sItem.icon }}</span>
                <span class="mode-name">{{ sItem.label }}</span>
              </button>
            </div>
          </div>

          <VariableGroup :title="$t('common.variables')">
            <UnitSlider
              id="m-harmonicNumber"
              v-model="uiParams.harmonicNumber"
              :label="$t('standingWaves.harmonicNumber')"
              unit=""
              :min="1"
              :max="6"
              :step="1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="m-length"
              v-model="uiParams.length"
              :label="$t('standingWaves.length')"
              unit="m"
              :min="0.5"
              :max="2.5"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="uiParams.systemModeIndex === 0"
              id="m-tension"
              v-model="uiParams.tension"
              :label="$t('standingWaves.tension')"
              unit="N"
              :min="5"
              :max="100"
              :step="5"
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
          :class="{ active: activeTab === 'telemetry' }"
          @click="activeTab = 'telemetry'"
        >
          🎵 {{ $t('standingWaves.harmonicTitle') }}
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
        <!-- Tab 1: Harmonic Telemetry -->
        <div v-show="activeTab === 'telemetry'" class="tab-panel telemetry-tab">
          <div class="telemetry-cards-grid">
            <div class="telemetry-card highlight-card">
              <span class="card-title">{{ $t('standingWaves.resonantFreq') }}</span>
              <span class="card-value ltr-island">
                {{ derivedConstants.resonantFrequency.toFixed(1) }} Hz
              </span>
              <span class="card-sub ltr-island">
                ω = {{ derivedConstants.angularFrequency.toFixed(1) }} rad/s
              </span>
            </div>

            <div class="telemetry-card">
              <span class="card-title">{{ $t('standingWaves.fundamentalFreq') }}</span>
              <span class="card-value ltr-island">
                {{ derivedConstants.fundamentalFrequency.toFixed(1) }} Hz
              </span>
              <span class="card-sub ltr-island">
                f_{{ uiParams.harmonicNumber }} = {{ (derivedConstants.resonantFrequency / Math.max(0.01, derivedConstants.fundamentalFrequency)).toFixed(1) }} × f₁
              </span>
            </div>

            <div class="telemetry-card">
              <span class="card-title">{{ $t('standingWaves.wavelength') }} (λ)</span>
              <span class="card-value ltr-island">
                {{ derivedConstants.wavelength.toFixed(2) }} m
              </span>
              <span class="card-sub ltr-island">
                k = {{ derivedConstants.wavenumber.toFixed(2) }} rad/m
              </span>
            </div>

            <div class="telemetry-card">
              <span class="card-title">{{ $t('standingWaves.waveSpeed') }} (v)</span>
              <span class="card-value ltr-island">
                {{ derivedConstants.waveSpeed.toFixed(1) }} m/s
              </span>
              <span class="card-sub">
                {{ uiParams.systemModeIndex === 0 ? 'v = √(T/μ)' : 'سرعت صوت در ستون هوا' }}
              </span>
            </div>

            <div class="telemetry-card">
              <span class="card-title">{{ $t('standingWaves.nodesCount') }}</span>
              <span class="card-value ltr-island">
                {{ derivedConstants.nodeCount }}
              </span>
              <span class="card-sub">
                {{ derivedConstants.nodePositions.map(p => p.toFixed(2)).join(', ') }} m
              </span>
            </div>

            <div class="telemetry-card">
              <span class="card-title">{{ $t('standingWaves.antinodesCount') }}</span>
              <span class="card-value ltr-island">
                {{ derivedConstants.antinodeCount }}
              </span>
              <span class="card-sub">
                {{ derivedConstants.antinodePositions.map(p => p.toFixed(2)).join(', ') }} m
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
            y-label="Displacement (a.u.)"
            x-key="t"
            y-key="y"
          />
        </div>

        <!-- Tab 3: Data Table -->
        <div v-show="activeTab === 'table'" class="tab-panel">
          <DataTable
            :series="series"
            :column-keys="['t', 'y', 'x', 'vx', 'vy', 'v']"
            :column-labels="[
              $t('common.time') + ' (s)',
              $t('standingWaves.tool_envelope'),
              $t('standingWaves.wavelength') + ' (m)',
              $t('standingWaves.resonantFreq') + ' (Hz)',
              $t('standingWaves.waveSpeed') + ' (m/s)',
              $t('standingWaves.nodesCount')
            ]"
          />
        </div>

        <!-- Tab 4: Theory & Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel">
          <FormulaPanel
            :title="$t('standingWaves.theoryTitle')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('standingWaves.theoryP1') }}</p>
            <p>{{ $t('standingWaves.theoryP2') }}</p>
            <p>{{ $t('standingWaves.theoryP3') }}</p>
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
        :title="$t('experiments.standingWaves.title')"
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
  type StandingWaveSystem,
  type StandingWaveParams,
  type StandingWaveDerived,
  calculateStandingWaveDerived,
  calculateWaveProfile
} from '../model/standing-waves';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { standingWavesConfig } from '../config';

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
import StandingWavesCanvas from '../view/StandingWavesCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();

const canvasViewRef = ref<InstanceType<typeof StandingWavesCanvas> | null>(null);

// Simulation Controls — Starts PAUSED by default, runs only when play is pressed
const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('telemetry');
const userNotes = ref('');

const systemModeKeys: StandingWaveSystem[] = ['string', 'open_pipe', 'closed_pipe'];

const systemOptions = computed(() => [
  { label: t('standingWaves.mode_string'), icon: '🎸' },
  { label: t('standingWaves.mode_open_pipe'), icon: '🎺' },
  { label: t('standingWaves.mode_closed_pipe'), icon: '🧪' },
]);

const currentPresetId = ref<string>('fundamental_string');

const presetOptions = computed<PresetOption[]>(() =>
  standingWavesConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }))
);

const uiParams = reactive<Record<string, number>>({
  systemModeIndex: 0,
  harmonicNumber: 1,
  length: 1.2,
  tension: 45,
  linearDensityGPerM: 2.0,
  soundSpeed: 343,
  damping: 0.025,
});

const internalParams = computed<StandingWaveParams>(() => ({
  system: systemModeKeys[uiParams.systemModeIndex] || 'string',
  harmonicNumber: uiParams.harmonicNumber,
  length: uiParams.length,
  tension: uiParams.tension,
  linearDensityGPerM: uiParams.linearDensityGPerM,
  soundSpeed: uiParams.soundSpeed,
  autoResonance: true,
  damping: uiParams.damping,
  realMode: mode.value === 'real',
}));

const derivedConstants = computed<StandingWaveDerived>(() =>
  calculateStandingWaveDerived(internalParams.value)
);

// Guided Steps
const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step1',
    title: t('standingWaves.preset_fundamental_string'),
    instruction: t('standingWaves.formula_stringHarmonics_desc')
  },
  {
    id: 'step2',
    title: t('standingWaves.preset_second_harmonic_string'),
    instruction: t('standingWaves.formula_standingEquation_desc')
  },
  {
    id: 'step3',
    title: t('standingWaves.preset_open_pipe'),
    instruction: t('standingWaves.formula_stringHarmonics_desc')
  },
  {
    id: 'step4',
    title: t('standingWaves.preset_closed_pipe'),
    instruction: t('standingWaves.formula_closedPipeHarmonics_desc')
  }
]);

// Theory Formulas
const formulaItems = computed<FormulaItem[]>(() =>
  standingWavesConfig.formulas.map((f) => ({
    title: t(f.titleKey),
    latex: f.latex,
    explanation: t(f.explanationKey),
  }))
);

// Animation & Accumulator Loop
const simTime = ref(0);
const series = reactive<DataSeries>({
  t: [0],
  x: [0],
  y: [0],
  vx: [0],
  vy: [0],
  v: [0]
});
const comparisonRuns = ref<ComparisonRun[]>([]);

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
    }
  });
}

function recordDataPoint() {
  const tSec = Number(simTime.value.toFixed(2));
  const d = derivedConstants.value;
  const centerProfile = calculateWaveProfile(1, simTime.value, internalParams.value, d);
  const yMid = centerProfile.length > 0 ? centerProfile[0].displacement : 0;

  series.t.push(tSec);
  series.x.push(Number(d.wavelength.toFixed(2)));
  series.y.push(Number(yMid.toFixed(2)));
  series.vx.push(Number(d.resonantFrequency.toFixed(1)));
  series.vy.push(Number(d.waveSpeed.toFixed(1)));
  series.v.push(Number(d.nodeCount));

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
  series.x = [Number(derivedConstants.value.wavelength.toFixed(2))];
  series.y = [0];
  series.vx = [Number(derivedConstants.value.resonantFrequency.toFixed(1))];
  series.vy = [Number(derivedConstants.value.waveSpeed.toFixed(1))];
  series.v = [derivedConstants.value.nodeCount];
}

function stepSimulation() {
  if (accumulator) {
    accumulator.pause();
  }
  isRunning.value = false;
  simTime.value += 0.04;
  recordDataPoint();
}

function setSpeed(newSpeed: number) {
  speed.value = newSpeed;
  if (accumulator) {
    accumulator.setSpeed(newSpeed);
  }
}

function setMode(newMode: 'ideal' | 'real') {
  mode.value = newMode;
  onParamChange();
}

function applyPreset(preset: PresetOption) {
  currentPresetId.value = preset.id;
  Object.assign(uiParams, preset.params);
  resetSimulation();
}

function onParamChange() {
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

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/waves/standing-waves').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, { content: userNotes.value, updatedAt: Date.now() });
    } else {
      await db.notes.add({
        experimentId: 'physics/waves/standing-waves',
        content: userNotes.value,
        updatedAt: Date.now()
      });
    }
  } catch (err) {
    console.error('Failed to save notes:', err);
  }
}

async function loadNotes() {
  try {
    const saved = await db.notes.where('experimentId').equals('physics/waves/standing-waves').first();
    if (saved) {
      userNotes.value = saved.content;
    }
  } catch {
    // ignore
  }
}

// Report Data
const calculatedResults = computed<Record<string, number | string>>(() => ({
  resonantFrequency: derivedConstants.value.resonantFrequency.toFixed(1),
  fundamentalFrequency: derivedConstants.value.fundamentalFrequency.toFixed(1),
  wavelength: derivedConstants.value.wavelength.toFixed(2),
  waveSpeed: derivedConstants.value.waveSpeed.toFixed(1),
  nodeCount: derivedConstants.value.nodeCount,
  antinodeCount: derivedConstants.value.antinodeCount,
}));

const reportResultsRows = computed(() => [
  { name: t('standingWaves.resonantFreq'), simulated: `${derivedConstants.value.resonantFrequency.toFixed(1)} Hz` },
  { name: t('standingWaves.fundamentalFreq'), simulated: `${derivedConstants.value.fundamentalFrequency.toFixed(1)} Hz` },
  { name: t('standingWaves.wavelength'), simulated: `${derivedConstants.value.wavelength.toFixed(2)} m` },
  { name: t('standingWaves.waveSpeed'), simulated: `${derivedConstants.value.waveSpeed.toFixed(1)} m/s` },
  { name: t('standingWaves.nodesCount'), simulated: `${derivedConstants.value.nodeCount}` },
  { name: t('standingWaves.antinodesCount'), simulated: `${derivedConstants.value.antinodeCount}` }
]);

const reportVariablesList = computed(() => [
  { name: t('standingWaves.systemMode'), symbol: 'System', value: systemOptions.value[uiParams.systemModeIndex]?.label || '', unit: '' },
  { name: t('standingWaves.harmonicNumber'), symbol: 'n', value: uiParams.harmonicNumber, unit: '' },
  { name: t('standingWaves.length'), symbol: 'L', value: uiParams.length, unit: 'm' },
  { name: t('standingWaves.tension'), symbol: 'T', value: uiParams.tension, unit: 'N' },
  { name: t('standingWaves.linearDensity'), symbol: 'μ', value: uiParams.linearDensityGPerM, unit: 'g/m' }
]);

onMounted(() => {
  initLoop();
  loadNotes();
  resetSimulation();
});

onBeforeUnmount(() => {
  accumulator?.pause();
});
</script>

<style scoped>
.standing-waves-experiment {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 100%;
}

.experiment-workspace {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
  align-items: flex-start;
  width: 100%;
}

.scene-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.canvas-mount {
  position: relative;
  width: 100%;
  height: 480px;
  background: var(--bg-page);
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.control-sidebar {
  display: flex;
  flex-direction: column;
  height: 480px;
  max-height: 480px;
  padding: 16px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
}

.sidebar-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-inline-end: 4px;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.mode-pill-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mode-pill-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md, 8px);
  color: var(--text-primary);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: start;
}

.mode-pill-btn:hover {
  border-color: var(--accent-physics, #3b82f6);
}

.mode-pill-btn.active {
  background: rgba(59, 130, 246, 0.12);
  border-color: var(--accent-physics, #3b82f6);
  color: var(--accent-physics, #3b82f6);
  font-weight: 600;
}

.mode-icon {
  font-size: 16px;
}

.bottom-analysis-area {
  display: flex;
  flex-direction: column;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
}

.analysis-tabs-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
  overflow-x: auto;
}

.tab-btn {
  padding: 8px 14px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md, 8px);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--surface-input);
}

.tab-btn.active {
  color: var(--accent-physics, #3b82f6);
  background: rgba(59, 130, 246, 0.1);
}

.tab-content-container {
  padding: 16px;
}

.telemetry-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.telemetry-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md, 8px);
}

.highlight-card {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.35);
}

.card-title {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.card-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.card-sub {
  font-size: 11.5px;
  color: var(--text-secondary);
}

.notes-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notes-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-save-note {
  padding: 6px 14px;
  background: var(--accent-physics, #3b82f6);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

.notes-textarea {
  width: 100%;
  min-height: 140px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--surface-input);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  resize: vertical;
}

.theory-prose {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--text-primary);
}

.ltr-island {
  direction: ltr;
  display: inline-block;
}

.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

@media (max-width: 1023px) {
  .experiment-workspace {
    grid-template-columns: 1fr;
  }
  .desktop-only {
    display: none;
  }
  .mobile-only {
    display: block;
  }
  .canvas-mount {
    height: 380px;
  }
}
</style>
