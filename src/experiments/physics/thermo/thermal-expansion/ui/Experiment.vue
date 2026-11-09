<template>
  <div class="thermal-expansion-experiment">
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
          <ThermalExpansionCanvas
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

          <!-- Expansion Type Selector -->
          <div class="profile-selector-group">
            <label class="control-label">{{ $t('thermalExpansion.expansionType') }}</label>
            <div class="type-pill-list">
              <button
                v-for="(typeItem, idx) in expansionTypeOptions"
                :key="idx"
                type="button"
                class="type-pill-btn"
                :class="{ active: uiParams.expansionTypeIndex === idx }"
                @click="uiParams.expansionTypeIndex = idx; onParamChange()"
              >
                {{ typeItem.label }}
              </button>
            </div>
          </div>

          <!-- Primary Metal Selector (Rod / Top Layer) -->
          <div v-if="uiParams.expansionTypeIndex !== 2" class="profile-selector-group">
            <label class="control-label">{{ $t('thermalExpansion.metal1') }}</label>
            <div class="metal-pill-grid">
              <button
                v-for="(metalItem, idx) in metalMaterialsList"
                :key="metalItem.id"
                type="button"
                class="metal-card-btn"
                :class="{ active: uiParams.metal1Index === idx }"
                @click="uiParams.metal1Index = idx; onParamChange()"
              >
                <span class="m-color-badge" :style="{ background: metalItem.color }"></span>
                <span class="m-name">{{ metalItem.name }}</span>
                <span class="m-alpha" dir="ltr">α={{ metalItem.alpha }}</span>
              </button>
            </div>
          </div>

          <!-- Secondary Metal Selector (Bottom Layer in Bimetal) -->
          <div v-if="uiParams.expansionTypeIndex === 1" class="profile-selector-group">
            <label class="control-label">{{ $t('thermalExpansion.metal2') }}</label>
            <div class="metal-pill-grid">
              <button
                v-for="(metalItem, idx) in metalMaterialsList"
                :key="metalItem.id"
                type="button"
                class="metal-card-btn"
                :class="{ active: uiParams.metal2Index === idx }"
                @click="uiParams.metal2Index = idx; onParamChange()"
              >
                <span class="m-color-badge" :style="{ background: metalItem.color }"></span>
                <span class="m-name">{{ metalItem.name }}</span>
                <span class="m-alpha" dir="ltr">α={{ metalItem.alpha }}</span>
              </button>
            </div>
          </div>

          <!-- Physical Dimensions & Temperatures -->
          <VariableGroup :title="$t('common.variables')">
            <UnitSlider
              v-if="uiParams.expansionTypeIndex !== 2"
              id="initialLength"
              v-model="uiParams.initialLengthMm"
              :label="$t('thermalExpansion.initialLength')"
              unit="mm"
              :min="200"
              :max="2000"
              :step="50"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="currentTemp"
              v-model="uiParams.currentTempC"
              :label="$t('thermalExpansion.currentTemp')"
              unit="°C"
              :min="uiParams.expansionTypeIndex === 2 ? -5 : -20"
              :max="uiParams.expansionTypeIndex === 2 ? 30 : 350"
              :step="uiParams.expansionTypeIndex === 2 ? 1 : 5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="initialTemp"
              v-model="uiParams.initialTempC"
              :label="$t('thermalExpansion.initialTemp')"
              unit="°C"
              :min="0"
              :max="40"
              :step="1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="uiParams.expansionTypeIndex === 1"
              id="stripThickness"
              v-model="uiParams.stripThicknessMm"
              :label="$t('thermalExpansion.stripThickness')"
              unit="mm"
              :min="0.5"
              :max="5.0"
              :step="0.5"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slot Persistence -->
          <div class="slot-manager-section">
            <SlotManager
              experiment-id="physics/thermo/thermal-expansion"
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
          <label class="control-label">{{ $t('thermalExpansion.expansionType') }}</label>
          <div class="type-pill-list">
            <button
              v-for="(typeItem, idx) in expansionTypeOptions"
              :key="idx"
              type="button"
              class="type-pill-btn"
              :class="{ active: uiParams.expansionTypeIndex === idx }"
              @click="uiParams.expansionTypeIndex = idx; onParamChange()"
            >
              {{ typeItem.label }}
            </button>
          </div>
        </div>

        <div v-if="uiParams.expansionTypeIndex !== 2" class="profile-selector-group">
          <label class="control-label">{{ $t('thermalExpansion.metal1') }}</label>
          <div class="metal-pill-grid">
            <button
              v-for="(metalItem, idx) in metalMaterialsList"
              :key="metalItem.id"
              type="button"
              class="metal-card-btn"
              :class="{ active: uiParams.metal1Index === idx }"
              @click="uiParams.metal1Index = idx; onParamChange()"
            >
              <span class="m-color-badge" :style="{ background: metalItem.color }"></span>
              <span class="m-name">{{ metalItem.name }}</span>
              <span class="m-alpha" dir="ltr">α={{ metalItem.alpha }}</span>
            </button>
          </div>
        </div>

        <VariableGroup :title="$t('common.variables')">
          <UnitSlider
            v-if="uiParams.expansionTypeIndex !== 2"
            id="mInitialLength"
            v-model="uiParams.initialLengthMm"
            :label="$t('thermalExpansion.initialLength')"
            unit="mm"
            :min="200"
            :max="2000"
            :step="50"
            @update:model-value="onParamChange"
          />
          <UnitSlider
            id="mCurrentTemp"
            v-model="uiParams.currentTempC"
            :label="$t('thermalExpansion.currentTemp')"
            unit="°C"
            :min="uiParams.expansionTypeIndex === 2 ? -5 : -20"
            :max="uiParams.expansionTypeIndex === 2 ? 30 : 350"
            :step="uiParams.expansionTypeIndex === 2 ? 1 : 5"
            @update:model-value="onParamChange"
          />
          <UnitSlider
            id="mInitialTemp"
            v-model="uiParams.initialTempC"
            :label="$t('thermalExpansion.initialTemp')"
            unit="°C"
            :min="0"
            :max="40"
            :step="1"
            @update:model-value="onParamChange"
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
          📈 {{ $t('thermalExpansion.tabGraph') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'table' }"
          @click="activeTab = 'table'"
        >
          📋 {{ $t('thermalExpansion.tabTable') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'theory' }"
          @click="activeTab = 'theory'"
        >
          📖 {{ $t('thermalExpansion.tabTheory') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'notes' }"
          @click="activeTab = 'notes'"
        >
          📝 {{ $t('thermalExpansion.tabNotes') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'guided' }"
          @click="activeTab = 'guided'"
        >
          🎯 {{ $t('thermalExpansion.tabGuided') }}
        </button>
      </nav>

      <!-- Active Tab Body -->
      <div class="tab-content-area">
        <!-- Tab 1: Live Graph -->
        <div v-show="activeTab === 'graph'" class="tab-panel graph-panel-wrapper">
          <div class="live-metrics-strip">
            <div v-if="uiParams.expansionTypeIndex === 0" class="metric-chip">
              <span class="m-label">{{ $t('thermalExpansion.metricDeltaL') }}</span>
              <span class="m-value text-accent">+{{ currentState.derived.linear.deltaL_Mm.toFixed(3) }} mm</span>
            </div>
            <div v-else-if="uiParams.expansionTypeIndex === 1" class="metric-chip">
              <span class="m-label">{{ $t('thermalExpansion.metricDeflection') }}</span>
              <span class="m-value text-accent">{{ currentState.derived.bimetal.tipDeflectionMm.toFixed(2) }} mm</span>
            </div>
            <div v-else class="metric-chip">
              <span class="m-label">{{ $t('thermalExpansion.metricDensity') }}</span>
              <span class="m-value text-accent">{{ currentState.derived.water.densityGPerCm3.toFixed(5) }} g/cm³</span>
            </div>

            <div class="metric-chip">
              <span class="m-label">{{ $t('thermalExpansion.currentTemp') }}</span>
              <span class="m-value text-temp">{{ currentState.temperatureC.toFixed(1) }} °C</span>
            </div>
            <div class="metric-chip">
              <span class="m-label">ΔT (T - T₀)</span>
              <span class="m-value text-diff">{{ currentState.derived.deltaTC.toFixed(1) }} °C</span>
            </div>

            <div v-if="uiParams.expansionTypeIndex === 0" class="metric-chip">
              <span class="m-label">{{ $t('thermalExpansion.metricFinalL') }}</span>
              <span class="m-value">{{ currentState.derived.linear.finalLengthMm.toFixed(2) }} mm</span>
            </div>
            <div v-else-if="uiParams.expansionTypeIndex === 1" class="metric-chip">
              <span class="m-label">{{ $t('thermalExpansion.metricSwitch') }}</span>
              <span class="m-value" :class="currentState.derived.bimetal.switchContactClosed ? 'text-on' : 'text-off'">
                {{ currentState.derived.bimetal.switchContactClosed ? 'ON (وصل)' : 'OFF (قطع)' }}
              </span>
            </div>
            <div v-else class="metric-chip">
              <span class="m-label">تغییر حجم آب (ΔV)</span>
              <span class="m-value">{{ (currentState.derived.water.volumeChangeCm3).toFixed(3) }} cm³</span>
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
            :title="$t('thermalExpansion.tabTheory')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('thermalExpansion.theoryContent') }}</p>
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
        :title="$t('experiments.thermalExpansion.title')"
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
  createThermalExpansionModel,
  stepThermalExpansionModel,
  type ThermalExpansionParams,
  type ThermalExpansionState,
  type ExpansionType,
  type MetalMaterial,
} from '../model/thermal-expansion';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { thermalExpansionConfig } from '../config';

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
import ThermalExpansionCanvas from '../view/ThermalExpansionCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();

const canvasViewRef = ref<InstanceType<typeof ThermalExpansionCanvas> | null>(null);

// Simulation Controls — Starts PAUSED by default, runs only when play is pressed
const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('copperRodLinear');
const userNotes = ref<string>('');

// UI Model Parameters
const uiParams = reactive<Record<string, number>>({
  expansionTypeIndex: 0, // 0: linear, 1: bimetal, 2: waterAnomaly
  metal1Index: 2, // copper
  metal2Index: 0, // invar
  initialLengthMm: 1000,
  currentTempC: 80,
  initialTempC: 20,
  stripThicknessMm: 2.0,
});

const typeKeys: ExpansionType[] = ['linear', 'bimetal', 'waterAnomaly'];
const metalKeys: MetalMaterial[] = ['invar', 'steel', 'copper', 'brass', 'aluminum', 'lead'];

const expansionTypeOptions = computed(() => [
  { label: t('thermalExpansion.typeLinear'), type: 'linear' },
  { label: t('thermalExpansion.typeBimetal'), type: 'bimetal' },
  { label: t('thermalExpansion.typeWaterAnomaly'), type: 'waterAnomaly' },
]);

const metalMaterialsList = [
  { id: 'invar', name: 'اینوار (Invar)', alpha: '1.2', color: '#94a3b8' },
  { id: 'steel', name: 'فولاد (Steel)', alpha: '12', color: '#64748b' },
  { id: 'copper', name: 'مس (Copper)', alpha: '16.5', color: '#ea580c' },
  { id: 'brass', name: 'برنج (Brass)', alpha: '19', color: '#eab308' },
  { id: 'aluminum', name: 'آلومینیوم (Al)', alpha: '23', color: '#cbd5e1' },
  { id: 'lead', name: 'سرب (Lead)', alpha: '29', color: '#475569' },
];

const presetOptions = computed<PresetOption[]>(() =>
  thermalExpansionConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }))
);

