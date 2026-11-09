<template>
  <div class="pascal-bernoulli-experiment">
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

    <!-- Main Workspace: Visual Simulation + Controls Sidebar -->
    <div class="experiment-workspace">
      <!-- Left/Center: Visual Scene Mount -->
      <div class="scene-container">
        <div class="canvas-mount">
          <PascalBernoulliCanvas
            ref="canvasViewRef"
            :state="currentState"
            :params="internalParams"
          />

          <!-- Floating Overlaid Measurement Tool Widgets -->
          <RulerWidget v-if="showRuler" :visible="showRuler" @close="showRuler = false" />
          <StopwatchWidget v-if="showStopwatch" :visible="showStopwatch" @close="showStopwatch = false" />
        </div>
      </div>

      <!-- Right/Side: Controls & Parameter Sidebar (Desktop) -->
      <aside class="control-sidebar desktop-only glass-panel">
        <div class="sidebar-header">
          <h3>{{ $t('common.controls') }}</h3>
        </div>

        <div class="sidebar-scroll">
          <!-- Preset Selector -->
          <PresetPicker
            :presets="presetOptions"
            :current-preset="currentPresetId"
            @select="applyPreset"
          />

          <!-- Apparatus Mode Selector -->
          <div class="profile-selector-group">
            <label class="control-label">{{ $t('pascalBernoulli.apparatusMode') }}</label>
            <div class="profile-pill-list">
              <button
                type="button"
                class="profile-pill-btn"
                :class="{ active: uiParams.apparatusModeIndex === 0 }"
                @click="uiParams.apparatusModeIndex = 0; onParamChange()"
              >
                {{ $t('pascalBernoulli.modeVenturi') }}
              </button>
              <button
                type="button"
                class="profile-pill-btn"
                :class="{ active: uiParams.apparatusModeIndex === 1 }"
                @click="uiParams.apparatusModeIndex = 1; onParamChange()"
              >
                {{ $t('pascalBernoulli.modeHydraulic') }}
              </button>
            </div>
          </div>

          <!-- Fluid Substance Selector -->
          <div class="profile-selector-group">
            <label class="control-label">{{ $t('pascalBernoulli.fluidType') }}</label>
            <div class="profile-pill-list">
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

          <!-- Venturi Controls -->
          <VariableGroup
            v-if="uiParams.apparatusModeIndex === 0"
            :title="$t('pascalBernoulli.modeVenturi')"
          >
            <UnitSlider
              id="inletVelocity"
              v-model="uiParams.inletVelocity"
              :label="$t('pascalBernoulli.inletVelocity')"
              unit="m/s"
              :min="0.5"
              :max="6.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="constrictionRatio"
              v-model="uiParams.constrictionRatio"
              :label="$t('pascalBernoulli.constrictionRatio')"
              unit=""
              :min="0.3"
              :max="0.8"
              :step="0.05"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Hydraulic Lift Controls -->
          <VariableGroup
            v-if="uiParams.apparatusModeIndex === 1"
            :title="$t('pascalBernoulli.modeHydraulic')"
          >
            <UnitSlider
              id="inputForce"
              v-model="uiParams.inputForce"
              :label="$t('pascalBernoulli.inputForce')"
              unit="N"
              :min="50"
              :max="1000"
              :step="10"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="pistonAreaRatio"
              v-model="uiParams.pistonAreaRatio"
              :label="$t('pascalBernoulli.pistonAreaRatio')"
              unit=""
              :min="2"
              :max="40"
              :step="1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Environmental Gravity -->
          <VariableGroup :title="$t('pascalBernoulli.gravity')">
            <UnitSlider
              id="gravity"
              v-model="uiParams.gravity"
              :label="$t('pascalBernoulli.gravity')"
              unit="m/s²"
              :min="1.6"
              :max="20.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slot Save/Load Persistence -->
          <SlotManager
            experiment-id="physics/fluids/pascal-bernoulli"
            :current-params="uiParams"
            :current-mode="mode"
            @load="onLoadSlot"
          />
        </div>
      </aside>
    </div>

    <!-- Mobile Draggable Bottom Sheet for Controls -->
    <BottomSheet :title="$t('common.controls')" class="mobile-only">
      <PresetPicker
        :presets="presetOptions"
        :current-preset="currentPresetId"
        @select="applyPreset"
      />

      <div class="profile-selector-group">
        <label class="control-label">{{ $t('pascalBernoulli.apparatusMode') }}</label>
        <div class="profile-pill-list">
          <button
            type="button"
            class="profile-pill-btn"
            :class="{ active: uiParams.apparatusModeIndex === 0 }"
            @click="uiParams.apparatusModeIndex = 0; onParamChange()"
          >
            {{ $t('pascalBernoulli.modeVenturi') }}
          </button>
          <button
            type="button"
            class="profile-pill-btn"
            :class="{ active: uiParams.apparatusModeIndex === 1 }"
            @click="uiParams.apparatusModeIndex = 1; onParamChange()"
          >
            {{ $t('pascalBernoulli.modeHydraulic') }}
          </button>
        </div>
      </div>

      <div class="profile-selector-group">
        <label class="control-label">{{ $t('pascalBernoulli.fluidType') }}</label>
        <div class="profile-pill-list">
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

      <VariableGroup
        v-if="uiParams.apparatusModeIndex === 0"
        :title="$t('pascalBernoulli.modeVenturi')"
      >
        <UnitSlider
          id="inletVelocity-mobile"
          v-model="uiParams.inletVelocity"
          :label="$t('pascalBernoulli.inletVelocity')"
          unit="m/s"
          :min="0.5"
          :max="6.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="constrictionRatio-mobile"
          v-model="uiParams.constrictionRatio"
          :label="$t('pascalBernoulli.constrictionRatio')"
          unit=""
          :min="0.3"
          :max="0.8"
          :step="0.05"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup
        v-if="uiParams.apparatusModeIndex === 1"
        :title="$t('pascalBernoulli.modeHydraulic')"
      >
        <UnitSlider
          id="inputForce-mobile"
          v-model="uiParams.inputForce"
          :label="$t('pascalBernoulli.inputForce')"
          unit="N"
          :min="50"
          :max="1000"
          :step="10"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="pistonAreaRatio-mobile"
          v-model="uiParams.pistonAreaRatio"
          :label="$t('pascalBernoulli.pistonAreaRatio')"
          unit=""
          :min="2"
          :max="40"
          :step="1"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/fluids/pascal-bernoulli"
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
            :title="$t('pascalBernoulli.tabTheory')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('pascalBernoulli.theoryContent') }}</p>
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
        :title="$t('experiments.pascalBernoulli.title')"
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
  createPascalBernoulliModel,
  stepPascalBernoulliModel,
  type PascalBernoulliParams,
  type PascalBernoulliState,
  type VenturiParams,
  type HydraulicParams,
} from '../model/pascal-bernoulli';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { pascalBernoulliConfig } from '../config';

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
import PascalBernoulliCanvas from '../view/PascalBernoulliCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();

