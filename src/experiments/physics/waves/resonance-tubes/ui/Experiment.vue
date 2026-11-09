<template>
  <div class="resonance-tubes-experiment">
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
          <ResonanceTubesCanvas
            ref="canvasViewRef"
            :params="internalParams"
            :derived="derivedConstants"
            :sim-time="simTime"
            :is-running="isRunning"
            :is-dark="store.theme === 'dark'"
            @update:column-length="onCanvasLengthUpdate"
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

          <!-- System Type Selector Pills -->
          <div class="control-section">
            <label class="control-label">{{ $t('resonanceTubes.systemType') }}</label>
            <div class="mode-pill-list">
              <button
                type="button"
                class="mode-pill-btn"
                :class="{ active: uiParams.systemTypeIndex === 0 }"
                @click="uiParams.systemTypeIndex = 0; onParamChange()"
              >
                <span class="mode-icon">🧪</span>
                <span class="mode-name">{{ $t('resonanceTubes.system_water_column') }}</span>
              </button>
              <button
                type="button"
                class="mode-pill-btn"
                :class="{ active: uiParams.systemTypeIndex === 1 }"
                @click="uiParams.systemTypeIndex = 1; onParamChange()"
              >
                <span class="mode-icon">🏺</span>
                <span class="mode-name">{{ $t('resonanceTubes.system_helmholtz') }}</span>
              </button>
            </div>
          </div>

          <!-- Variables Group -->
          <VariableGroup :title="$t('common.variables')">
            <!-- Frequency Slider -->
            <UnitSlider
              id="frequency"
              v-model="uiParams.frequency"
              :label="$t('resonanceTubes.frequency')"
              unit="Hz"
              :min="256"
              :max="1024"
              :step="16"
              @update:model-value="onParamChange"
            />

            <!-- Air Column Length Slider -->
            <UnitSlider
              id="columnLength"
              v-model="uiParams.columnLength"
              :label="$t('resonanceTubes.columnLength')"
              unit="m"
              :min="0.05"
              :max="1.10"
              :step="0.005"
              @update:model-value="onParamChange"
            />

            <!-- Temperature Slider -->
            <UnitSlider
              id="temperatureC"
              v-model="uiParams.temperatureC"
              :label="$t('resonanceTubes.temperatureC')"
              unit="°C"
              :min="0"
              :max="45"
              :step="1"
              @update:model-value="onParamChange"
            />

            <!-- Tube Radius Slider -->
            <UnitSlider
              id="tubeRadiusMm"
              v-model="uiParams.tubeRadiusMm"
              :label="$t('resonanceTubes.tubeRadius')"
              unit="mm"
              :min="10"
              :max="35"
              :step="1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Real Mode Group (Humidity) -->
          <VariableGroup v-if="mode === 'real'" :title="$t('resonanceTubes.real_humidity_effect')">
            <UnitSlider
              id="relativeHumidity"
              v-model="uiParams.relativeHumidity"
              :label="$t('resonanceTubes.humidity')"
              unit="%"
              :min="10"
              :max="95"
              :step="5"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Save/Load State Slots -->
          <SlotManager
            experiment-id="physics/waves/resonance-tubes"
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
            <label class="control-label">{{ $t('resonanceTubes.systemType') }}</label>
            <div class="mode-pill-list">
              <button
                type="button"
                class="mode-pill-btn"
                :class="{ active: uiParams.systemTypeIndex === 0 }"
                @click="uiParams.systemTypeIndex = 0; onParamChange()"
              >
                <span>🧪 {{ $t('resonanceTubes.system_water_column') }}</span>
              </button>
              <button
                type="button"
                class="mode-pill-btn"
                :class="{ active: uiParams.systemTypeIndex === 1 }"
                @click="uiParams.systemTypeIndex = 1; onParamChange()"
              >
                <span>🏺 {{ $t('resonanceTubes.system_helmholtz') }}</span>
              </button>
            </div>
          </div>

          <VariableGroup :title="$t('common.variables')">
            <UnitSlider
              id="m-frequency"
              v-model="uiParams.frequency"
              :label="$t('resonanceTubes.frequency')"
              unit="Hz"
              :min="256"
              :max="1024"
              :step="16"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="m-columnLength"
              v-model="uiParams.columnLength"
              :label="$t('resonanceTubes.columnLength')"
              unit="m"
              :min="0.05"
              :max="1.10"
              :step="0.005"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="m-temperatureC"
              v-model="uiParams.temperatureC"
              :label="$t('resonanceTubes.temperatureC')"
              unit="°C"
              :min="0"
              :max="45"
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
          🔬 {{ $t('resonanceTubes.telemetryTitle') }}
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
          📚 {{ $t('common.theory') }}
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
          💡 {{ $t('common.guidedSteps') }}
        </button>
      </nav>

      <!-- Tab Content Body -->
      <div class="analysis-tab-content">
        <!-- Tab 1: Live Telemetry Cards -->
        <div v-show="activeTab === 'telemetry'" class="tab-panel telemetry-panel">
          <div class="telemetry-grid">
            <div class="telemetry-card">
              <span class="telemetry-label">{{ $t('resonanceTubes.soundSpeed') }}</span>
              <span class="telemetry-val ltr-island">{{ derivedConstants.soundSpeed.toFixed(2) }} m/s</span>
              <span class="telemetry-sub">v(T = {{ uiParams.temperatureC }}°C)</span>
            </div>

            <div class="telemetry-card">
              <span class="telemetry-label">{{ $t('resonanceTubes.wavelength') }}</span>
              <span class="telemetry-val ltr-island">{{ derivedConstants.wavelength.toFixed(3) }} m</span>
              <span class="telemetry-sub">λ = v / f</span>
            </div>

            <div class="telemetry-card">
              <span class="telemetry-label">{{ $t('resonanceTubes.endCorrection') }}</span>
              <span class="telemetry-val ltr-island">{{ (derivedConstants.endCorrection * 1000).toFixed(1) }} mm</span>
              <span class="telemetry-sub">ΔL = 0.61 × r</span>
            </div>

            <div class="telemetry-card">
              <span class="telemetry-label">{{ $t('resonanceTubes.effectiveLength') }}</span>
              <span class="telemetry-val ltr-island">{{ (derivedConstants.effectiveLength * 100).toFixed(2) }} cm</span>
              <span class="telemetry-sub">L + ΔL</span>
            </div>

            <div class="telemetry-card highlight-card">
              <span class="telemetry-label">{{ $t('resonanceTubes.measuredSpeed') }}</span>
              <span class="telemetry-val ltr-island">{{ derivedConstants.measuredSpeedFromL1L2.toFixed(1) }} m/s</span>
              <span class="telemetry-sub">2f × (L₂ - L₁)</span>
            </div>

            <div class="telemetry-card">
              <span class="telemetry-label">{{ $t('resonanceTubes.splLevel') }}</span>
              <span class="telemetry-val ltr-island">{{ derivedConstants.amplificationDb.toFixed(1) }} dB</span>
              <span class="telemetry-sub">Amplification</span>
            </div>

            <div class="telemetry-card status-card">
              <span class="telemetry-label">{{ $t('resonanceTubes.resonanceState') }}</span>
              <span class="status-indicator" :class="resonanceProximityClass">
                {{ resonanceStateText }}
              </span>
              <span class="telemetry-sub">{{ (derivedConstants.resonanceProximity * 100).toFixed(0) }}% match</span>
            </div>
          </div>
        </div>

        <!-- Tab 2: Live Oscillation Waveform Graph -->
        <div v-show="activeTab === 'graph'" class="tab-panel">
          <GraphPanel
            :current-series="series"
            :comparison-runs="comparisonRuns"
            x-label="Time (s)"
            y-label="SPL / Amplitude (dB)"
            x-key="t"
            y-key="y"
          />
        </div>

        <!-- Tab 3: Recorded Measurements Data Table -->
        <div v-show="activeTab === 'table'" class="tab-panel">
          <DataTable
            :series="series"
            :column-keys="['t', 'y', 'x', 'vx', 'vy', 'v']"
            :column-labels="[
              $t('common.time') + ' (s)',
              'SPL (dB)',
              $t('resonanceTubes.columnLength') + ' (m)',
              'L₁ (m)',
              'L₂ (m)',
              $t('resonanceTubes.soundSpeed') + ' (m/s)'
            ]"
          />
        </div>

        <!-- Tab 4: Physics Theory & Mathematical Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel theory-panel">
          <FormulaPanel
            :title="$t('resonanceTubes.theoryTitle')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('resonanceTubes.theoryP1') }}</p>
            <p>{{ $t('resonanceTubes.theoryP2') }}</p>
            <p>{{ $t('resonanceTubes.theoryP3') }}</p>
          </div>
        </div>

        <!-- Tab 5: Lab Notes -->
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
            placeholder="یادداشت‌های آزمایشگاهی، مشاهدات طول‌های تشدید و خطای محاسبه تندی صوت را در اینجا بنویسید..."
            @input="saveNotes"
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
        :title="$t('experiments.resonanceTubes.title')"
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
  type ResonanceTubesParams,
  type ResonanceTubesDerived,
  calculateResonanceDerived
} from '../model/resonance-tubes';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { resonanceTubesConfig } from '../config';

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
import ResonanceTubesCanvas from '../view/ResonanceTubesCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();

