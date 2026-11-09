<template>
  <div class="heat-transfer-experiment">
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
          <HeatTransferCanvas
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

          <!-- Mode Selector -->
          <div class="profile-selector-group">
            <label class="control-label">{{ $t('heatTransfer.transferMode') }}</label>
            <div class="profile-pill-list">
              <button
                v-for="(modeItem, idx) in modeOptions"
                :key="idx"
                type="button"
                class="profile-pill-btn"
                :class="{ active: uiParams.modeIndex === idx }"
                @click="uiParams.modeIndex = idx; onParamChange()"
              >
                {{ modeItem.label }}
              </button>
            </div>
          </div>

          <!-- Material Selector (Relevant in Conduction / Combined) -->
          <div v-if="uiParams.modeIndex === 0 || uiParams.modeIndex === 3" class="profile-selector-group">
            <label class="control-label">{{ $t('heatTransfer.material') }}</label>
            <div class="profile-pill-list">
              <button
                v-for="(matName, idx) in materialOptions"
                :key="idx"
                type="button"
                class="profile-pill-btn"
                :class="{ active: uiParams.materialIndex === idx }"
                @click="uiParams.materialIndex = idx; onParamChange()"
              >
                {{ matName }}
              </button>
            </div>
          </div>

          <!-- Temperatures -->
          <VariableGroup :title="$t('heatTransfer.hotTemp')">
            <UnitSlider
              id="hotTemp"
              v-model="uiParams.hotTempC"
              :label="$t('heatTransfer.hotTemp')"
              unit="°C"
              :min="40"
              :max="850"
              :step="10"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="coldTemp"
              v-model="uiParams.coldTempC"
              :label="$t('heatTransfer.coldTemp')"
              unit="°C"
              :min="0"
              :max="40"
              :step="1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Specific Physical Properties based on Mode -->
          <VariableGroup :title="$t('common.variables')">
            <UnitSlider
              v-if="uiParams.modeIndex === 0 || uiParams.modeIndex === 3"
              id="rodLength"
              v-model="uiParams.rodLength"
              :label="$t('heatTransfer.rodLength')"
              unit="cm"
              :min="10"
              :max="100"
              :step="5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="uiParams.modeIndex === 1 || uiParams.modeIndex === 3"
              id="convectionCoeff"
              v-model="uiParams.convectionCoeff"
              :label="$t('heatTransfer.convectionCoeff')"
              unit="W/m²·K"
              :min="5"
              :max="120"
              :step="5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="uiParams.modeIndex === 2 || uiParams.modeIndex === 3"
              id="emissivity"
              v-model="uiParams.emissivity"
              :label="$t('heatTransfer.emissivity')"
              unit=""
              :min="0.05"
              :max="1.0"
              :step="0.05"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slot Persistence -->
          <div class="slot-manager-section">
            <SlotManager
              experiment-id="physics/thermo/heat-transfer"
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
          <label class="control-label">{{ $t('heatTransfer.transferMode') }}</label>
          <div class="profile-pill-list">
            <button
              v-for="(modeItem, idx) in modeOptions"
              :key="idx"
              type="button"
              class="profile-pill-btn"
              :class="{ active: uiParams.modeIndex === idx }"
              @click="uiParams.modeIndex = idx; onParamChange()"
            >
              {{ modeItem.label }}
            </button>
          </div>
        </div>

        <div v-if="uiParams.modeIndex === 0 || uiParams.modeIndex === 3" class="profile-selector-group">
          <label class="control-label">{{ $t('heatTransfer.material') }}</label>
          <div class="profile-pill-list">
            <button
              v-for="(matName, idx) in materialOptions"
              :key="idx"
              type="button"
              class="profile-pill-btn"
              :class="{ active: uiParams.materialIndex === idx }"
              @click="uiParams.materialIndex = idx; onParamChange()"
            >
              {{ matName }}
            </button>
          </div>
        </div>

        <VariableGroup :title="$t('heatTransfer.hotTemp')">
          <UnitSlider
            id="mHotTemp"
            v-model="uiParams.hotTempC"
            :label="$t('heatTransfer.hotTemp')"
            unit="°C"
            :min="40"
            :max="850"
            :step="10"
            @update:model-value="onParamChange"
          />
          <UnitSlider
            id="mColdTemp"
            v-model="uiParams.coldTempC"
            :label="$t('heatTransfer.coldTemp')"
            unit="°C"
            :min="0"
            :max="40"
            :step="1"
            @update:model-value="onParamChange"
          />
        </VariableGroup>

        <VariableGroup :title="$t('common.variables')">
          <UnitSlider
            v-if="uiParams.modeIndex === 0 || uiParams.modeIndex === 3"
            id="mRodLength"
            v-model="uiParams.rodLength"
            :label="$t('heatTransfer.rodLength')"
            unit="cm"
            :min="10"
            :max="100"
            :step="5"
            @update:model-value="onParamChange"
          />
          <UnitSlider
            v-if="uiParams.modeIndex === 1 || uiParams.modeIndex === 3"
            id="mConvectionCoeff"
            v-model="uiParams.convectionCoeff"
            :label="$t('heatTransfer.convectionCoeff')"
            unit="W/m²·K"
            :min="5"
            :max="120"
            :step="5"
            @update:model-value="onParamChange"
          />
          <UnitSlider
            v-if="uiParams.modeIndex === 2 || uiParams.modeIndex === 3"
            id="mEmissivity"
            v-model="uiParams.emissivity"
            :label="$t('heatTransfer.emissivity')"
            unit=""
            :min="0.05"
            :max="1.0"
            :step="0.05"
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
          📈 {{ $t('heatTransfer.tabGraph') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'table' }"
          @click="activeTab = 'table'"
        >
          📋 {{ $t('heatTransfer.tabTable') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'theory' }"
          @click="activeTab = 'theory'"
        >
          📖 {{ $t('heatTransfer.tabTheory') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'notes' }"
          @click="activeTab = 'notes'"
        >
          📝 {{ $t('heatTransfer.tabNotes') }}
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'guided' }"
          @click="activeTab = 'guided'"
        >
          🎯 {{ $t('heatTransfer.tabGuided') }}
        </button>
      </nav>

      <!-- Active Tab Body -->
      <div class="tab-content-area">
        <!-- Tab 1: Live Graph -->
        <div v-show="activeTab === 'graph'" class="tab-panel graph-panel-wrapper">
          <div class="live-metrics-strip">
            <div class="metric-chip">
              <span class="m-label">{{ $t('heatTransfer.metricTotalRate') }}</span>
              <span class="m-value text-accent">{{ currentState.derived.totalHeatRate.toFixed(1) }} W</span>
            </div>
            <div class="metric-chip">
              <span class="m-label">{{ $t('heatTransfer.metricCondRate') }}</span>
              <span class="m-value text-cond">{{ currentState.derived.conduction.heatFluxRate.toFixed(1) }} W</span>
            </div>
            <div class="metric-chip">
              <span class="m-label">{{ $t('heatTransfer.metricConvRate') }}</span>
              <span class="m-value text-conv">{{ currentState.derived.convection.convectiveHeatRate.toFixed(1) }} W</span>
            </div>
            <div class="metric-chip">
              <span class="m-label">{{ $t('heatTransfer.metricRadRate') }}</span>
              <span class="m-value text-rad">{{ currentState.derived.radiation.radiativeHeatRate.toFixed(1) }} W</span>
            </div>
            <div class="metric-chip">
              <span class="m-label">{{ $t('heatTransfer.metricPeakWave') }}</span>
              <span class="m-value">{{ currentState.derived.radiation.peakWavelengthUm.toFixed(2) }} µm</span>
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
            :title="$t('heatTransfer.tabTheory')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('heatTransfer.theoryContent') }}</p>
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
        :title="$t('experiments.heatTransfer.title')"
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
  createHeatTransferModel,
  stepHeatTransferModel,
  type HeatTransferParams,
  type HeatTransferState,
  type TransferMode,
  type ConductionMaterial,
} from '../model/heat-transfer';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { heatTransferConfig } from '../config';

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
import HeatTransferCanvas from '../view/HeatTransferCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();

const canvasViewRef = ref<InstanceType<typeof HeatTransferCanvas> | null>(null);

// Simulation State
const isRunning = ref(true);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('copperConduction');
const userNotes = ref<string>('');

// UI Parameters
const uiParams = reactive<Record<string, number>>({
  modeIndex: 0, // 0: conduction, 1: convection, 2: radiation, 3: combined
  materialIndex: 0, // 0: copper, 1: aluminum, 2: iron, 3: glass, 4: wood
  hotTempC: 120,
  coldTempC: 20,
  rodLength: 40, // cm
  convectionCoeff: 25, // W/m²·K
  emissivity: 0.85,
});

const modeKeys: TransferMode[] = ['conduction', 'convection', 'radiation', 'combined'];
const materialKeys: ConductionMaterial[] = ['copper', 'aluminum', 'iron', 'glass', 'wood'];

const modeOptions = computed(() => [
  { label: t('heatTransfer.modeConduction'), mode: 'conduction' },
  { label: t('heatTransfer.modeConvection'), mode: 'convection' },
  { label: t('heatTransfer.modeRadiation'), mode: 'radiation' },
  { label: t('heatTransfer.modeCombined'), mode: 'combined' },
]);

const materialOptions = computed(() => [
  t('heatTransfer.matCopper'),
  t('heatTransfer.matAluminum'),
  t('heatTransfer.matIron'),
  t('heatTransfer.matGlass'),
  t('heatTransfer.matWood'),
]);

const presetOptions = computed<PresetOption[]>(() =>
  heatTransferConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }))
);