const canvasViewRef = ref<InstanceType<typeof PascalBernoulliCanvas> | null>(null);

// Simulation Controls
const isRunning = ref(true);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('standardVenturiWater');
const userNotes = ref<string>('');

// UI Model Parameters
const uiParams = reactive({
  apparatusModeIndex: 0, // 0 = venturi, 1 = hydraulic
  fluidTypeIndex: 0, // 0 = water, 1 = oil, 2 = air, 3 = honey
  inletVelocity: 2.0,
  constrictionRatio: 0.5,
  inputForce: 200,
  pistonAreaRatio: 16,
  gravity: 9.8,
});

const fluidDensities = [1000, 850, 1.2, 1260];

const fluidOptions = computed(() => [
  t('pascalBernoulli.fluidWater'),
  t('pascalBernoulli.fluidOil'),
  t('pascalBernoulli.fluidAir'),
  t('pascalBernoulli.fluidHoney'),
]);

const currentVenturiParams = computed<VenturiParams>(() => {
  const isReal = mode.value === 'real';
  const density = fluidDensities[uiParams.fluidTypeIndex] || 1000;
  const d1 = 0.16;
  const d2 = d1 * uiParams.constrictionRatio;

  return {
    apparatusMode: 'venturi',
    fluidDensity: density,
    inletVelocity: uiParams.inletVelocity,
    inletDiameter: d1,
    constrictionDiameter: d2,
    inletPressure: 150000, // 150 kPa
    pipeLength: 1.0,
    gravity: uiParams.gravity,
    isRealMode: isReal,
  };
});

