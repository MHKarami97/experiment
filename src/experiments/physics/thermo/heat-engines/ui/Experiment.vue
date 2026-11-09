<template>
  <div class="heat-engines-experiment">
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
          <HeatEnginesCanvas
            ref="canvasViewRef"
            :metrics="currentMetrics"
            :instant-state="currentInstantState"
            :params="internalParams"
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

          <!-- Cycle Type Selector Pills -->
          <div class="control-section">
            <label class="control-label">{{ $t('heatEngines.cycleType') }}</label>
            <div class="cycle-pill-grid">
              <button
                v-for="(cItem, idx) in cycleTypeOptions"
                :key="idx"
                type="button"
                class="cycle-pill-btn"
                :class="{ active: uiParams.cycleTypeIndex === idx }"
                @click="setCycleType(idx)"
              >
                <span class="cycle-icon">{{ cItem.icon }}</span>
                <span class="cycle-name">{{ cItem.label }}</span>
              </button>
            </div>
          </div>

          <!-- Working Gas Selector -->
          <div class="control-section">
            <label class="control-label">{{ $t('heatEngines.gasType') }}</label>
            <div class="gas-pill-list">
              <button
                v-for="(gItem, idx) in gasTypeOptions"
                :key="idx"
                type="button"
                class="gas-pill-btn"
                :class="{ active: uiParams.gasTypeIndex === idx }"
                @click="uiParams.gasTypeIndex = idx; onParamChange()"
              >
                {{ gItem.label }}
              </button>
            </div>
          </div>

          <!-- Temperatures & Cycle Parameters -->
          <VariableGroup :title="$t('common.variables')">
            <UnitSlider
              id="th"
              v-model="uiParams.th"
              :label="$t('heatEngines.th')"
              unit="K"
              :min="350"
              :max="1500"
              :step="10"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="tc"
              v-model="uiParams.tc"
              :label="$t('heatEngines.tc')"
              unit="K"
              :min="250"
              :max="450"
              :step="5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="compressionRatio"
              v-model="uiParams.compressionRatio"
              :label="$t('heatEngines.compressionRatio')"
              unit=""
              :min="2"
              :max="22"
              :step="0.5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="uiParams.cycleTypeIndex === 2"
              id="cutOffRatio"
              v-model="uiParams.cutOffRatio"
              :label="$t('heatEngines.cutOffRatio')"
              unit=""
              :min="1.2"
              :max="3.5"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="moles"
              v-model="uiParams.moles"
              :label="$t('heatEngines.moles')"
              unit="mol"
              :min="0.01"
              :max="0.20"
              :step="0.01"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="rpm"
              v-model="uiParams.rpm"
              :label="$t('heatEngines.rpm')"
              unit="RPM"
              :min="10"
              :max="120"
              :step="5"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Real Mode Dissipation Parameters -->
          <VariableGroup v-if="mode === 'real'" :title="$t('heatEngines.modeReal')">
            <UnitSlider
              id="pistonFriction"
              v-model="uiParams.pistonFriction"
              :label="$t('heatEngines.friction')"
              unit="%"
              :min="0"
              :max="25"
              :step="1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="heatLeak"
              v-model="uiParams.heatLeak"
              :label="$t('heatEngines.heatLeak')"
              unit="W/K"
              :min="0"
              :max="3.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Save/Load State Slots -->
          <SlotManager
            experiment-id="physics/thermo/heat-engines"
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
            <label class="control-label">{{ $t('heatEngines.cycleType') }}</label>
            <div class="cycle-pill-grid">
              <button
                v-for="(cItem, idx) in cycleTypeOptions"
                :key="idx"
                type="button"
                class="cycle-pill-btn"
                :class="{ active: uiParams.cycleTypeIndex === idx }"
                @click="setCycleType(idx)"
              >
                <span class="cycle-icon">{{ cItem.icon }}</span>
                <span class="cycle-name">{{ cItem.label }}</span>
              </button>
            </div>
          </div>

          <VariableGroup :title="$t('common.variables')">
            <UnitSlider
              id="m-th"
              v-model="uiParams.th"
              :label="$t('heatEngines.th')"
              unit="K"
              :min="350"
              :max="1500"
              :step="10"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="m-tc"
              v-model="uiParams.tc"
              :label="$t('heatEngines.tc')"
              unit="K"
              :min="250"
              :max="450"
              :step="5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="m-cr"
              v-model="uiParams.compressionRatio"
              :label="$t('heatEngines.compressionRatio')"
              unit=""
              :min="2"
              :max="22"
              :step="0.5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="m-rpm"
              v-model="uiParams.rpm"
              :label="$t('heatEngines.rpm')"
              unit="RPM"
              :min="10"
              :max="120"
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
          :class="{ active: activeTab === 'states' }"
          @click="activeTab = 'states'"
        >
          🔍 {{ $t('heatEngines.statesTable') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'performance' }"
          @click="activeTab = 'performance'"
        >
          ⚡ {{ $t('heatEngines.idealVsReal') }}
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
        <!-- Tab 1: Four States Point Inspector -->
        <div v-show="activeTab === 'states'" class="tab-panel states-tab">
          <div class="states-grid">
            <div
              v-for="st in currentMetrics.states"
              :key="st.index"
              class="state-card"
              :class="{ 'current-vertex': currentInstantState.strokeIndex === st.index }"
            >
              <div class="state-card-header">
                <span class="state-badge">{{ stateBadges[st.index - 1] }}</span>
                <span class="state-title">{{ $t('heatEngines.state') }} {{ st.index }}</span>
              </div>
              <div class="state-metrics-list">
                <div class="state-row">
                  <span class="s-label">{{ $t('heatEngines.pressure') }}:</span>
                  <span class="s-val ltr-island">{{ (st.pressure / 1000).toFixed(1) }} kPa</span>
                </div>
                <div class="state-row">
                  <span class="s-label">{{ $t('heatEngines.volume') }}:</span>
                  <span class="s-val ltr-island">{{ (st.volume * 1000).toFixed(2) }} L</span>
                </div>
                <div class="state-row">
                  <span class="s-label">{{ $t('heatEngines.temperature') }}:</span>
                  <span class="s-val ltr-island">{{ st.temperature.toFixed(1) }} K</span>
                </div>
                <div class="state-row">
                  <span class="s-label">{{ $t('heatEngines.internalEnergy') }}:</span>
                  <span class="s-val ltr-island">{{ st.internalEnergy.toFixed(1) }} J</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Performance & Energy Balance -->
        <div v-show="activeTab === 'performance'" class="tab-panel performance-tab">
          <div class="performance-cards-grid">
            <div class="perf-card highlight-card">
              <span class="perf-title">{{ $t('heatEngines.efficiency') }} (η)</span>
              <span class="perf-value ltr-island">
                {{ ((mode === 'real' ? currentMetrics.thermalEfficiencyReal : currentMetrics.thermalEfficiencyIdeal) * 100).toFixed(1) }}%
              </span>
              <span class="perf-sub">
                {{ $t('heatEngines.carnotLimit') }}: {{ (currentMetrics.carnotLimit * 100).toFixed(1) }}%
              </span>
            </div>

            <div class="perf-card">
              <span class="perf-title">{{ $t('heatEngines.workNet') }} (W_net)</span>
              <span class="perf-value ltr-island">
                {{ (mode === 'real' ? currentMetrics.workNetReal : currentMetrics.workNetIdeal).toFixed(1) }} J
              </span>
              <span class="perf-sub">
                MEP: {{ (currentMetrics.meanEffectivePressure / 1000).toFixed(1) }} kPa
              </span>
            </div>

            <div class="perf-card">
              <span class="perf-title">{{ $t('heatEngines.qIn') }} / {{ $t('heatEngines.qOut') }}</span>
              <span class="perf-value ltr-island">
                {{ currentMetrics.qIn.toFixed(1) }} / {{ currentMetrics.qOut.toFixed(1) }} J
              </span>
              <span class="perf-sub">
                ΔQ = {{ (currentMetrics.qIn - currentMetrics.qOut).toFixed(1) }} J
              </span>
            </div>

            <div class="perf-card">
              <span class="perf-title">{{ $t('heatEngines.power') }}</span>
              <span class="perf-value ltr-island">
                {{ currentMetrics.power.toFixed(1) }} W
              </span>
              <span class="perf-sub">
                @ {{ uiParams.rpm }} RPM
              </span>
            </div>
          </div>

          <!-- Real Mode Loss Breakdown -->
          <div v-if="mode === 'real'" class="losses-breakdown-card">
            <h4>{{ $t('heatEngines.tool_losses') }}</h4>
            <div class="losses-list">
              <div class="loss-row">
                <span>{{ $t('heatEngines.idealEfficiency') }}:</span>
                <span class="ltr-island">{{ (currentMetrics.thermalEfficiencyIdeal * 100).toFixed(1) }}%</span>
              </div>
              <div class="loss-row">
                <span>{{ $t('heatEngines.workLoss') }} ({{ uiParams.pistonFriction }}%):</span>
                <span class="ltr-island text-danger">-{{ ((currentMetrics.workNetIdeal - currentMetrics.workNetReal)).toFixed(1) }} J</span>
              </div>
              <div class="loss-row">
                <span>{{ $t('heatEngines.realEfficiency') }}:</span>
                <span class="ltr-island text-success">{{ (currentMetrics.thermalEfficiencyReal * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Live Indicator Graph -->
        <div v-show="activeTab === 'graph'" class="tab-panel">
          <GraphPanel
            :current-series="series"
            :comparison-runs="comparisonRuns"
            x-label="Volume (L)"
            y-label="Pressure (kPa)"
            x-key="x"
            y-key="y"
          />
        </div>

        <!-- Tab 4: Live Data Table -->
        <div v-show="activeTab === 'table'" class="tab-panel">
          <DataTable
            :series="series"
            :column-keys="['t', 'x', 'y', 'vx', 'vy']"
            :column-labels="[
              $t('common.time'),
              $t('heatEngines.volume') + ' (L)',
              $t('heatEngines.pressure') + ' (kPa)',
              $t('heatEngines.temperature') + ' (K)',
              $t('heatEngines.power') + ' (W)'
            ]"
          />
        </div>

        <!-- Tab 5: Physics Theory & Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel">
          <FormulaPanel
            :title="$t('heatEngines.theoryTitle')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('heatEngines.theoryP1') }}</p>
            <p>{{ $t('heatEngines.theoryP2') }}</p>
            <p>{{ $t('heatEngines.theoryP3') }}</p>
          </div>
        </div>

        <!-- Tab 6: Lab Notes -->
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

        <!-- Tab 7: Guided Steps -->
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
        :title="$t('experiments.heatEngines.title')"
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
  calculateCycleMetrics,
  calculateInstantaneousState,
  type EngineParams,
  type CycleMetrics,
  type InstantaneousState,
  type CycleType,
  type GasType
} from '../model/heat-engines';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { heatEnginesConfig } from '../config';

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
import HeatEnginesCanvas from '../view/HeatEnginesCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();

const canvasViewRef = ref<InstanceType<typeof HeatEnginesCanvas> | null>(null);

// Simulation Controls — Starts PAUSED by default, runs only when play is pressed
const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('states');
const userNotes = ref('');

const cycleTypeKeys: CycleType[] = ['carnot', 'otto', 'diesel', 'stirling'];
const gasTypeKeys: GasType[] = ['monatomic', 'diatomic', 'polyatomic'];
const stateBadges = ['①', '②', '③', '④'];

const cycleTypeOptions = computed(() => [
  { label: t('heatEngines.cycle_carnot'), icon: '🔄' },
  { label: t('heatEngines.cycle_otto'), icon: '🚗' },
  { label: t('heatEngines.cycle_diesel'), icon: '🚛' },
  { label: t('heatEngines.cycle_stirling'), icon: '♨️' },
]);

const gasTypeOptions = computed(() => [
  { label: t('heatEngines.gas_monatomic') },
  { label: t('heatEngines.gas_diatomic') },
  { label: t('heatEngines.gas_polyatomic') },
]);

const currentPresetId = ref<string>('carnot_ideal');

const presetOptions = computed<PresetOption[]>(() =>
  heatEnginesConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }))
);

