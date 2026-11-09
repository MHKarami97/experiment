<template>
  <div class="beats-fourier-experiment">
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
          <BeatsFourierCanvas
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

          <!-- Mode Selector Pills -->
          <div class="control-section">
            <label class="control-label">{{ $t('beatsFourier.experimentMode') }}</label>
            <div class="mode-pill-list">
              <button
                v-for="(mItem, idx) in experimentModeOptions"
                :key="idx"
                type="button"
                class="mode-pill-btn"
                :class="{ active: uiParams.modeIndex === idx }"
                @click="uiParams.modeIndex = idx; onParamChange()"
              >
                <span class="mode-icon">{{ mItem.icon }}</span>
                <span class="mode-name">{{ mItem.label }}</span>
              </button>
            </div>
          </div>

          <!-- Variables Group -->
          <VariableGroup :title="$t('common.variables')">
            <!-- Beats Mode Controls -->
            <template v-if="uiParams.modeIndex === 0">
              <UnitSlider
                id="freq1"
                v-model="uiParams.freq1"
                :label="$t('beatsFourier.freq1')"
                unit="Hz"
                :min="400"
                :max="500"
                :step="0.5"
                @update:model-value="onParamChange"
              />
              <UnitSlider
                id="freq2"
                v-model="uiParams.freq2"
                :label="$t('beatsFourier.freq2')"
                unit="Hz"
                :min="400"
                :max="500"
                :step="0.5"
                @update:model-value="onParamChange"
              />
              <UnitSlider
                id="amplitude1"
                v-model="uiParams.amplitude1"
                :label="$t('beatsFourier.amplitude1')"
                unit=""
                :min="0.2"
                :max="1.0"
                :step="0.05"
                @update:model-value="onParamChange"
              />
              <UnitSlider
                id="amplitude2"
                v-model="uiParams.amplitude2"
                :label="$t('beatsFourier.amplitude2')"
                unit=""
                :min="0.2"
                :max="1.0"
                :step="0.05"
                @update:model-value="onParamChange"
              />
              <UnitSlider
                id="phaseDiffDeg"
                v-model="uiParams.phaseDiffDeg"
                :label="$t('beatsFourier.phaseDiff')"
                unit="°"
                :min="0"
                :max="360"
                :step="15"
                @update:model-value="onParamChange"
              />
            </template>

            <!-- Fourier Mode Controls -->
            <template v-else>
              <UnitSlider
                id="fourierHarmonicsCount"
                v-model="uiParams.fourierHarmonicsCount"
                :label="$t('beatsFourier.harmonicsCount')"
                unit=""
                :min="1"
                :max="11"
                :step="1"
                @update:model-value="onParamChange"
              />
              <UnitSlider
                id="fundamentalFreq"
                v-model="uiParams.fundamentalFreq"
                :label="$t('beatsFourier.fundamentalFreq')"
                unit="Hz"
                :min="110"
                :max="440"
                :step="10"
                @update:model-value="onParamChange"
              />
            </template>
          </VariableGroup>

          <!-- Real Mode Noise Group -->
          <VariableGroup v-if="mode === 'real'" :title="$t('heatEngines.modeReal')">
            <UnitSlider
              id="noiseLevel"
              v-model="uiParams.noiseLevel"
              :label="$t('beatsFourier.noiseLevel')"
              unit=""
              :min="0"
              :max="0.08"
              :step="0.005"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Save/Load State Slots -->
          <SlotManager
            experiment-id="physics/waves/beats-fourier"
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
            <label class="control-label">{{ $t('beatsFourier.experimentMode') }}</label>
            <div class="mode-pill-list">
              <button
                v-for="(mItem, idx) in experimentModeOptions"
                :key="idx"
                type="button"
                class="mode-pill-btn"
                :class="{ active: uiParams.modeIndex === idx }"
                @click="uiParams.modeIndex = idx; onParamChange()"
              >
                <span class="mode-icon">{{ mItem.icon }}</span>
                <span class="mode-name">{{ mItem.label }}</span>
              </button>
            </div>
          </div>

          <VariableGroup :title="$t('common.variables')">
            <UnitSlider
              v-if="uiParams.modeIndex === 0"
              id="m-freq1"
              v-model="uiParams.freq1"
              :label="$t('beatsFourier.freq1')"
              unit="Hz"
              :min="400"
              :max="500"
              :step="0.5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="uiParams.modeIndex === 0"
              id="m-freq2"
              v-model="uiParams.freq2"
              :label="$t('beatsFourier.freq2')"
              unit="Hz"
              :min="400"
              :max="500"
              :step="0.5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="uiParams.modeIndex !== 0"
              id="m-harmonics"
              v-model="uiParams.fourierHarmonicsCount"
              :label="$t('beatsFourier.harmonicsCount')"
              unit=""
              :min="1"
              :max="11"
              :step="1"
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
          🎵 {{ $t('beatsFourier.telemetryTitle') }}
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
        <!-- Tab 1: Telemetry Cards -->
        <div v-show="activeTab === 'telemetry'" class="tab-panel telemetry-tab">
          <div class="telemetry-cards-grid">
            <template v-if="uiParams.modeIndex === 0">
              <div class="telemetry-card highlight-card">
                <span class="card-title">{{ $t('beatsFourier.beatFreq') }}</span>
                <span class="card-value ltr-island">
                  {{ derivedConstants.beatFrequency.toFixed(2) }} Hz
                </span>
                <span class="card-sub">
                  {{ statusText }}
                </span>
              </div>

              <div class="telemetry-card">
                <span class="card-title">{{ $t('beatsFourier.carrierFreq') }}</span>
                <span class="card-value ltr-island">
                  {{ derivedConstants.carrierFrequency.toFixed(1) }} Hz
                </span>
                <span class="card-sub ltr-island">
                  f_avg = (f₁ + f₂) / 2
                </span>
              </div>

              <div class="telemetry-card">
                <span class="card-title">{{ $t('beatsFourier.beatPeriod') }}</span>
                <span class="card-value ltr-island">
                  {{ derivedConstants.beatPeriod < 100 ? derivedConstants.beatPeriod.toFixed(2) + ' s' : '∞' }}
                </span>
                <span class="card-sub ltr-island">
                  T_beat = 1 / |f₁ - f₂|
                </span>
              </div>

              <div class="telemetry-card">
                <span class="card-title">{{ $t('beatsFourier.maxAmp') }} / {{ $t('beatsFourier.minAmp') }}</span>
                <span class="card-value ltr-island">
                  {{ derivedConstants.maxEnvelope.toFixed(2) }} / {{ derivedConstants.minEnvelope.toFixed(2) }}
                </span>
                <span class="card-sub ltr-island">
                  Modulation {{ (derivedConstants.modulationDepth * 100).toFixed(0) }}%
                </span>
              </div>

              <div class="telemetry-card">
                <span class="card-title">{{ $t('beatsFourier.freq1') }}</span>
                <span class="card-value ltr-island">
                  {{ uiParams.freq1.toFixed(1) }} Hz
                </span>
                <span class="card-sub ltr-island">
                  A₁ = {{ uiParams.amplitude1.toFixed(2) }}
                </span>
              </div>

              <div class="telemetry-card">
                <span class="card-title">{{ $t('beatsFourier.freq2') }}</span>
                <span class="card-value ltr-island">
                  {{ uiParams.freq2.toFixed(1) }} Hz
                </span>
                <span class="card-sub ltr-island">
                  A₂ = {{ uiParams.amplitude2.toFixed(2) }}
                </span>
              </div>
            </template>

            <template v-else>
              <div class="telemetry-card highlight-card">
                <span class="card-title">{{ $t('beatsFourier.fundamentalFreq') }}</span>
                <span class="card-value ltr-island">
                  {{ uiParams.fundamentalFreq }} Hz
                </span>
                <span class="card-sub ltr-island">
                  T₀ = {{ (1000 / uiParams.fundamentalFreq).toFixed(2) }} ms
                </span>
              </div>

              <div class="telemetry-card">
                <span class="card-title">{{ $t('beatsFourier.harmonicsCount') }}</span>
                <span class="card-value ltr-island">
                  N = {{ uiParams.fourierHarmonicsCount }}
                </span>
                <span class="card-sub">
                  {{ experimentModeOptions[uiParams.modeIndex].label }}
                </span>
              </div>

              <div class="telemetry-card">
                <span class="card-title">Highest Frequency</span>
                <span class="card-value ltr-island">
                  {{ derivedConstants.activeHarmonics.length > 0 ? derivedConstants.activeHarmonics[derivedConstants.activeHarmonics.length - 1].freq + ' Hz' : '' }}
                </span>
                <span class="card-sub ltr-island">
                  n = {{ derivedConstants.activeHarmonics.length > 0 ? derivedConstants.activeHarmonics[derivedConstants.activeHarmonics.length - 1].n : 1 }}
                </span>
              </div>
            </template>
          </div>
        </div>

        <!-- Tab 2: Oscilloscope / Waveform Graph -->
        <div v-show="activeTab === 'graph'" class="tab-panel">
          <GraphPanel
            :current-series="series"
            :comparison-runs="comparisonRuns"
            x-label="Time (s)"
            y-label="Amplitude (a.u.)"
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
              'y_total',
              'y₁',
              'y₂',
              $t('beatsFourier.beatFreq') + ' (Hz)',
              $t('beatsFourier.carrierFreq') + ' (Hz)'
            ]"
          />
        </div>

        <!-- Tab 4: Theory & Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel">
          <FormulaPanel
            :title="$t('beatsFourier.theoryTitle')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('beatsFourier.theoryP1') }}</p>
            <p>{{ $t('beatsFourier.theoryP2') }}</p>
            <p>{{ $t('beatsFourier.theoryP3') }}</p>
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
        :title="$t('experiments.beatsFourier.title')"
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
  type BeatsFourierMode,
  type BeatsFourierParams,
  type BeatsFourierDerived,
  calculateBeatsDerived,
  evaluateWaveformAt
} from '../model/beats-fourier';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { beatsFourierConfig } from '../config';

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
import BeatsFourierCanvas from '../view/BeatsFourierCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();