const currentHydraulicParams = computed<HydraulicParams>(() => {
  const isReal = mode.value === 'real';
  const density = fluidDensities[uiParams.fluidTypeIndex] || 850;
  const r1 = 0.05; // 5 cm
  const r2 = r1 * Math.sqrt(uiParams.pistonAreaRatio);

  return {
    apparatusMode: 'hydraulic',
    fluidDensity: density,
    piston1Radius: r1,
    piston2Radius: r2,
    inputForce: uiParams.inputForce,
    inputDisplacement: 0.25,
    gravity: uiParams.gravity,
    isRealMode: isReal,
  };
});

const internalParams = computed<PascalBernoulliParams>(() => {
  if (uiParams.apparatusModeIndex === 0) {
    return currentVenturiParams.value;
  }
  return currentHydraulicParams.value;
});

// Simulation State
const currentState = ref<PascalBernoulliState>(
  createPascalBernoulliModel(currentVenturiParams.value, currentHydraulicParams.value),
);

// Preset Definitions
const presetOptions = computed<PresetOption[]>(() => {
  return (pascalBernoulliConfig.presets || []).map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }));
});

// Tabs
const bottomTabs = computed(() => [
  { id: 'graph', label: t('common.graph') },
  { id: 'table', label: t('common.table') },
  { id: 'theory', label: t('pascalBernoulli.tabTheory') },
  { id: 'notes', label: t('common.notes') },
  { id: 'guided', label: t('common.guided') },
]);

// Guided Steps
const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step-1',
    title: t('pascalBernoulli.modeVenturi'),
    instruction: t('pascalBernoulli.theoryContent'),
    hint: 'P1 + 0.5*rho*v1^2 = P2 + 0.5*rho*v2^2',
  },
  {
    id: 'step-2',
    title: t('pascalBernoulli.constrictionRatio'),
    instruction: t('pascalBernoulli.constrictionRatio_desc'),
    hint: 'Decrease constriction ratio to see dramatic velocity increase and pressure drop.',
  },
  {
    id: 'step-3',
    title: t('pascalBernoulli.modeHydraulic'),
    instruction: t('pascalBernoulli.apparatusMode_desc'),
    hint: 'Switch to Hydraulic Lift mode to verify F2 = F1 * (A2/A1).',
  },
]);

