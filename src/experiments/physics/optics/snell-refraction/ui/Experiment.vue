<template>
  <div class="snell-refraction-experiment">
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
          <SnellRefractionCanvas
            ref="canvasViewRef"
            :params="internalParams"
            :derived="derivedConstants"
            :sim-time="simTime"
            :is-running="isRunning"
            :is-dark="store.theme === 'dark'"
            @update:theta1-deg="onAngleUpdate"
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

          <!-- Optical Block Geometry Pills -->
          <div class="control-section">
            <label class="control-label">{{ $t('snellRefraction.geometry') }}</label>
            <div class="mode-pill-list">
              <button
                type="button"
                class="mode-pill-btn"
                :class="{ active: uiParams.geometryIndex === 0 }"
                @click="uiParams.geometryIndex = 0; onParamChange()"
              >
                <span class="mode-icon">➖</span>
                <span class="mode-name">{{ $t('snellRefraction.geo_planar') }}</span>
              </button>
              <button
                type="button"
                class="mode-pill-btn"
                :class="{ active: uiParams.geometryIndex === 1 }"
                @click="uiParams.geometryIndex = 1; onParamChange()"
              >
                <span class="mode-icon">🌗</span>
                <span class="mode-name">{{ $t('snellRefraction.geo_semicircular') }}</span>
              </button>
            </div>
          </div>

          <!-- Variables Group -->
          <VariableGroup :title="$t('common.variables')">
            <!-- Incident Angle Slider -->
            <UnitSlider
              id="theta1Deg"
              v-model="uiParams.theta1Deg"
              :label="$t('snellRefraction.theta1Deg')"
              unit="°"
              :min="0"
              :max="85"
              :step="0.5"
              @update:model-value="onParamChange"
            />

            <!-- Medium 1 Index Slider -->
            <UnitSlider
              id="n1"
              v-model="uiParams.n1"
              :label="$t('snellRefraction.n1')"
              unit=""
              :min="1.00"
              :max="2.50"
              :step="0.01"
              @update:model-value="onParamChange"
            />

            <!-- Medium 2 Index Slider -->
            <UnitSlider
              id="n2"
              v-model="uiParams.n2"
              :label="$t('snellRefraction.n2')"
              unit=""
              :min="1.00"
              :max="2.50"
              :step="0.01"
              @update:model-value="onParamChange"
            />

            <!-- Laser Wavelength Slider -->
            <UnitSlider
              id="wavelengthNm"
              v-model="uiParams.wavelengthNm"
              :label="$t('snellRefraction.wavelength')"
              unit="nm"
              :min="380"
              :max="750"
              :step="2"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- White Light Dispersion Mode Pill -->
          <div class="control-section">
            <button
              type="button"
              class="btn-toggle-white"
              :class="{ active: uiParams.whiteLightFlag === 1 }"
              @click="toggleWhiteLight"
            >
              🌈 {{ $t('snellRefraction.whiteLight') }}
            </button>
          </div>

          <!-- Save/Load State Slots -->
          <SlotManager
            experiment-id="physics/optics/snell-refraction"
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
              id="m-theta1Deg"
              v-model="uiParams.theta1Deg"
              :label="$t('snellRefraction.theta1Deg')"
              unit="°"
              :min="0"
              :max="85"
              :step="0.5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="m-n1"
              v-model="uiParams.n1"
              :label="$t('snellRefraction.n1')"
              unit=""
              :min="1.00"
              :max="2.50"
              :step="0.01"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="m-n2"
              v-model="uiParams.n2"
              :label="$t('snellRefraction.n2')"
              unit=""
              :min="1.00"
              :max="2.50"
              :step="0.01"
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
          🔬 {{ $t('snellRefraction.telemetryTitle') }}
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
              <span class="telemetry-label">{{ $t('snellRefraction.incidentAngle') }}</span>
              <span class="telemetry-val ltr-island">{{ derivedConstants.theta1Deg.toFixed(1) }}°</span>
              <span class="telemetry-sub">θ₁</span>
            </div>

            <div class="telemetry-card highlight-card">
              <span class="telemetry-label">{{ $t('snellRefraction.refractedAngle') }}</span>
              <span class="telemetry-val ltr-island">
                {{ derivedConstants.theta2Deg !== null ? derivedConstants.theta2Deg.toFixed(2) + '°' : 'TIR' }}
              </span>
              <span class="telemetry-sub">θ₂ = arcsin((n₁/n₂) sin θ₁)</span>
            </div>

            <div class="telemetry-card">
              <span class="telemetry-label">{{ $t('snellRefraction.reflectedAngle') }}</span>
              <span class="telemetry-val ltr-island">{{ derivedConstants.thetaReflectedDeg.toFixed(1) }}°</span>
              <span class="telemetry-sub">θ_r = θ₁</span>
            </div>

            <div class="telemetry-card">
              <span class="telemetry-label">{{ $t('snellRefraction.criticalAngle') }}</span>
              <span class="telemetry-val ltr-island">
                {{ derivedConstants.criticalAngleDeg !== null ? derivedConstants.criticalAngleDeg.toFixed(2) + '°' : $t('snellRefraction.noCriticalAngle') }}
              </span>
              <span class="telemetry-sub">θ_c = arcsin(n₂/n₁)</span>
            </div>

            <div class="telemetry-card">
              <span class="telemetry-label">{{ $t('snellRefraction.brewsterAngle') }}</span>
              <span class="telemetry-val ltr-island">{{ derivedConstants.brewsterAngleDeg.toFixed(2) }}°</span>
              <span class="telemetry-sub">θ_B = arctan(n₂/n₁)</span>
            </div>

            <div class="telemetry-card">
              <span class="telemetry-label">{{ $t('snellRefraction.reflectance') }}</span>
              <span class="telemetry-val ltr-island">{{ (derivedConstants.reflectance * 100).toFixed(1) }}%</span>
              <span class="telemetry-sub">Fresnel R</span>
            </div>

            <div class="telemetry-card">
              <span class="telemetry-label">{{ $t('snellRefraction.transmittance') }}</span>
              <span class="telemetry-val ltr-island">{{ (derivedConstants.transmittance * 100).toFixed(1) }}%</span>
              <span class="telemetry-sub">Fresnel T = 1 - R</span>
            </div>

            <div class="telemetry-card status-card">
              <span class="telemetry-label">Status</span>
              <span class="status-indicator" :class="derivedConstants.isTotalInternalReflection ? 'status-tir' : 'status-normal'">
                {{ derivedConstants.isTotalInternalReflection ? $t('snellRefraction.tirActive') : $t('snellRefraction.tirInactive') }}
              </span>
              <span class="telemetry-sub">v₂ = {{ (derivedConstants.speed2 / 1e8).toFixed(2) }} × 10⁸ m/s</span>
            </div>
          </div>
        </div>

        <!-- Tab 2: Reflectance & Transmittance vs Incident Angle Graph -->
        <div v-show="activeTab === 'graph'" class="tab-panel">
          <GraphPanel
            :current-series="series"
            :comparison-runs="comparisonRuns"
            x-label="Angle (deg)"
            y-label="Reflectance / Transmittance (%)"
            x-key="t"
            y-key="y"
          />
        </div>

        <!-- Tab 3: Recorded Measurements Data Table -->
        <div v-show="activeTab === 'table'" class="tab-panel">
          <DataTable
            :series="series"
            :column-keys="['t', 'x', 'y', 'vx', 'vy', 'v']"
            :column-labels="[
              $t('snellRefraction.incidentAngle') + ' (°)',
              $t('snellRefraction.refractedAngle') + ' (°)',
              $t('snellRefraction.reflectance') + ' (%)',
              $t('snellRefraction.transmittance') + ' (%)',
              'n₁',
              'n₂'
            ]"
          />
        </div>

        <!-- Tab 4: Physics Theory & Mathematical Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel theory-panel">
          <FormulaPanel
            :title="$t('snellRefraction.theoryTitle')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('snellRefraction.theoryP1') }}</p>
            <p>{{ $t('snellRefraction.theoryP2') }}</p>
            <p>{{ $t('snellRefraction.theoryP3') }}</p>
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
            placeholder="یادداشت‌های آزمایشگاهی، مقایسه زوایای شکست تجربی با قانون اسنل، و مشاهدات زاویه حد را در اینجا ثبت نمایید..."
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
        :title="$t('experiments.snellRefraction.title')"
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
  type SnellParams,
  type SnellDerived,
  calculateSnellDerived
} from '../model/snell-refraction';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { snellRefractionConfig } from '../config';

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
import SnellRefractionCanvas from '../view/SnellRefractionCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();