const internalParams = computed<HeatTransferParams>(() => ({
  transferMode: modeKeys[uiParams.modeIndex] || 'conduction',
  material: materialKeys[uiParams.materialIndex] || 'copper',
  hotTempC: uiParams.hotTempC,
  coldTempC: uiParams.coldTempC,
  crossSectionArea: 0.0015, // standard cross-section ~ 15 cm²
  rodLength: uiParams.rodLength / 100.0, // convert cm to m
  convectionCoeff: uiParams.convectionCoeff,
  emissivity: uiParams.emissivity,
  isRealMode: mode.value === 'real',
}));

const currentState = ref<HeatTransferState>(createHeatTransferModel(internalParams.value));

// Live Data Series for Graph and Table
const series = reactive<DataSeries>({
  t: [0],
  x: [0], // Q_cond (W)
  y: [0], // Q_total (W)
  vx: [0], // Q_conv (W)
  vy: [0], // Q_rad (W)
  v: [120], // T_hot (°C)
});

const comparisonRuns = ref<ComparisonRun[]>([]);

const formulaItems = computed<FormulaItem[]>(() =>
  heatTransferConfig.formulas.map((f) => ({
    title: t(f.titleKey),
    latex: f.latex,
    explanation: t(f.explanationKey),
  }))
);