const uiParams = reactive<Record<string, number>>({
  cycleTypeIndex: 0,
  th: 600,
  tc: 300,
  compressionRatio: 4.0,
  cutOffRatio: 2.0,
  gasTypeIndex: 1, // Diatomic (Air)
  moles: 0.05,
  rpm: 30,
  pistonFriction: 6,
  heatLeak: 0.5,
});

const internalParams = computed<EngineParams>(() => ({
  cycleType: cycleTypeKeys[uiParams.cycleTypeIndex],
  gasType: gasTypeKeys[uiParams.gasTypeIndex],
  moles: uiParams.moles,
  th: uiParams.th,
  tc: uiParams.tc,
  compressionRatio: uiParams.compressionRatio,
  cutOffRatio: uiParams.cutOffRatio,
  realMode: mode.value === 'real',
  frictionCoeff: uiParams.pistonFriction / 100,
  heatLeakCoeff: uiParams.heatLeak,
}));

const currentMetrics = computed<CycleMetrics>(() => {
  return calculateCycleMetrics(internalParams.value, uiParams.rpm);
});

const currentPhase = ref(0); // Phase in radians [0, 2π]

const currentInstantState = computed<InstantaneousState>(() => {
  return calculateInstantaneousState(currentPhase.value, currentMetrics.value, internalParams.value);
});