const canvasViewRef = ref<InstanceType<typeof SnellRefractionCanvas> | null>(null);

// State Controls — Starts PAUSED by default per user rule
const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('telemetry');
const currentPresetId = ref('air_to_glass');
const userNotes = ref('');

// Reactive Numeric Parameters for UI and SlotManager
const uiParams = reactive<Record<string, number>>({
  geometryIndex: 0, // 0 = planar, 1 = semicircular
  theta1Deg: 45,
  n1: 1.00,
  n2: 1.52,
  wavelengthNm: 532,
  laserPowerMw: 5,
  whiteLightFlag: 0 // 0 = mono, 1 = white
});

const internalParams = computed<SnellParams>(() => ({
  theta1Deg: uiParams.theta1Deg,
  n1: uiParams.n1,
  n2: uiParams.n2,
  wavelengthNm: uiParams.wavelengthNm,
  geometry: uiParams.geometryIndex === 1 ? 'semicircular' : 'planar',
  whiteLight: uiParams.whiteLightFlag === 1,
  realMode: mode.value === 'real'
}));

const derivedConstants = computed<SnellDerived>(() =>
  calculateSnellDerived(internalParams.value)
);

function onAngleUpdate(newAngle: number) {
  uiParams.theta1Deg = newAngle;
  onParamChange();
}