// KaTeX Formulas
const formulaItems = computed<FormulaItem[]>(() => {
  if (uiParams.apparatusModeIndex === 0) {
    return [
      {
        title: t('pascalBernoulli.modeVenturi'),
        latex: 'A_1 v_1 = A_2 v_2 = Q',
        explanation: 'معادله پیوستگی شاره تراکم‌ناپذیر',
        liveValue: `Q = ${(currentState.value.venturi.volumeFlowRate * 1000).toFixed(2)} \\text{ L/s}`,
      },
      {
        title: 'معادله برنولی',
        latex: 'P_1 + \\frac{1}{2}\\rho v_1^2 = P_2 + \\frac{1}{2}\\rho v_2^2',
        explanation: 'پایستگی انرژی مکانیکی در امتداد خط جریان افقی',
        liveValue: `P_2 = ${(currentState.value.venturi.pressure2 / 1000).toFixed(1)} \\text{ kPa}`,
      },
      {
        title: 'افت فشار گلوگاه ونتوری',
        latex: '\\Delta P = \\frac{1}{2}\\rho (v_2^2 - v_1^2)',
        explanation: 'کاهش فشار استاتیک متناظر با افزایش انرژی جنبشی',
        liveValue: `\\Delta P = ${(currentState.value.venturi.deltaPressure / 1000).toFixed(2)} \\text{ kPa}`,
      },
    ];
  }

  return [
    {
      title: 'اصل پاسکال',
      latex: '\\frac{F_1}{A_1} = \\frac{F_2}{A_2} = P',
      explanation: 'انتقال همه‌جانبه و بدون افت فشار در شاره محبوس',
      liveValue: `P = ${(currentState.value.hydraulic.fluidPressure / 1000).toFixed(1)} \\text{ kPa}`,
    },
    {
      title: 'مزیت مکانیکی',
      latex: 'MA = \\frac{A_2}{A_1} = \\left(\\frac{r_2}{r_1}\\right)^2',
      explanation: 'ضریب تقویت نیروی خروجی نسبت به ورودی',
      liveValue: `MA = ${currentState.value.hydraulic.mechanicalAdvantage.toFixed(1)}\\times`,
    },
    {
      title: 'پایستگی کار مکانیکی',
      latex: 'W_1 = F_1 d_1 = F_2 d_2 = W_2',
      explanation: 'کار انجام شده در حالت ایده‌آل پایسته است',
      liveValue: `W_2 = ${currentState.value.hydraulic.workOutput.toFixed(1)} \\text{ J}`,
    },
  ];
});

// Data Series for Live Graph and Table
const series = reactive<DataSeries>({
  t: [0],
  x: [0],
  y: [0],
  vx: [0],
  vy: [0],
  v: [0],
});

const comparisonRuns = ref<ComparisonRun[]>([]);

// Report Data
const calculatedResults = computed(() => {
  if (uiParams.apparatusModeIndex === 0) {
    return {
      v1: currentState.value.venturi.velocity1,
      v2: currentState.value.venturi.velocity2,
      p1: currentState.value.venturi.pressure1,
      p2: currentState.value.venturi.pressure2,
      deltaP: currentState.value.venturi.deltaPressure,
      Q: currentState.value.venturi.volumeFlowRate,
    };
  }
  return {
    F1: uiParams.inputForce,
    F2: currentState.value.hydraulic.outputForce,
    MA: currentState.value.hydraulic.mechanicalAdvantage,
    fluidP: currentState.value.hydraulic.fluidPressure,
    work: currentState.value.hydraulic.workInput,
    liftedMass: currentState.value.hydraulic.liftedMass,
  };
});

const reportResultsRows = computed(() => {
  if (uiParams.apparatusModeIndex === 0) {
    return [
      { name: 'v₁ (سرعت ورودی)', simulated: `${currentState.value.venturi.velocity1.toFixed(2)} m/s` },
      { name: 'v₂ (سرعت گلوگاه)', simulated: `${currentState.value.venturi.velocity2.toFixed(2)} m/s` },
      { name: 'P₁ (فشار ورودی)', simulated: `${(currentState.value.venturi.pressure1 / 1000).toFixed(1)} kPa` },
      { name: 'P₂ (فشار گلوگاه)', simulated: `${(currentState.value.venturi.pressure2 / 1000).toFixed(1)} kPa` },
      { name: 'ΔP (افت فشار)', simulated: `${(currentState.value.venturi.deltaPressure / 1000).toFixed(2)} kPa` },
      { name: 'Q (دبی حجمی)', simulated: `${(currentState.value.venturi.volumeFlowRate * 1000).toFixed(2)} L/s` },
    ];
  }
  return [
    { name: 'F₁ (نیروی ورودی)', simulated: `${uiParams.inputForce} N` },
    { name: 'F₂ (نیروی بالابر)', simulated: `${currentState.value.hydraulic.outputForce.toFixed(0)} N` },
    { name: 'MA (مزیت مکانیکی)', simulated: `${currentState.value.hydraulic.mechanicalAdvantage.toFixed(1)}×` },
    { name: 'فشار داخلی شاره', simulated: `${(currentState.value.hydraulic.fluidPressure / 1000).toFixed(1)} kPa` },
    { name: 'کار ورودی (W₁)', simulated: `${currentState.value.hydraulic.workInput.toFixed(1)} J` },
    { name: 'کار خروجی (W₂)', simulated: `${currentState.value.hydraulic.workOutput.toFixed(1)} J` },
  ];
});