// Live Data Series for Graph and Table
const series = reactive<DataSeries>({
  t: [0],
  x: [currentInstantState.value.volume * 1000], // Volume (L)
  y: [currentInstantState.value.pressure / 1000], // Pressure (kPa)
  vx: [currentInstantState.value.temperature], // Temperature (K)
  vy: [currentMetrics.value.power], // Power (W)
  v: [currentMetrics.value.thermalEfficiencyIdeal * 100],
});

const comparisonRuns = ref<ComparisonRun[]>([]);

const formulaItems = computed<FormulaItem[]>(() =>
  heatEnginesConfig.formulas.map((f) => ({
    title: t(f.titleKey),
    latex: f.latex,
    explanation: t(f.explanationKey),
  }))
);

const guidedSteps = computed<LabStep[]>(() => [
  { id: 'step1', title: t('heatEngines.cycle_carnot'), instruction: t('heatEngines.carnot_stroke1') },
  { id: 'step2', title: t('heatEngines.cycle_otto'), instruction: t('heatEngines.otto_stroke2') },
  { id: 'step3', title: t('heatEngines.cycle_diesel'), instruction: t('heatEngines.diesel_stroke2') },
  { id: 'step4', title: t('heatEngines.tool_losses'), instruction: t('heatEngines.real_friction_effect') },
]);