const canvasViewRef = ref<InstanceType<typeof BeatsFourierCanvas> | null>(null);

// Simulation Controls — Starts PAUSED by default, runs only when play is pressed
const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('telemetry');
const userNotes = ref('');

const modeKeys: BeatsFourierMode[] = [
  'beats',
  'fourier_square',
  'fourier_sawtooth',
  'fourier_triangle'
];

const experimentModeOptions = computed(() => [
  { label: t('beatsFourier.mode_beats'), icon: '🎵' },
  { label: t('beatsFourier.mode_fourier_square'), icon: '🔲' },
  { label: t('beatsFourier.mode_fourier_sawtooth'), icon: '🪚' },
  { label: t('beatsFourier.mode_fourier_triangle'), icon: '🔺' },
]);

const currentPresetId = ref<string>('standard_beats');

const presetOptions = computed<PresetOption[]>(() =>
  beatsFourierConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }))
);

const uiParams = reactive<Record<string, number>>({
  modeIndex: 0,
  freq1: 440,
  freq2: 444,
  amplitude1: 1.0,
  amplitude2: 1.0,
  phaseDiffDeg: 0,
  fourierHarmonicsCount: 5,
  fundamentalFreq: 220,
  noiseLevel: 0.02,
});

const internalParams = computed<BeatsFourierParams>(() => ({
  mode: modeKeys[uiParams.modeIndex] || 'beats',
  freq1: uiParams.freq1,
  freq2: uiParams.freq2,
  amplitude1: uiParams.amplitude1,
  amplitude2: uiParams.amplitude2,
  phaseDiffDeg: uiParams.phaseDiffDeg,
  fourierHarmonicsCount: uiParams.fourierHarmonicsCount,
  fundamentalFreq: uiParams.fundamentalFreq,
  noiseLevel: uiParams.noiseLevel,
  realMode: mode.value === 'real',
}));

