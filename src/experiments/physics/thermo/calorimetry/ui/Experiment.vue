<template>
  <div class="calorimetry-experiment">
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
          <CalorimetryCanvas
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

          <!-- Solid Substance Selector Grid -->
          <div class="profile-selector-group">
            <label class="control-label">{{ $t('calorimetry.solidMaterial') }}</label>
            <div class="material-grid">
              <button
                v-for="(item, idx) in solidMaterialsList"
                :key="item.id"
                type="button"
                class="material-card-btn"
                :class="{ active: uiParams.solidMaterialIndex === idx }"
                @click="uiParams.solidMaterialIndex = idx; onParamChange()"
              >
                <span class="mat-icon">{{ item.icon }}</span>
                <span class="mat-name">{{ $t(item.nameKey) }}</span>
                <span class="mat-c" dir="ltr">c={{ item.c }}</span>
              </button>
            </div>
          </div>

          <!-- Liquid Substance Selector -->
          <div class="profile-selector-group">
            <label class="control-label">{{ $t('calorimetry.liquidMedium') }}</label>
            <div class="liquid-pill-list">
              <button
                v-for="(liqItem, idx) in liquidMaterialsList"
                :key="liqItem.id"
                type="button"
                class="liquid-pill-btn"
                :class="{ active: uiParams.liquidMediumIndex === idx }"
                @click="uiParams.liquidMediumIndex = idx; onParamChange()"
              >
                <span class="liq-icon">{{ liqItem.icon }}</span>
                <span class="liq-name">{{ $t(liqItem.nameKey) }}</span>
                <span class="liq-c" dir="ltr">c={{ liqItem.c }}</span>
              </button>
            </div>
          </div>

          <!-- Solid Physical Properties -->
          <VariableGroup :title="$t('calorimetry.solidPropsTitle')">
            <UnitSlider
              id="solidMass"
              v-model="uiParams.solidMassGrams"
              :label="$t('calorimetry.solidMass')"
              unit="g"
              :min="20"
              :max="500"
              :step="10"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="solidTemp"
              v-model="uiParams.solidInitialTempC"
              :label="$t('calorimetry.solidTemp')"
              unit="°C"
              :min="-20"
              :max="120"
              :step="5"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Liquid Properties -->
          <VariableGroup :title="$t('calorimetry.liquidPropsTitle')">
            <UnitSlider
              id="liquidMass"
              v-model="uiParams.liquidMassGrams"
              :label="$t('calorimetry.liquidMass')"
              unit="g"
              :min="100"
              :max="600"
              :step="25"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="liquidTemp"
              v-model="uiParams.liquidInitialTempC"
              :label="$t('calorimetry.liquidTemp')"
              unit="°C"
              :min="5"
              :max="60"
              :step="1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Real Mode & Accessories -->
          <VariableGroup :title="$t('common.variables')">
            <UnitSlider
              v-if="mode === 'real'"
              id="waterEquivalent"
              v-model="uiParams.calorimeterWaterEquivalentGrams"
              :label="$t('calorimetry.waterEquivalent')"
              unit="g"
              :min="0"
              :max="50"
              :step="5"
              @update:model-value="onParamChange"
            />
            <button
              type="button"
              class="btn-stirrer-toggle"
              :class="{ active: uiParams.stirrerActive }"
              @click="uiParams.stirrerActive = uiParams.stirrerActive ? 0 : 1; onParamChange()"
            >
              🌀 {{ $t('calorimetry.stirrerActive') }} ({{ uiParams.stirrerActive ? 'ON' : 'OFF' }})
            </button>
          </VariableGroup>

          <!-- Slot Persistence -->
          <div class="slot-manager-section">
            <SlotManager
              experiment-id="physics/thermo/calorimetry"
              :current-params="uiParams"
              :current-mode="mode"
              @load="onLoadSlot"
            />
          </div>
        </div>
      </aside>
    </div>

    <!-- Mobile Controls Drawer -->
    <BottomSheet :title="$t('common.controls')" class="mobile-only">
      <div class="sidebar-scroll mobile-scroll">
        <PresetPicker
          :presets="presetOptions"
          :current-preset="currentPresetId"
          @select="applyPreset"
        />

        <div class="profile-selector-group">
          <label class="control-label">{{ $t('calorimetry.solidMaterial') }}</label>
          <div class="material-grid">
            <button
              v-for="(item, idx) in solidMaterialsList"
              :key="item.id"
              type="button"
              class="material-card-btn"
              :class="{ active: uiParams.solidMaterialIndex === idx }"
              @click="uiParams.solidMaterialIndex = idx; onParamChange()"
            >
              <span class="mat-icon">{{ item.icon }}</span>
              <span class="mat-name">{{ $t(item.nameKey) }}</span>
              <span class="mat-c" dir="ltr">c={{ item.c }}</span>
            </button>
          </div>
        </div>

        <div class="profile-selector-group">
          <label class="control-label">{{ $t('calorimetry.liquidMedium') }}</label>
          <div class="liquid-pill-list">
            <button
              v-for="(liqItem, idx) in liquidMaterialsList"
              :key="liqItem.id"
              type="button"
              class="liquid-pill-btn"
              :class="{ active: uiParams.liquidMediumIndex === idx }"
              @click="uiParams.liquidMediumIndex = idx; onParamChange()"
            >
              <span class="liq-icon">{{ liqItem.icon }}</span>
              <span class="liq-name">{{ $t(liqItem.nameKey) }}</span>
              <span class="liq-c" dir="ltr">c={{ liqItem.c }}</span>
            </button>
          </div>
        </div>

        <VariableGroup :title="$t('calorimetry.solidPropsTitle')">
          <UnitSlider
            id="mSolidMass"
            v-model="uiParams.solidMassGrams"
            :label="$t('calorimetry.solidMass')"
            unit="g"
            :min="20"
            :max="500"
            :step="10"
            @update:model-value="onParamChange"
          />
          <UnitSlider
            id="mSolidTemp"
            v-model="uiParams.solidInitialTempC"
            :label="$t('calorimetry.solidTemp')"
            unit="°C"
            :min="-20"
            :max="120"
            :step="5"
            @update:model-value="onParamChange"
          />
        </VariableGroup>

        <VariableGroup :title="$t('calorimetry.liquidPropsTitle')">
          <UnitSlider
            id="mLiquidMass"
            v-model="uiParams.liquidMassGrams"
            :label="$t('calorimetry.liquidMass')"
            unit="g"
            :min="100"
            :max="600"
            :step="25"
            @update:model-value="onParamChange"
          />
          <UnitSlider
            id="mLiquidTemp"
            v-model="uiParams.liquidInitialTempC"
            :label="$t('calorimetry.liquidTemp')"
            unit="°C"
            :min="5"
            :max="60"
            :step="1"
            @update:model-value="onParamChange"
          />
        </VariableGroup>

        <VariableGroup :title="$t('common.variables')">
          <UnitSlider
            v-if="mode === 'real'"
            id="mWaterEquivalent"
            v-model="uiParams.calorimeterWaterEquivalentGrams"
            :label="$t('calorimetry.waterEquivalent')"
            unit="g"
            :min="0"
            :max="50"
            :step="5"
            @update:model-value="onParamChange"
          />
          <button
            type="button"
            class="btn-stirrer-toggle"
            :class="{ active: uiParams.stirrerActive }"
            @click="uiParams.stirrerActive = uiParams.stirrerActive ? 0 : 1; onParamChange()"
          >
            🌀 {{ $t('calorimetry.stirrerActive') }} ({{ uiParams.stirrerActive ? 'ON' : 'OFF' }})
          </button>
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
          📈 {{ $t('calorimetry.tabGraph') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'table' }"
          @click="activeTab = 'table'"
        >
          📋 {{ $t('calorimetry.tabTable') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'theory' }"
          @click="activeTab = 'theory'"
        >
          📖 {{ $t('calorimetry.tabTheory') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'notes' }"
          @click="activeTab = 'notes'"
        >
          📝 {{ $t('calorimetry.tabNotes') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'guided' }"
          @click="activeTab = 'guided'"
        >
          🎯 {{ $t('calorimetry.tabGuided') }}
        </button>
      </nav>

      <!-- Active Tab Body -->
      <div class="tab-content-area">
        <!-- Tab 1: Live Graph -->
        <div v-show="activeTab === 'graph'" class="tab-panel graph-panel-wrapper">
          <div class="live-metrics-strip">
            <div class="metric-chip">
              <span class="m-label">{{ $t('calorimetry.metricTeq') }}</span>
              <span class="m-value text-accent">{{ currentState.derived.theoreticalEquilibriumTempC.toFixed(2) }} °C</span>
            </div>
            <div class="metric-chip">
              <span class="m-label">{{ $t('calorimetry.metricSolidT') }}</span>
              <span class="m-value text-solid">{{ currentState.solidTempC.toFixed(1) }} °C</span>
            </div>
            <div class="metric-chip">
              <span class="m-label">{{ $t('calorimetry.metricLiquidT') }}</span>
              <span class="m-value text-liquid">{{ currentState.liquidTempC.toFixed(1) }} °C</span>
            </div>
            <div class="metric-chip">
              <span class="m-label">{{ $t('calorimetry.metricQ') }}</span>
              <span class="m-value">{{ (currentState.derived.heatTransferredJoules / 1000).toFixed(2) }} kJ</span>
            </div>
            <div v-if="uiParams.solidMaterialIndex === 5" class="metric-chip">
              <span class="m-label">{{ $t('calorimetry.metricIceRemaining') }}</span>
              <span class="m-value text-ice">{{ currentState.iceRemainingGrams.toFixed(1) }} g</span>
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
            :title="$t('calorimetry.tabTheory')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('calorimetry.theoryContent') }}</p>
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
        :title="$t('experiments.calorimetry.title')"
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
  createCalorimetryModel,
  stepCalorimetryModel,
  type CalorimetryParams,
  type CalorimetryState,
  type SolidMaterial,
  type LiquidMedium,
} from '../model/calorimetry';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { calorimetryConfig } from '../config';

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
import CalorimetryCanvas from '../view/CalorimetryCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();

const canvasViewRef = ref<InstanceType<typeof CalorimetryCanvas> | null>(null);

// Simulation State — Starts PAUSED by default, runs only when play is pressed
const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('copperWater');
const userNotes = ref<string>('');

// UI Parameters
const uiParams = reactive<Record<string, number>>({
  solidMaterialIndex: 0, // 0: copper, 1: aluminum, 2: iron, 3: lead, 4: glass, 5: ice
  solidMassGrams: 150,
  solidInitialTempC: 90,
  liquidMediumIndex: 0, // 0: water, 1: ethanol, 2: oil
  liquidMassGrams: 250,
  liquidInitialTempC: 20,
  calorimeterWaterEquivalentGrams: 15,
  stirrerActive: 1,
});

const solidMaterialsList = [
  { id: 'copper', icon: '🟤', nameKey: 'calorimetry.copperName', c: 385 },
  { id: 'aluminum', icon: '⚪', nameKey: 'calorimetry.aluminumName', c: 900 },
  { id: 'iron', icon: '⚫', nameKey: 'calorimetry.ironName', c: 450 },
  { id: 'lead', icon: '🔘', nameKey: 'calorimetry.leadName', c: 128 },
  { id: 'glass', icon: '💎', nameKey: 'calorimetry.glassName', c: 840 },
  { id: 'ice', icon: '🧊', nameKey: 'calorimetry.iceName', c: 2090 },
];

const liquidMaterialsList = [
  { id: 'water', icon: '💧', nameKey: 'calorimetry.waterName', c: 4184 },
  { id: 'ethanol', icon: '🧪', nameKey: 'calorimetry.ethanolName', c: 2440 },
  { id: 'oil', icon: '🛢️', nameKey: 'calorimetry.oilName', c: 2000 },
];

const solidKeys: SolidMaterial[] = ['copper', 'aluminum', 'iron', 'lead', 'glass', 'ice'];
const liquidKeys: LiquidMedium[] = ['water', 'ethanol', 'oil'];

const presetOptions = computed<PresetOption[]>(() =>
  calorimetryConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }))
);