const calculatedResults = computed<Record<string, number | string>>(() => ({
  'Cycle Type': cycleTypeKeys[uiParams.cycleTypeIndex],
  'Work Net (J)': (mode.value === 'real' ? currentMetrics.value.workNetReal : currentMetrics.value.workNetIdeal).toFixed(1),
  'Thermal Efficiency (%)': ((mode.value === 'real' ? currentMetrics.value.thermalEfficiencyReal : currentMetrics.value.thermalEfficiencyIdeal) * 100).toFixed(1),
  'Carnot Limit (%)': (currentMetrics.value.carnotLimit * 100).toFixed(1),
  'Power (W)': currentMetrics.value.power.toFixed(1),
  'MEP (kPa)': (currentMetrics.value.meanEffectivePressure / 1000).toFixed(1),
}));

const reportResultsRows = computed(() => [
  { name: t('heatEngines.workNet'), simulated: `${(mode.value === 'real' ? currentMetrics.value.workNetReal : currentMetrics.value.workNetIdeal).toFixed(1)} J` },
  { name: t('heatEngines.efficiency'), simulated: `${((mode.value === 'real' ? currentMetrics.value.thermalEfficiencyReal : currentMetrics.value.thermalEfficiencyIdeal) * 100).toFixed(1)}%` },
  { name: t('heatEngines.carnotLimit'), simulated: `${(currentMetrics.value.carnotLimit * 100).toFixed(1)}%` },
  { name: t('heatEngines.power'), simulated: `${currentMetrics.value.power.toFixed(1)} W` },
]);

const reportVariablesList = computed(() => [
  { name: t('heatEngines.cycleType'), symbol: 'Type', value: cycleTypeKeys[uiParams.cycleTypeIndex], unit: '' },
  { name: t('heatEngines.th'), symbol: 'Th', value: uiParams.th, unit: 'K' },
  { name: t('heatEngines.tc'), symbol: 'Tc', value: uiParams.tc, unit: 'K' },
  { name: t('heatEngines.compressionRatio'), symbol: 'r', value: uiParams.compressionRatio, unit: '' },
  { name: t('heatEngines.rpm'), symbol: 'RPM', value: uiParams.rpm, unit: 'RPM' },
]);