const derivedConstants = computed<BeatsFourierDerived>(() =>
  calculateBeatsDerived(internalParams.value)
);

const statusText = computed(() => {
  const s = derivedConstants.value.tuningStatus;
  if (s === 'in_tune') return t('beatsFourier.status_in_tune');
  if (s === 'slow_beat') return t('beatsFourier.status_slow_beat');
  if (s === 'fast_beat') return t('beatsFourier.status_fast_beat');
  return t('beatsFourier.status_roughness');
});

// Guided Steps
const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step1',
    title: t('beatsFourier.preset_standard_beats'),
    instruction: t('beatsFourier.formula_beat_desc')
  },
  {
    id: 'step2',
    title: t('beatsFourier.preset_unison'),
    instruction: t('beatsFourier.theoryP2')
  },
  {
    id: 'step3',
    title: t('beatsFourier.preset_fourier_square'),
    instruction: t('beatsFourier.formula_fourier_desc')
  },
  {
    id: 'step4',
    title: t('beatsFourier.preset_fourier_sawtooth'),
    instruction: t('beatsFourier.theoryP3')
  }
]);

// Theory Formulas
const formulaItems = computed<FormulaItem[]>(() =>
  beatsFourierConfig.formulas.map((f) => ({
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
  vy: [4],
  v: [442]
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

      if (sampleTimer >= 0.04) {
        sampleTimer = 0;
        recordDataPoint();
      }
    },
    onRenderStep: () => {}
  });
}