function toggleWhiteLight() {
  uiParams.whiteLightFlag = uiParams.whiteLightFlag === 1 ? 0 : 1;
  onParamChange();
}

// Presets
const presetOptions = computed<PresetOption[]>(() =>
  snellRefractionConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params
  }))
);

function applyPreset(preset: PresetOption) {
  currentPresetId.value = preset.id;
  Object.assign(uiParams, preset.params);
  resetSimulation();
}

// Theory Formulas
const formulaItems = computed<FormulaItem[]>(() =>
  snellRefractionConfig.formulas.map((f) => ({
    title: t(f.titleKey),
    latex: f.latex,
    explanation: t(f.explanationKey)
  }))
);

// Guided Steps
const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step1',
    title: t('snellRefraction.preset_air_to_glass'),
    instruction: t('snellRefraction.formula_snell_desc')
  },
  {
    id: 'step2',
    title: t('snellRefraction.preset_glass_to_air_tir'),
    instruction: t('snellRefraction.formula_critical_desc')
  },
  {
    id: 'step3',
    title: t('snellRefraction.preset_brewster_polarization'),
    instruction: t('snellRefraction.formula_brewster_desc')
  },
  {
    id: 'step4',
    title: t('snellRefraction.whiteLight'),
    instruction: t('snellRefraction.real_dispersion_effect')
  }
]);