const internalParams = computed<CalorimetryParams>(() => ({
  solidMaterial: solidKeys[uiParams.solidMaterialIndex] || 'copper',
  solidMassGrams: uiParams.solidMassGrams,
  solidInitialTempC: uiParams.solidInitialTempC,
  liquidMedium: liquidKeys[uiParams.liquidMediumIndex] || 'water',
  liquidMassGrams: uiParams.liquidMassGrams,
  liquidInitialTempC: uiParams.liquidInitialTempC,
  calorimeterWaterEquivalentGrams: uiParams.calorimeterWaterEquivalentGrams,
  ambientTempC: 20,
  stirrerActive: uiParams.stirrerActive === 1,
  isRealMode: mode.value === 'real',
}));

const currentState = ref<CalorimetryState>(createCalorimetryModel(internalParams.value));

// Live Data Series for Graph and Table
const series = reactive<DataSeries>({
  t: [0],
  x: [uiParams.solidInitialTempC], // Solid Temp (°C)
  y: [uiParams.liquidInitialTempC], // Liquid Temp (°C)
  vx: [currentState.value.derived.theoreticalEquilibriumTempC], // T_eq (°C)
  vy: [0], // Q (kJ)
  v: [Math.abs(uiParams.solidInitialTempC - uiParams.liquidInitialTempC)], // Delta T
});