const internalParams = computed<ThermalExpansionParams>(() => ({
  expansionType: typeKeys[uiParams.expansionTypeIndex] || 'linear',
  metal1: metalKeys[uiParams.metal1Index] || 'copper',
  metal2: metalKeys[uiParams.metal2Index] || 'invar',
  initialLengthMm: uiParams.initialLengthMm,
  stripThicknessMm: uiParams.stripThicknessMm,
  initialTempC: uiParams.initialTempC,
  currentTempC: uiParams.currentTempC,
  initialVolumeCm3: 500,
  isRealMode: mode.value === 'real',
}));

const currentState = ref<ThermalExpansionState>(createThermalExpansionModel(internalParams.value));

// Live Data Series for Graph and Table
const series = reactive<DataSeries>({
  t: [0],
  x: [uiParams.currentTempC], // Temperature (°C)
  y: [currentState.value.derived.linear.deltaL_Mm], // delta L (mm)
  vx: [currentState.value.derived.bimetal.tipDeflectionMm], // Tip deflection (mm)
  vy: [currentState.value.derived.water.densityGPerCm3 * 1000], // Density (kg/m3)
  v: [currentState.value.derived.linear.thermalStressMPa], // Thermal stress (MPa)
});

const comparisonRuns = ref<ComparisonRun[]>([]);