const guidedSteps = computed<LabStep[]>(() => [
  { id: 'step1', title: t('heatTransfer.step1Title'), instruction: t('heatTransfer.step1Desc') },
  { id: 'step2', title: t('heatTransfer.step2Title'), instruction: t('heatTransfer.step2Desc') },
  { id: 'step3', title: t('heatTransfer.step3Title'), instruction: t('heatTransfer.step3Desc') },
  { id: 'step4', title: t('heatTransfer.step4Title'), instruction: t('heatTransfer.step4Desc') },
]);

// Results & Reports
const calculatedResults = computed<Record<string, number | string>>(() => ({
  'Total Heat Rate (W)': currentState.value.derived.totalHeatRate.toFixed(2),
  'Conduction Rate (W)': currentState.value.derived.conduction.heatFluxRate.toFixed(2),
  'Convection Rate (W)': currentState.value.derived.convection.convectiveHeatRate.toFixed(2),
  'Radiation Rate (W)': currentState.value.derived.radiation.radiativeHeatRate.toFixed(2),
  'Peak Emission Wavelength (µm)': currentState.value.derived.radiation.peakWavelengthUm.toFixed(2),
  'Dominant Transfer Mode': currentState.value.derived.dominantMode,
}));

const reportResultsRows = computed(() => [
  { name: t('heatTransfer.metricTotalRate'), simulated: `${currentState.value.derived.totalHeatRate.toFixed(2)} W` },
  { name: t('heatTransfer.metricCondRate'), simulated: `${currentState.value.derived.conduction.heatFluxRate.toFixed(2)} W` },
  { name: t('heatTransfer.metricConvRate'), simulated: `${currentState.value.derived.convection.convectiveHeatRate.toFixed(2)} W` },
  { name: t('heatTransfer.metricRadRate'), simulated: `${currentState.value.derived.radiation.radiativeHeatRate.toFixed(2)} W` },
  { name: t('heatTransfer.metricPeakWave'), simulated: `${currentState.value.derived.radiation.peakWavelengthUm.toFixed(2)} µm` },
]);