const comparisonRuns = ref<ComparisonRun[]>([]);

const formulaItems = computed<FormulaItem[]>(() =>
  calorimetryConfig.formulas.map((f) => ({
    title: t(f.titleKey),
    latex: f.latex,
    explanation: t(f.explanationKey),
  }))
);

const guidedSteps = computed<LabStep[]>(() => [
  { id: 'step1', title: t('calorimetry.step1Title'), instruction: t('calorimetry.step1Desc') },
  { id: 'step2', title: t('calorimetry.step2Title'), instruction: t('calorimetry.step2Desc') },
  { id: 'step3', title: t('calorimetry.step3Title'), instruction: t('calorimetry.step3Desc') },
  { id: 'step4', title: t('calorimetry.step4Title'), instruction: t('calorimetry.step4Desc') },
]);

// Results & Reports
const calculatedResults = computed<Record<string, number | string>>(() => ({
  'Equilibrium Temperature (°C)': currentState.value.derived.theoreticalEquilibriumTempC.toFixed(2),
  'Heat Transferred (kJ)': (currentState.value.derived.heatTransferredJoules / 1000).toFixed(2),
  'Solid Material': solidKeys[uiParams.solidMaterialIndex],
  'Liquid Medium': liquidKeys[uiParams.liquidMediumIndex],
  'Thermal Equilibrium': currentState.value.isEquilibrated ? 'Yes' : 'In Progress',
}));