const reportVariablesList = computed(() => [
  { name: t('pascalBernoulli.apparatusMode'), symbol: 'Mode', value: uiParams.apparatusModeIndex === 0 ? 'Venturi' : 'Hydraulic', unit: '' },
  { name: t('pascalBernoulli.fluidType'), symbol: 'ρ', value: fluidDensities[uiParams.fluidTypeIndex] || 1000, unit: 'kg/m³' },
  { name: t('pascalBernoulli.gravity'), symbol: 'g', value: uiParams.gravity, unit: 'm/s²' },
  { name: t('common.mode'), symbol: 'Env', value: mode.value, unit: '' },
]);

// Physics Accumulator Engine
let accumulator: PhysicsAccumulator | null = null;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.05,
    onPhysicsStep: (dt: number) => {
      currentState.value = stepPascalBernoulliModel(currentState.value, internalParams.value, dt * speed.value);
      recordDataPoint();
    },
    onRenderStep: () => {},
  });
  if (isRunning.value) {
    accumulator.start();
  }
}

function recordDataPoint() {
  const maxSamples = 200;
  series.t.push(Number(currentState.value.t.toFixed(2)));
  if (uiParams.apparatusModeIndex === 0) {
    series.x.push(Number(currentState.value.venturi.velocity1.toFixed(2)));
    series.y.push(Number(currentState.value.venturi.velocity2.toFixed(2)));
    series.vx.push(Number((currentState.value.venturi.pressure1 / 1000).toFixed(2)));
    series.vy.push(Number((currentState.value.venturi.pressure2 / 1000).toFixed(2)));
    series.v.push(Number((currentState.value.venturi.deltaPressure / 1000).toFixed(2)));
  } else {
    series.x.push(Number(uiParams.inputForce));
    series.y.push(Number(currentState.value.hydraulic.outputForce.toFixed(0)));
    series.vx.push(Number((currentState.value.hydraulic.fluidPressure / 1000).toFixed(1)));
    series.vy.push(Number(currentState.value.hydraulic.mechanicalAdvantage.toFixed(1)));
    series.v.push(Number(currentState.value.hydraulic.workInput.toFixed(1)));
  }

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
  currentState.value = stepPascalBernoulliModel(currentState.value, internalParams.value, 0.05);
  recordDataPoint();
}

function resetSimulation() {
  currentState.value = createPascalBernoulliModel(currentVenturiParams.value, currentHydraulicParams.value);
  series.t = [0];
  series.x = [0];
  series.y = [0];
  series.vx = [0];
  series.vy = [0];
  series.v = [0];
  if (isRunning.value && accumulator && !accumulator.getIsRunning()) {
    accumulator.start();
  }
}

function setSpeed(newSpeed: number) {
  speed.value = newSpeed;
}

function setMode(newMode: 'ideal' | 'real') {
  mode.value = newMode;
  onParamChange();
}

function onParamChange() {
  currentState.value = createPascalBernoulliModel(currentVenturiParams.value, currentHydraulicParams.value);
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
    const existing = await db.notes.where('experimentId').equals('physics/fluids/pascal-bernoulli').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/fluids/pascal-bernoulli',
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
    const existing = await db.notes.where('experimentId').equals('physics/fluids/pascal-bernoulli').first();
    if (existing) {
      userNotes.value = existing.content;
    }
  } catch (err) {
    console.error('Failed to load notes:', err);
  }
}

onMounted(() => {
  resetSimulation();
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
.pascal-bernoulli-experiment {
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

.profile-pill-btn {
  flex: 1;
  min-width: 85px;
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