const canvasViewRef = ref<InstanceType<typeof ResonanceTubesCanvas> | null>(null);

// State Controls — Starts PAUSED by default per user specification
const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('telemetry');
const currentPresetId = ref('first_resonance');
const userNotes = ref('');

// Reactive Numeric Parameters for UI and SlotManager
const uiParams = reactive<Record<string, number>>({
  systemTypeIndex: 0, // 0 = water_column, 1 = helmholtz
  frequency: 512,
  columnLength: 0.155,
  tubeRadiusMm: 20,
  temperatureC: 20,
  relativeHumidity: 45,
  helmholtzVolumeCm3: 500,
  neckRadiusMm: 12,
  neckLengthMm: 35
});

const internalParams = computed<ResonanceTubesParams>(() => ({
  systemType: uiParams.systemTypeIndex === 1 ? 'helmholtz' : 'water_column',
  frequency: uiParams.frequency,
  columnLength: uiParams.columnLength,
  tubeRadiusMm: uiParams.tubeRadiusMm,
  temperatureC: uiParams.temperatureC,
  relativeHumidity: uiParams.relativeHumidity,
  helmholtzVolumeCm3: uiParams.helmholtzVolumeCm3,
  neckRadiusMm: uiParams.neckRadiusMm,
  neckLengthMm: uiParams.neckLengthMm,
  realMode: mode.value === 'real'
}));