const formulaItems = computed<FormulaItem[]>(() =>
  thermalExpansionConfig.formulas.map((f) => ({
    title: t(f.titleKey),
    latex: f.latex,
    explanation: t(f.explanationKey),
  }))
);

const guidedSteps = computed<LabStep[]>(() => [
  { id: 'step1', title: t('thermalExpansion.step1Title'), instruction: t('thermalExpansion.step1Desc') },
  { id: 'step2', title: t('thermalExpansion.step2Title'), instruction: t('thermalExpansion.step2Desc') },
  { id: 'step3', title: t('thermalExpansion.step3Title'), instruction: t('thermalExpansion.step3Desc') },
  { id: 'step4', title: t('thermalExpansion.step4Title'), instruction: t('thermalExpansion.step4Desc') },
]);

// Results & Reports
const calculatedResults = computed<Record<string, number | string>>(() => ({
  'Elongation (mm)': currentState.value.derived.linear.deltaL_Mm.toFixed(3),
  'Tip Deflection (mm)': currentState.value.derived.bimetal.tipDeflectionMm.toFixed(2),
  'Water Density (g/cm³)': currentState.value.derived.water.densityGPerCm3.toFixed(5),
  'Temperature (°C)': currentState.value.temperatureC.toFixed(1),
  'Metal 1': metalKeys[uiParams.metal1Index],
  'Metal 2': metalKeys[uiParams.metal2Index],
}));

