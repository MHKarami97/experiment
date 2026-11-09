<template>
  <div class="doppler-effect-experiment">
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
          <DopplerCanvas
            ref="canvasViewRef"
            :params="internalParams"
            :derived="derivedConstants"
            :source-x="sourceX"
            :sim-time="simTime"
            :is-running="isRunning"
            :is-dark="store.theme === 'dark'"
            @update:observer-pos="onObserverPosUpdate"
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

          <!-- Variables Group -->
          <VariableGroup :title="$t('common.variables')">
            <UnitSlider
              id="sourceSpeed"
              v-model="uiParams.sourceSpeed"
              :label="$t('dopplerEffect.sourceSpeed')"
              unit="m/s"
              :min="0"
              :max="650"
              :step="10"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="observerSpeed"
              v-model="uiParams.observerSpeed"
              :label="$t('dopplerEffect.observerSpeed')"
              unit="m/s"
              :min="-60"
              :max="60"
              :step="5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="soundSpeed"
              v-model="uiParams.soundSpeed"
              :label="$t('dopplerEffect.soundSpeed')"
              unit="m/s"
              :min="300"
              :max="360"
              :step="1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="sourceFrequency"
              v-model="uiParams.sourceFrequency"
              :label="$t('dopplerEffect.sourceFrequency')"
              unit="Hz"
              :min="200"
              :max="1000"
              :step="20"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="observerOffset"
              v-model="uiParams.observerY"
              :label="$t('dopplerEffect.observerOffset')"
              unit="m"
              :min="0"
              :max="80"
              :step="5"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Real Mode Wind Group -->
          <VariableGroup v-if="mode === 'real'" :title="$t('heatEngines.modeReal')">
            <UnitSlider
              id="windSpeed"
              v-model="uiParams.windSpeed"
              :label="$t('dopplerEffect.windSpeed')"
              unit="m/s"
              :min="-30"
              :max="30"
              :step="2"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Save/Load State Slots -->
          <SlotManager
            experiment-id="physics/waves/doppler-effect"
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

          <VariableGroup :title="$t('common.variables')">
            <UnitSlider
              id="m-sourceSpeed"
              v-model="uiParams.sourceSpeed"
              :label="$t('dopplerEffect.sourceSpeed')"
              unit="m/s"
              :min="0"
              :max="650"
              :step="10"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="m-sourceFrequency"
              v-model="uiParams.sourceFrequency"
              :label="$t('dopplerEffect.sourceFrequency')"
              unit="Hz"
              :min="200"
              :max="1000"
              :step="20"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="m-observerOffset"
              v-model="uiParams.observerY"
              :label="$t('dopplerEffect.observerOffset')"
              unit="m"
              :min="0"
              :max="80"
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
          🚨 {{ $t('dopplerEffect.telemetryTitle') }}
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
            <div class="telemetry-card highlight-card">
              <span class="card-title">{{ $t('dopplerEffect.observedFreq') }}</span>
              <span class="card-value ltr-island">
                {{ derivedConstants.observedFrequency2D.toFixed(0) }} Hz
              </span>
              <span class="card-sub ltr-island">
                f' / f₀ = {{ derivedConstants.dopplerFactor.toFixed(2) }}×
              </span>
            </div>

            <div class="telemetry-card">
              <span class="card-title">{{ $t('dopplerEffect.sourceFreq') }}</span>
              <span class="card-value ltr-island">
                {{ uiParams.sourceFrequency.toFixed(0) }} Hz
              </span>
              <span class="card-sub ltr-island">
                λ₀ = {{ (uiParams.soundSpeed / uiParams.sourceFrequency).toFixed(2) }} m
              </span>
            </div>

            <div class="telemetry-card">
              <span class="card-title">{{ $t('dopplerEffect.machNumber') }}</span>
              <span class="card-value ltr-island" :class="{ 'text-danger': derivedConstants.isSupersonic }">
                M = {{ derivedConstants.machNumber.toFixed(2) }}
              </span>
              <span class="card-sub">
                {{ derivedConstants.isSonicBarrier ? $t('dopplerEffect.transonicState') : derivedConstants.isSupersonic ? $t('dopplerEffect.supersonicState') : $t('dopplerEffect.subsonicState') }}
              </span>
            </div>

            <div class="telemetry-card">
              <span class="card-title">{{ $t('dopplerEffect.shiftCents') }}</span>
              <span class="card-value ltr-island">
                {{ (derivedConstants.pitchShiftCents > 0 ? '+' : '') + derivedConstants.pitchShiftCents.toFixed(0) }}
              </span>
              <span class="card-sub ltr-island">
                {{ (derivedConstants.pitchShiftCents / 100).toFixed(1) }} semitones
              </span>
            </div>

            <div class="telemetry-card">
              <span class="card-title">{{ $t('dopplerEffect.wavelengthAhead') }}</span>
              <span class="card-value ltr-island">
                {{ derivedConstants.wavelengthAhead.toFixed(2) }} m
              </span>
              <span class="card-sub ltr-island">
                λ_behind = {{ derivedConstants.wavelengthBehind.toFixed(2) }} m
              </span>
            </div>

            <div class="telemetry-card" v-if="derivedConstants.isSupersonic">
              <span class="card-title">{{ $t('dopplerEffect.machAngle') }}</span>
              <span class="card-value ltr-island text-warning">
                μ = {{ derivedConstants.machAngleDeg.toFixed(1) }}°
              </span>
              <span class="card-sub">
                {{ $t('dopplerEffect.sonicBoom') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tab 2: Oscilloscope / Frequency Graph -->
        <div v-show="activeTab === 'graph'" class="tab-panel">
          <GraphPanel
            :current-series="series"
            :comparison-runs="comparisonRuns"
            x-label="Time (s)"
            y-label="Observed Frequency (Hz)"
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
              $t('dopplerEffect.observedFreq') + ' (Hz)',
              'Source X (m)',
              $t('dopplerEffect.machNumber'),
              $t('dopplerEffect.shiftCents'),
              $t('dopplerEffect.sourceFreq') + ' (Hz)'
            ]"
          />
        </div>

        <!-- Tab 4: Theory & Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel">
          <FormulaPanel
            :title="$t('dopplerEffect.theoryTitle')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('dopplerEffect.theoryP1') }}</p>
            <p>{{ $t('dopplerEffect.theoryP2') }}</p>
            <p>{{ $t('dopplerEffect.theoryP3') }}</p>
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
        :title="$t('experiments.dopplerEffect.title')"
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
  type DopplerParams,
  type DopplerDerived,
  calculateDopplerDerived
} from '../model/doppler-effect';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { dopplerEffectConfig } from '../config';

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
import DopplerCanvas from '../view/DopplerCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();