const derivedConstants = computed<ResonanceTubesDerived>(() =>
  calculateResonanceDerived(internalParams.value)
);

// Resonances Proximity Styling
const resonanceProximityClass = computed(() => {
  const p = derivedConstants.value.resonanceProximity;
  if (p >= 0.8) return 'status-peak';
  if (p >= 0.3) return 'status-near';
  return 'status-off';
});

const resonanceStateText = computed(() => {
  const p = derivedConstants.value.resonanceProximity;
  if (p >= 0.8) return t('resonanceTubes.peakResonance');
  if (p >= 0.3) return t('resonanceTubes.nearResonance');
  return t('resonanceTubes.offResonance');
});

// Canvas emitted length update
function onCanvasLengthUpdate(newLen: number) {
  uiParams.columnLength = Number(newLen.toFixed(3));
  onParamChange();
}

// Presets
const presetOptions = computed<PresetOption[]>(() =>
  resonanceTubesConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params
  }))
);

function applyPreset(preset: PresetOption) {
  currentPresetId.value = preset.id;
  if (preset.id === 'helmholtz_cavity') {
    uiParams.systemTypeIndex = 1;
  } else {
    uiParams.systemTypeIndex = 0;
  }
  Object.assign(uiParams, preset.params);
  resetSimulation();
}