const reportResultsRows = computed(() => [
  { name: t('thermalExpansion.metricDeltaL'), simulated: `+${currentState.value.derived.linear.deltaL_Mm.toFixed(3)} mm` },
  { name: t('thermalExpansion.metricFinalL'), simulated: `${currentState.value.derived.linear.finalLengthMm.toFixed(2)} mm` },
  { name: t('thermalExpansion.metricDeflection'), simulated: `${currentState.value.derived.bimetal.tipDeflectionMm.toFixed(2)} mm` },
  { name: t('thermalExpansion.metricDensity'), simulated: `${currentState.value.derived.water.densityGPerCm3.toFixed(5)} g/cm³` },
]);

const reportVariablesList = computed(() => [
  { name: t('thermalExpansion.expansionType'), symbol: 'Type', value: typeKeys[uiParams.expansionTypeIndex], unit: '' },
  { name: t('thermalExpansion.metal1'), symbol: 'Metal 1', value: metalKeys[uiParams.metal1Index], unit: '' },
  { name: t('thermalExpansion.initialLength'), symbol: 'L₀', value: uiParams.initialLengthMm, unit: 'mm' },
  { name: t('thermalExpansion.currentTemp'), symbol: 'T', value: uiParams.currentTempC, unit: '°C' },
  { name: t('thermalExpansion.initialTemp'), symbol: 'T₀', value: uiParams.initialTempC, unit: '°C' },
]);

let accumulator: PhysicsAccumulator | null = null;
let sampleTimer = 0;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.05,
    onPhysicsStep: (dt: number) => {
      currentState.value = stepThermalExpansionModel(currentState.value, internalParams.value, dt * speed.value);
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
  // Do NOT start accumulator here — wait until play is clicked
}

function recordDataPoint() {
  const tSec = Number(currentState.value.t.toFixed(1));

  series.t.push(tSec);
  series.x.push(Number(currentState.value.temperatureC.toFixed(1)));
  series.y.push(Number(currentState.value.derived.linear.deltaL_Mm.toFixed(3)));
  series.vx.push(Number(currentState.value.derived.bimetal.tipDeflectionMm.toFixed(2)));
  series.vy.push(Number((currentState.value.derived.water.densityGPerCm3 * 1000).toFixed(1)));
  series.v.push(Number(currentState.value.derived.linear.thermalStressMPa.toFixed(1)));

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
  currentState.value = createThermalExpansionModel(internalParams.value);
  series.t = [0];
  series.x = [uiParams.currentTempC];
  series.y = [currentState.value.derived.linear.deltaL_Mm];
  series.vx = [currentState.value.derived.bimetal.tipDeflectionMm];
  series.vy = [currentState.value.derived.water.densityGPerCm3 * 1000];
  series.v = [currentState.value.derived.linear.thermalStressMPa];
  sampleTimer = 0;
}

function stepSimulation() {
  if (accumulator) {
    accumulator.stepOnce();
  } else {
    currentState.value = stepThermalExpansionModel(currentState.value, internalParams.value, 0.05);
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
  currentState.value = createThermalExpansionModel(internalParams.value);
}

function onParamChange() {
  currentState.value = createThermalExpansionModel(internalParams.value);
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
    name: `${typeKeys[uiParams.expansionTypeIndex]} (${metalKeys[uiParams.metal1Index]})`,
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
    const existing = await db.notes.where('experimentId').equals('physics/thermo/thermal-expansion').first();
    if (existing?.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/thermo/thermal-expansion',
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
    const existing = await db.notes.where('experimentId').equals('physics/thermo/thermal-expansion').first();
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
.thermal-expansion-experiment {
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

/* Expansion Type Pills */
.type-pill-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.type-pill-btn {
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

.type-pill-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.type-pill-btn.active {
  background: var(--brand-primary);
  color: #ffffff;
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}

/* Metal Species Grid */
.metal-pill-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.metal-card-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 7px 4px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 2px;
}

.metal-card-btn:hover {
  background: var(--surface-hover);
  border-color: #38bdf8;
}

.metal-card-btn.active {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  color: #ffffff;
}

.m-color-badge {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.m-name {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-primary);
}

.metal-card-btn.active .m-name {
  color: #ffffff;
}

.m-alpha {
  font-size: 9px;
  font-family: monospace;
  color: var(--text-secondary);
}

.metal-card-btn.active .m-alpha {
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

.text-temp {
  color: #f59e0b;
}

.text-diff {
  color: #06b6d4;
}

.text-on {
  color: #10b981;
}

.text-off {
  color: #ef4444;
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