function recordDataPoint() {
  const tSec = Number(simTime.value.toFixed(3));
  const pt = evaluateWaveformAt(simTime.value, internalParams.value);
  const d = derivedConstants.value;

  series.t.push(tSec);
  series.x.push(Number(pt.y1.toFixed(3)));
  series.y.push(Number(pt.yTotal.toFixed(3)));
  series.vx.push(Number(pt.y2.toFixed(3)));
  series.vy.push(Number(d.beatFrequency.toFixed(1)));
  series.v.push(Number(d.carrierFrequency.toFixed(1)));

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
  series.x = [0];
  series.y = [0];
  series.vx = [0];
  series.vy = [derivedConstants.value.beatFrequency];
  series.v = [derivedConstants.value.carrierFrequency];
}

function stepSimulation() {
  if (accumulator) {
    accumulator.pause();
  }
  isRunning.value = false;
  simTime.value += 0.02 * speed.value;
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
  if (preset.id.startsWith('fourier_square')) {
    uiParams.modeIndex = 1;
  } else if (preset.id.startsWith('fourier_sawtooth')) {
    uiParams.modeIndex = 2;
  } else if (preset.id.startsWith('fourier_triangle')) {
    uiParams.modeIndex = 3;
  } else {
    uiParams.modeIndex = 0;
  }
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
    const existing = await db.notes.where('experimentId').equals('physics/waves/beats-fourier').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, { content: userNotes.value, updatedAt: Date.now() });
    } else {
      await db.notes.add({
        experimentId: 'physics/waves/beats-fourier',
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
    const saved = await db.notes.where('experimentId').equals('physics/waves/beats-fourier').first();
    if (saved) {
      userNotes.value = saved.content;
    }
  } catch {
    // ignore
  }
}

// Report Data
const calculatedResults = computed<Record<string, number | string>>(() => ({
  beatFrequency: derivedConstants.value.beatFrequency.toFixed(2),
  carrierFrequency: derivedConstants.value.carrierFrequency.toFixed(1),
  beatPeriod: derivedConstants.value.beatPeriod.toFixed(2),
  modulationDepth: `${(derivedConstants.value.modulationDepth * 100).toFixed(0)}%`,
  tuningStatus: statusText.value,
}));

const reportResultsRows = computed(() => [
  { name: t('beatsFourier.beatFreq'), simulated: `${derivedConstants.value.beatFrequency.toFixed(2)} Hz` },
  { name: t('beatsFourier.carrierFreq'), simulated: `${derivedConstants.value.carrierFrequency.toFixed(1)} Hz` },
  { name: t('beatsFourier.beatPeriod'), simulated: `${derivedConstants.value.beatPeriod < 100 ? derivedConstants.value.beatPeriod.toFixed(2) + ' s' : '∞'}` },
  { name: t('beatsFourier.modDepth'), simulated: `${(derivedConstants.value.modulationDepth * 100).toFixed(0)}%` },
  { name: t('beatsFourier.tuningState'), simulated: statusText.value },
]);

const reportVariablesList = computed(() => [
  { name: t('beatsFourier.experimentMode'), symbol: 'Mode', value: experimentModeOptions.value[uiParams.modeIndex].label, unit: '' },
  { name: t('beatsFourier.freq1'), symbol: 'f₁', value: uiParams.freq1, unit: 'Hz' },
  { name: t('beatsFourier.freq2'), symbol: 'f₂', value: uiParams.freq2, unit: 'Hz' },
  { name: t('beatsFourier.amplitude1'), symbol: 'A₁', value: uiParams.amplitude1, unit: '' },
  { name: t('beatsFourier.amplitude2'), symbol: 'A₂', value: uiParams.amplitude2, unit: '' },
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
.beats-fourier-experiment {
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
  font-size: 12px;
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
  font-size: 15px;
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