// Theory Formulas
const formulaItems = computed<FormulaItem[]>(() =>
  resonanceTubesConfig.formulas.map((f) => ({
    title: t(f.titleKey),
    latex: f.latex,
    explanation: t(f.explanationKey)
  }))
);

// Guided Steps
const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step1',
    title: t('resonanceTubes.preset_first_resonance'),
    instruction: t('resonanceTubes.formula_closedTube_desc')
  },
  {
    id: 'step2',
    title: t('resonanceTubes.preset_second_resonance'),
    instruction: t('resonanceTubes.formula_speedElimination_desc')
  },
  {
    id: 'step3',
    title: t('resonanceTubes.preset_speed_of_sound_exp'),
    instruction: t('resonanceTubes.formula_endCorrection_desc')
  },
  {
    id: 'step4',
    title: t('resonanceTubes.preset_helmholtz_cavity'),
    instruction: t('resonanceTubes.theoryP3')
  }
]);

// Animation & Accumulator Loop
const simTime = ref(0);
const series = reactive<DataSeries>({
  t: [0],
  x: [0.155],
  y: [75],
  vx: [0.155],
  vy: [0.490],
  v: [343.2]
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

      if (sampleTimer >= 0.05) {
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
  series.y.push(Number(d.amplificationDb.toFixed(1)));
  series.x.push(Number(uiParams.columnLength.toFixed(3)));
  series.vx.push(Number(d.firstResonanceLength.toFixed(3)));
  series.vy.push(Number(d.secondResonanceLength.toFixed(3)));
  series.v.push(Number(d.soundSpeed.toFixed(1)));

  if (series.t.length > 120) {
    series.t.shift();
    series.y.shift();
    series.x.shift();
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
  series.y = [derivedConstants.value.amplificationDb];
  series.x = [uiParams.columnLength];
  series.vx = [derivedConstants.value.firstResonanceLength];
  series.vy = [derivedConstants.value.secondResonanceLength];
  series.v = [derivedConstants.value.soundSpeed];
}

function stepSimulation() {
  if (accumulator) {
    accumulator.pause();
  }
  isRunning.value = false;
  simTime.value += 0.05 * speed.value;
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

// Lab Notes Persistence
async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/waves/resonance-tubes').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, { content: userNotes.value, updatedAt: Date.now() });
    } else {
      await db.notes.add({
        experimentId: 'physics/waves/resonance-tubes',
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
    const saved = await db.notes.where('experimentId').equals('physics/waves/resonance-tubes').first();
    if (saved) {
      userNotes.value = saved.content;
    }
  } catch {
    // ignore
  }
}

// Export Report Mapping
const calculatedResults = computed<Record<string, number | string>>(() => ({
  soundSpeed: derivedConstants.value.soundSpeed.toFixed(2),
  wavelength: derivedConstants.value.wavelength.toFixed(3),
  endCorrection: (derivedConstants.value.endCorrection * 1000).toFixed(1),
  firstResonanceLength: (derivedConstants.value.firstResonanceLength * 100).toFixed(1),
  secondResonanceLength: (derivedConstants.value.secondResonanceLength * 100).toFixed(1),
  measuredSpeedFromL1L2: derivedConstants.value.measuredSpeedFromL1L2.toFixed(1),
  amplificationDb: derivedConstants.value.amplificationDb.toFixed(1)
}));

const reportResultsRows = computed(() => [
  { name: t('resonanceTubes.soundSpeed'), simulated: `${derivedConstants.value.soundSpeed.toFixed(2)} m/s` },
  { name: t('resonanceTubes.wavelength'), simulated: `${derivedConstants.value.wavelength.toFixed(3)} m` },
  { name: t('resonanceTubes.endCorrection'), simulated: `${(derivedConstants.value.endCorrection * 1000).toFixed(1)} mm` },
  { name: 'L₁ (First Resonance)', simulated: `${(derivedConstants.value.firstResonanceLength * 100).toFixed(1)} cm` },
  { name: 'L₂ (Second Resonance)', simulated: `${(derivedConstants.value.secondResonanceLength * 100).toFixed(1)} cm` },
  { name: t('resonanceTubes.measuredSpeed'), simulated: `${derivedConstants.value.measuredSpeedFromL1L2.toFixed(1)} m/s` },
  { name: t('resonanceTubes.splLevel'), simulated: `${derivedConstants.value.amplificationDb.toFixed(1)} dB` }
]);

const reportVariablesList = computed(() => [
  { name: t('resonanceTubes.systemType'), symbol: 'Type', value: uiParams.systemTypeIndex === 1 ? 'Helmholtz' : 'Water Column', unit: '' },
  { name: t('resonanceTubes.frequency'), symbol: 'f', value: uiParams.frequency, unit: 'Hz' },
  { name: t('resonanceTubes.columnLength'), symbol: 'L', value: uiParams.columnLength, unit: 'm' },
  { name: t('resonanceTubes.temperatureC'), symbol: 'T', value: uiParams.temperatureC, unit: '°C' },
  { name: t('resonanceTubes.tubeRadius'), symbol: 'r', value: uiParams.tubeRadiusMm, unit: 'mm' },
  { name: t('resonanceTubes.humidity'), symbol: 'RH', value: uiParams.relativeHumidity, unit: '%' }
]);

onMounted(() => {
  initLoop();
  loadNotes();
});

onBeforeUnmount(() => {
  if (accumulator) {
    accumulator.destroy();
  }
});
</script>

<style scoped>
.resonance-tubes-experiment {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
}

.experiment-workspace {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-4);
  align-items: flex-start;
}

.scene-container {
  min-width: 0;
  width: 100%;
}

.canvas-mount {
  position: relative;
  width: 100%;
  height: 480px;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.control-sidebar {
  height: 480px;
  max-height: 480px;
  display: flex;
  flex-direction: column;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  box-sizing: border-box;
}

.sidebar-header {
  margin-bottom: var(--space-2);
  padding-bottom: var(--space-2);
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
  gap: var(--space-3);
  padding-inline-end: var(--space-1);
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.control-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.mode-pill-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mode-pill-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: start;
}

.mode-pill-btn.active {
  background: rgba(16, 185, 129, 0.12);
  border-color: #10b981;
  color: #10b981;
  font-weight: 600;
}

/* Bottom Analysis Area */
.bottom-analysis-area {
  display: flex;
  flex-direction: column;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.analysis-tabs-nav {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  overflow-x: auto;
}

.tab-btn {
  padding: 6px 14px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.04);
}

.tab-btn.active {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  font-weight: 600;
}

.analysis-tab-content {
  padding: var(--space-4);
  min-height: 220px;
}

/* Telemetry Grid */
.telemetry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-3);
}

.telemetry-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-3);
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.telemetry-card.highlight-card {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.06);
}

.telemetry-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.telemetry-val {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.telemetry-sub {
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.8;
}

.status-indicator {
  font-size: 14px;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: var(--radius-sm);
  display: inline-block;
}

.status-peak {
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
}

.status-near {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
}

.status-off {
  color: var(--text-secondary);
}

/* Theory Prose */
.theory-prose {
  margin-top: var(--space-3);
  line-height: 1.7;
  color: var(--text-secondary);
}

.theory-prose p {
  margin-bottom: var(--space-2);
}

/* Notes Tab */
.notes-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notes-header h4 {
  margin: 0;
  font-size: 14px;
  color: var(--text-primary);
}

.btn-save-note {
  padding: 6px 12px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
}

.btn-save-note:hover {
  background: rgba(16, 185, 129, 0.15);
  border-color: #10b981;
  color: #10b981;
}

.notes-textarea {
  width: 100%;
  height: 180px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
}

.notes-textarea:focus {
  outline: none;
  border-color: #10b981;
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

@media (max-width: 900px) {
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
    height: 420px;
  }
}
</style>