const reportResultsRows = computed(() => [
  {
    name: t('calorimetry.metricTeq'),
    simulated: `${currentState.value.derived.theoreticalEquilibriumTempC.toFixed(2)} °C`,
  },
  { name: t('calorimetry.metricSolidT'), simulated: `${currentState.value.solidTempC.toFixed(1)} °C` },
  { name: t('calorimetry.metricLiquidT'), simulated: `${currentState.value.liquidTempC.toFixed(1)} °C` },
  {
    name: t('calorimetry.metricQ'),
    simulated: `${(currentState.value.derived.heatTransferredJoules / 1000).toFixed(2)} kJ`,
  },
]);

const reportVariablesList = computed(() => [
  { name: t('calorimetry.solidMaterial'), symbol: 'Sample', value: solidKeys[uiParams.solidMaterialIndex], unit: '' },
  { name: t('calorimetry.solidMass'), symbol: 'm_s', value: uiParams.solidMassGrams, unit: 'g' },
  { name: t('calorimetry.solidTemp'), symbol: 'T_s0', value: uiParams.solidInitialTempC, unit: '°C' },
  { name: t('calorimetry.liquidMedium'), symbol: 'Liquid', value: liquidKeys[uiParams.liquidMediumIndex], unit: '' },
  { name: t('calorimetry.liquidMass'), symbol: 'm_liq', value: uiParams.liquidMassGrams, unit: 'g' },
  { name: t('calorimetry.liquidTemp'), symbol: 'T_liq0', value: uiParams.liquidInitialTempC, unit: '°C' },
  { name: t('calorimetry.waterEquivalent'), symbol: 'm_we', value: uiParams.calorimeterWaterEquivalentGrams, unit: 'g' },
]);