const canvasViewRef = ref<InstanceType<typeof DopplerCanvas> | null>(null);

// Simulation Controls — Starts PAUSED by default, runs only when play is pressed
const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('telemetry');
const userNotes = ref('');

const currentPresetId = ref<string>('subsonic_ambulance');

const presetOptions = computed<PresetOption[]>(() =>
  dopplerEffectConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }))
);

const uiParams = reactive<Record<string, number>>({
  sourceSpeed: 137,
  observerSpeed: 0,
  soundSpeed: 343,
  sourceFrequency: 440,
  sourceY: 0,
  observerX: 130,
  observerY: 35,
  windSpeed: 0,
});

const sourceX = ref(-80);

const internalParams = computed<DopplerParams>(() => ({
  sourceSpeed: uiParams.sourceSpeed,
  observerSpeed: uiParams.observerSpeed,
  soundSpeed: uiParams.soundSpeed,
  sourceFrequency: uiParams.sourceFrequency,
  sourceY: 0,
  observerX: uiParams.observerX,
  observerY: uiParams.observerY,
  windSpeed: uiParams.windSpeed,
  realMode: mode.value === 'real',
}));

const derivedConstants = computed<DopplerDerived>(() =>
  calculateDopplerDerived(internalParams.value, sourceX.value)
);

function onObserverPosUpdate(pos: { x: number; y: number }) {
  uiParams.observerX = pos.x;
  uiParams.observerY = pos.y;
}

// Guided Steps
const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step1',
    title: t('dopplerEffect.preset_subsonic_ambulance'),
    instruction: t('dopplerEffect.formula_wavelength_desc')
  },
  {
    id: 'step2',
    title: t('dopplerEffect.preset_sonic_barrier'),
    instruction: t('dopplerEffect.theoryP2')
  },
  {
    id: 'step3',
    title: t('dopplerEffect.preset_supersonic_jet'),
    instruction: t('dopplerEffect.formula_machCone_desc')
  },
  {
    id: 'step4',
    title: t('dopplerEffect.preset_moving_observer'),
    instruction: t('dopplerEffect.formula_doppler1D_desc')
  }
]);