// Animation & Data Recording
const simTime = ref(0);
const series = reactive<DataSeries>({
  t: [45],
  x: [27.7],
  y: [4.5],
  vx: [95.5],
  vy: [1.0],
  v: [1.52]
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
  const d = derivedConstants.value;

  series.t.push(Number(uiParams.theta1Deg.toFixed(1)));
  series.x.push(Number(d.theta2Deg !== null ? d.theta2Deg.toFixed(1) : 90));
  series.y.push(Number((d.reflectance * 100).toFixed(1)));
  series.vx.push(Number((d.transmittance * 100).toFixed(1)));
  series.vy.push(Number(uiParams.n1.toFixed(2)));
  series.v.push(Number(uiParams.n2.toFixed(2)));

  if (series.t.length > 120) {
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
  series.t = [uiParams.theta1Deg];
  series.x = [derivedConstants.value.theta2Deg ?? 90];
  series.y = [derivedConstants.value.reflectance * 100];
  series.vx = [derivedConstants.value.transmittance * 100];
  series.vy = [uiParams.n1];
  series.v = [uiParams.n2];
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
    const existing = await db.notes.where('experimentId').equals('physics/optics/snell-refraction').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, { content: userNotes.value, updatedAt: Date.now() });
    } else {
      await db.notes.add({
        experimentId: 'physics/optics/snell-refraction',
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
    const saved = await db.notes.where('experimentId').equals('physics/optics/snell-refraction').first();
    if (saved) {
      userNotes.value = saved.content;
    }
  } catch {
    // ignore
  }
}

// Export Report Mapping
const calculatedResults = computed<Record<string, number | string>>(() => ({
  theta1: `${derivedConstants.value.theta1Deg.toFixed(1)}°`,
  theta2: derivedConstants.value.theta2Deg !== null ? `${derivedConstants.value.theta2Deg.toFixed(2)}°` : 'TIR',
  criticalAngle: derivedConstants.value.criticalAngleDeg !== null ? `${derivedConstants.value.criticalAngleDeg.toFixed(2)}°` : 'None',
  brewsterAngle: `${derivedConstants.value.brewsterAngleDeg.toFixed(2)}°`,
  reflectance: `${(derivedConstants.value.reflectance * 100).toFixed(1)}%`,
  transmittance: `${(derivedConstants.value.transmittance * 100).toFixed(1)}%`,
  speedMedium2: `${(derivedConstants.value.speed2 / 1e8).toFixed(2)} × 10⁸ m/s`
}));

const reportResultsRows = computed(() => [
  { name: t('snellRefraction.incidentAngle'), simulated: `${derivedConstants.value.theta1Deg.toFixed(1)}°` },
  { name: t('snellRefraction.refractedAngle'), simulated: derivedConstants.value.theta2Deg !== null ? `${derivedConstants.value.theta2Deg.toFixed(2)}°` : 'TIR' },
  { name: t('snellRefraction.criticalAngle'), simulated: derivedConstants.value.criticalAngleDeg !== null ? `${derivedConstants.value.criticalAngleDeg.toFixed(2)}°` : 'N/A' },
  { name: t('snellRefraction.brewsterAngle'), simulated: `${derivedConstants.value.brewsterAngleDeg.toFixed(2)}°` },
  { name: t('snellRefraction.reflectance'), simulated: `${(derivedConstants.value.reflectance * 100).toFixed(1)}%` },
  { name: t('snellRefraction.transmittance'), simulated: `${(derivedConstants.value.transmittance * 100).toFixed(1)}%` }
]);

const reportVariablesList = computed(() => [
  { name: t('snellRefraction.theta1Deg'), symbol: 'θ₁', value: uiParams.theta1Deg, unit: '°' },
  { name: t('snellRefraction.n1'), symbol: 'n₁', value: uiParams.n1, unit: '' },
  { name: t('snellRefraction.n2'), symbol: 'n₂', value: uiParams.n2, unit: '' },
  { name: t('snellRefraction.wavelength'), symbol: 'λ₀', value: uiParams.wavelengthNm, unit: 'nm' }
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
.snell-refraction-experiment {
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
  background: rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
  color: #3b82f6;
  font-weight: 600;
}

.btn-toggle-white {
  width: 100%;
  padding: 8px 12px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-toggle-white:hover {
  background: rgba(255, 255, 255, 0.08);
}

.btn-toggle-white.active {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(59, 130, 246, 0.15));
  border-color: #a855f7;
  color: #c084fc;
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
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.12);
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
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.06);
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
  font-size: 13px;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: var(--radius-sm);
  display: inline-block;
}

.status-normal {
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
}

.status-tir {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
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
  background: rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
  color: #3b82f6;
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
  border-color: #3b82f6;
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