const reportVariablesList = computed(() => [
  { name: t('heatTransfer.transferMode'), symbol: 'Mode', value: modeKeys[uiParams.modeIndex], unit: '' },
  { name: t('heatTransfer.material'), symbol: 'Mat', value: materialKeys[uiParams.materialIndex], unit: '' },
  { name: t('heatTransfer.hotTemp'), symbol: 'T_H', value: uiParams.hotTempC, unit: '°C' },
  { name: t('heatTransfer.coldTemp'), symbol: 'T_C', value: uiParams.coldTempC, unit: '°C' },
  { name: t('heatTransfer.rodLength'), symbol: 'L', value: uiParams.rodLength, unit: 'cm' },
  { name: t('heatTransfer.convectionCoeff'), symbol: 'h', value: uiParams.convectionCoeff, unit: 'W/m²·K' },
  { name: t('heatTransfer.emissivity'), symbol: 'ε', value: uiParams.emissivity, unit: '' },
]);

let accumulator: PhysicsAccumulator | null = null;
let sampleTimer = 0;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.05,
    onPhysicsStep: (dt: number) => {
      currentState.value = stepHeatTransferModel(currentState.value, internalParams.value, dt * speed.value);
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
  accumulator.start();
}

function recordDataPoint() {
  const tSec = Number(currentState.value.t.toFixed(1));
  const d = currentState.value.derived;

  series.t.push(tSec);
  series.x.push(Number(d.conduction.heatFluxRate.toFixed(2)));
  series.y.push(Number(d.totalHeatRate.toFixed(2)));
  series.vx.push(Number(d.convection.convectiveHeatRate.toFixed(2)));
  series.vy.push(Number(d.radiation.radiativeHeatRate.toFixed(2)));
  series.v.push(uiParams.hotTempC);

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
  currentState.value = createHeatTransferModel(internalParams.value);
  series.t = [0];
  series.x = [0];
  series.y = [0];
  series.vx = [0];
  series.vy = [0];
  series.v = [uiParams.hotTempC];
  sampleTimer = 0;
  if (accumulator) {
    accumulator.resetAccumulator();
  }
}

function stepSimulation() {
  if (accumulator) {
    accumulator.stepOnce();
  } else {
    currentState.value = stepHeatTransferModel(currentState.value, internalParams.value, 0.05);
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
  currentState.value = createHeatTransferModel(internalParams.value);
}

function onParamChange() {
  currentState.value = createHeatTransferModel(internalParams.value);
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
    name: `${modeKeys[uiParams.modeIndex]} (${uiParams.hotTempC}°C)`,
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
    const existing = await db.notes.where('experimentId').equals('physics/thermo/heat-transfer').first();
    if (existing?.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/thermo/heat-transfer',
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
    const existing = await db.notes.where('experimentId').equals('physics/thermo/heat-transfer').first();
    if (existing) {
      userNotes.value = existing.content;
    }
  } catch (err) {
    console.warn('Failed to load notes:', err);
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
.heat-transfer-experiment {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--surface-bg);
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
  background: var(--surface-bg);
}

.control-sidebar {
  display: flex;
  flex-direction: column;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  gap: var(--space-sm);
  max-height: 700px;
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

.profile-pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.profile-pill-btn {
  flex: 1 1 calc(50% - var(--space-xs));
  min-height: 38px;
  padding: var(--space-xs) var(--space-sm);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.profile-pill-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.profile-pill-btn.active {
  background: var(--brand-primary);
  color: #ffffff;
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
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
  background: var(--surface-bg);
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

.text-cond {
  color: #ef4444;
}

.text-conv {
  color: #06b6d4;
}

.text-rad {
  color: #f59e0b;
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
  background: var(--surface-bg);
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