// Theory Formulas
const formulaItems = computed<FormulaItem[]>(() =>
  dopplerEffectConfig.formulas.map((f) => ({
    title: t(f.titleKey),
    latex: f.latex,
    explanation: t(f.explanationKey),
  }))
);

// Animation & Accumulator Loop
const simTime = ref(0);
const series = reactive<DataSeries>({
  t: [0],
  x: [-80],
  y: [440],
  vx: [0.4],
  vy: [0],
  v: [440]
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

      // Move source continuously along corridor
      const vs = uiParams.sourceSpeed;
      sourceX.value += vs * dt * speed.value * 0.4;
      if (sourceX.value > 350) {
        sourceX.value = -80;
      }

      if (sampleTimer >= 0.06) {
        sampleTimer = 0;
        recordDataPoint();
      }
    },
    onRenderStep: () => {}
  });
}

function recordDataPoint() {
  const tSec = Number(simTime.value.toFixed(2));
  const d = derivedConstants.value;

  series.t.push(tSec);
  series.x.push(Number(sourceX.value.toFixed(1)));
  series.y.push(Number(d.observedFrequency2D.toFixed(0)));
  series.vx.push(Number(d.machNumber.toFixed(2)));
  series.vy.push(Number(d.pitchShiftCents.toFixed(0)));
  series.v.push(Number(uiParams.sourceFrequency.toFixed(0)));

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
  sourceX.value = -80;
  series.t = [0];
  series.x = [-80];
  series.y = [derivedConstants.value.observedFrequency2D];
  series.vx = [derivedConstants.value.machNumber];
  series.vy = [0];
  series.v = [uiParams.sourceFrequency];
}

function stepSimulation() {
  if (accumulator) {
    accumulator.pause();
  }
  isRunning.value = false;
  simTime.value += 0.04;
  sourceX.value += uiParams.sourceSpeed * 0.04 * 0.4;
  if (sourceX.value > 350) sourceX.value = -80;
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
    const existing = await db.notes.where('experimentId').equals('physics/waves/doppler-effect').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, { content: userNotes.value, updatedAt: Date.now() });
    } else {
      await db.notes.add({
        experimentId: 'physics/waves/doppler-effect',
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
    const saved = await db.notes.where('experimentId').equals('physics/waves/doppler-effect').first();
    if (saved) {
      userNotes.value = saved.content;
    }
  } catch {
    // ignore
  }
}

// Report Data
const calculatedResults = computed<Record<string, number | string>>(() => ({
  observedFrequency: derivedConstants.value.observedFrequency2D.toFixed(0),
  machNumber: derivedConstants.value.machNumber.toFixed(2),
  wavelengthAhead: derivedConstants.value.wavelengthAhead.toFixed(2),
  pitchShiftCents: derivedConstants.value.pitchShiftCents.toFixed(0),
  machAngleDeg: derivedConstants.value.machAngleDeg.toFixed(1),
}));

const reportResultsRows = computed(() => [
  { name: t('dopplerEffect.observedFreq'), simulated: `${derivedConstants.value.observedFrequency2D.toFixed(0)} Hz` },
  { name: t('dopplerEffect.sourceFreq'), simulated: `${uiParams.sourceFrequency.toFixed(0)} Hz` },
  { name: t('dopplerEffect.machNumber'), simulated: `M = ${derivedConstants.value.machNumber.toFixed(2)}` },
  { name: t('dopplerEffect.shiftCents'), simulated: `${derivedConstants.value.pitchShiftCents.toFixed(0)} cents` },
  { name: t('dopplerEffect.wavelengthAhead'), simulated: `${derivedConstants.value.wavelengthAhead.toFixed(2)} m` },
]);

const reportVariablesList = computed(() => [
  { name: t('dopplerEffect.sourceSpeed'), symbol: 'v_s', value: uiParams.sourceSpeed, unit: 'm/s' },
  { name: t('dopplerEffect.observerSpeed'), symbol: 'v_o', value: uiParams.observerSpeed, unit: 'm/s' },
  { name: t('dopplerEffect.soundSpeed'), symbol: 'v', value: uiParams.soundSpeed, unit: 'm/s' },
  { name: t('dopplerEffect.sourceFrequency'), symbol: 'f_0', value: uiParams.sourceFrequency, unit: 'Hz' },
  { name: t('dopplerEffect.observerOffset'), symbol: 'y', value: uiParams.observerY, unit: 'm' }
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
.doppler-effect-experiment {
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

.text-danger {
  color: #ef4444;
}

.text-warning {
  color: #f59e0b;
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