let accumulator: PhysicsAccumulator | null = null;
let sampleTimer = 0;
let simTime = 0;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.02,
    onPhysicsStep: (dt: number) => {
      const omega = (2 * Math.PI * (uiParams.rpm / 60)) * speed.value;
      currentPhase.value = (currentPhase.value + omega * dt) % (2 * Math.PI);
      simTime += dt * speed.value;
      sampleTimer += dt * speed.value;

      if (sampleTimer >= 0.08) {
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
  const tSec = Number(simTime.toFixed(1));
  const curSt = currentInstantState.value;

  series.t.push(tSec);
  series.x.push(Number((curSt.volume * 1000).toFixed(2)));
  series.y.push(Number((curSt.pressure / 1000).toFixed(1)));
  series.vx.push(Number(curSt.temperature.toFixed(0)));
  series.vy.push(Number(currentMetrics.value.power.toFixed(1)));
  series.v.push(Number((currentMetrics.value.thermalEfficiencyIdeal * 100).toFixed(1)));

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
  currentPhase.value = 0;
  simTime = 0;
  sampleTimer = 0;
  series.t = [0];
  series.x = [currentInstantState.value.volume * 1000];
  series.y = [currentInstantState.value.pressure / 1000];
  series.vx = [currentInstantState.value.temperature];
  series.vy = [currentMetrics.value.power];
  series.v = [currentMetrics.value.thermalEfficiencyIdeal * 100];
}

function stepSimulation() {
  if (accumulator) {
    accumulator.pause();
  }
  isRunning.value = false;
  const omega = 2 * Math.PI * (uiParams.rpm / 60);
  currentPhase.value = (currentPhase.value + omega * 0.05) % (2 * Math.PI);
  simTime += 0.05;
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

function setCycleType(idx: number) {
  uiParams.cycleTypeIndex = idx;
  // Automatically adjust default compression ratio per cycle
  if (idx === 0) uiParams.compressionRatio = 4.0;
  else if (idx === 1) uiParams.compressionRatio = 8.5;
  else if (idx === 2) uiParams.compressionRatio = 16.5;
  else if (idx === 3) uiParams.compressionRatio = 3.0;
  onParamChange();
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
    const existing = await db.notes.where('experimentId').equals('physics/thermo/heat-engines').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, { content: userNotes.value, updatedAt: Date.now() });
    } else {
      await db.notes.add({
        experimentId: 'physics/thermo/heat-engines',
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
    const saved = await db.notes.where('experimentId').equals('physics/thermo/heat-engines').first();
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
.heat-engines-experiment {
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

.cycle-pill-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.cycle-pill-btn {
  display: flex;
  align-items: center;
  gap: 6px;
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

.cycle-pill-btn.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: var(--accent-physics, #3b82f6);
  color: var(--accent-physics, #3b82f6);
  font-weight: 700;
}

.cycle-icon {
  font-size: 14px;
}

.gas-pill-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gas-pill-btn {
  padding: 6px 10px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: right;
}

.gas-pill-btn.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: var(--accent-physics, #3b82f6);
  color: var(--accent-physics, #3b82f6);
  font-weight: 600;
}

.bottom-analysis-area {
  margin: 0 12px 12px 12px;
  border-radius: var(--radius-lg, 12px);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
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

.states-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

.state-card {
  padding: 12px;
  border-radius: 8px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.2s ease;
}

.state-card.current-vertex {
  border-color: var(--accent-physics, #3b82f6);
  box-shadow: 0 0 0 1px var(--accent-physics, #3b82f6);
}

.state-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 6px;
}

.state-title {
  font-size: 12.5px;
  font-weight: 700;
}

.state-metrics-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11.5px;
}

.state-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.s-label {
  color: var(--text-secondary);
}

.s-val {
  font-weight: 600;
}

.performance-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.perf-card {
  padding: 14px;
  border-radius: 8px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.perf-card.highlight-card {
  border-color: #10b981;
}

.perf-title {
  font-size: 11.5px;
  color: var(--text-secondary);
}

.perf-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
}

.perf-sub {
  font-size: 11px;
  color: var(--text-secondary);
}

.losses-breakdown-card {
  margin-top: 14px;
  padding: 12px;
  border-radius: 8px;
  background: var(--surface-input);
  border: 1px solid var(--border-subtle);
}

.losses-breakdown-card h4 {
  margin: 0 0 8px 0;
  font-size: 12.5px;
}

.losses-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}

.loss-row {
  display: flex;
  justify-content: space-between;
}

.text-danger {
  color: #ef4444;
}

.text-success {
  color: #10b981;
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
    flex-direction: column;
  }
}
</style>