let accumulator: PhysicsAccumulator | null = null;
let sampleTimer = 0;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.05,
    onPhysicsStep: (dt: number) => {
      currentState.value = stepCalorimetryModel(currentState.value, internalParams.value, dt * speed.value);
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
  // Do NOT start accumulator here — wait until play is pressed
}

function recordDataPoint() {
  const tSec = Number(currentState.value.t.toFixed(1));

  series.t.push(tSec);
  series.x.push(Number(currentState.value.solidTempC.toFixed(2)));
  series.y.push(Number(currentState.value.liquidTempC.toFixed(2)));
  series.vx.push(Number(currentState.value.derived.theoreticalEquilibriumTempC.toFixed(2)));
  series.vy.push(Number((currentState.value.derived.heatTransferredJoules / 1000).toFixed(2)));
  series.v.push(Number(Math.abs(currentState.value.solidTempC - currentState.value.liquidTempC).toFixed(2)));

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
  currentState.value = createCalorimetryModel(internalParams.value);
  series.t = [0];
  series.x = [uiParams.solidInitialTempC];
  series.y = [uiParams.liquidInitialTempC];
  series.vx = [currentState.value.derived.theoreticalEquilibriumTempC];
  series.vy = [0];
  series.v = [Math.abs(uiParams.solidInitialTempC - uiParams.liquidInitialTempC)];
  sampleTimer = 0;
}

function stepSimulation() {
  if (accumulator) {
    accumulator.stepOnce();
  } else {
    currentState.value = stepCalorimetryModel(currentState.value, internalParams.value, 0.05);
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
  currentState.value = createCalorimetryModel(internalParams.value);
}

function onParamChange() {
  currentState.value = createCalorimetryModel(internalParams.value);
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
    name: `${solidKeys[uiParams.solidMaterialIndex]} + ${liquidKeys[uiParams.liquidMediumIndex]}`,
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
    const existing = await db.notes.where('experimentId').equals('physics/thermo/calorimetry').first();
    if (existing?.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/thermo/calorimetry',
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
    const existing = await db.notes.where('experimentId').equals('physics/thermo/calorimetry').first();
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
.calorimetry-experiment {
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

/* Enhanced 3-Column Solid Material Grid */
.material-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.material-card-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  min-height: 60px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 2px;
}

.material-card-btn:hover {
  background: var(--surface-hover);
  border-color: #38bdf8;
}

.material-card-btn.active {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}

.mat-icon {
  font-size: 16px;
  line-height: 1;
}

.mat-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
}

.material-card-btn.active .mat-name {
  color: #ffffff;
}

.mat-c {
  font-size: 10px;
  font-family: monospace;
  color: var(--text-secondary);
}

.material-card-btn.active .mat-c {
  color: rgba(255, 255, 255, 0.9);
}

/* Liquid Pill List */
.liquid-pill-list {
  display: flex;
  gap: 6px;
}

.liquid-pill-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 2px;
}

.liquid-pill-btn:hover {
  background: var(--surface-hover);
  border-color: #38bdf8;
}

.liquid-pill-btn.active {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  color: #ffffff;
}

.liq-icon {
  font-size: 14px;
}

.liq-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
}

.liquid-pill-btn.active .liq-name {
  color: #ffffff;
}

.liq-c {
  font-size: 9px;
  font-family: monospace;
  color: var(--text-secondary);
}

.liquid-pill-btn.active .liq-c {
  color: rgba(255, 255, 255, 0.9);
}

.btn-stirrer-toggle {
  width: 100%;
  padding: var(--space-sm);
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-stirrer-toggle:hover {
  background: var(--surface-hover);
}

.btn-stirrer-toggle.active {
  background: rgba(16, 185, 129, 0.15);
  border-color: #10b981;
  color: #10b981;
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

.text-solid {
  color: #ef4444;
}

.text-liquid {
  color: #06b6d4;
}

.text-ice {
  color: #38bdf8;
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
