<template>
  <div class="work-power-experiment">
    <!-- Top Interactive Toolbar -->
    <Toolbar
      :is-running="isRunning"
      :speed="speed"
      :mode="mode"
      :show-ruler="showRuler"
      :show-stopwatch="showStopwatch"
      @toggle-play="togglePlay"
      @step="stepSimulation"
      @reset="resetSimulation"
      @set-speed="setSpeed"
      @set-mode="setMode"
      @toggle-ruler="showRuler = !showRuler"
      @toggle-stopwatch="showStopwatch = !showStopwatch"
      @open-export="showExportModal = true"
    />

    <!-- Main Workspace -->
    <div class="experiment-workspace">
      <!-- Simulation Stage -->
      <div class="scene-container">
        <div class="canvas-mount">
          <WorkPowerCanvas
            ref="canvasViewRef"
            :state="currentState"
            :params="internalParams"
            :mode="mode"
          />

          <!-- Floating Measurement Tools -->
          <RulerWidget v-if="showRuler" :visible="showRuler" @close="showRuler = false" />
          <StopwatchWidget v-if="showStopwatch" :visible="showStopwatch" @close="showStopwatch = false" />
        </div>
      </div>

      <!-- Desktop Sidebar Controls -->
      <aside class="control-sidebar desktop-only">
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

          <!-- Variable Group 1: Applied Force & Angle -->
          <VariableGroup :title="$t('workPower.forceConfiguration')">
            <div class="profile-selector-group">
              <label class="control-label">{{ $t('workPower.forceProfile') }}</label>
              <div class="profile-pill-list">
                <button
                  v-for="(profName, idx) in profileLabels"
                  :key="idx"
                  type="button"
                  class="profile-pill-btn"
                  :class="{ active: uiParams.forceProfileIndex === idx }"
                  @click="setProfileIndex(idx)"
                >
                  {{ profName }}
                </button>
              </div>
            </div>

            <UnitSlider
              id="appliedForceMax"
              v-model="uiParams.appliedForceMax"
              :label="$t('workPower.appliedForce')"
              unit="N"
              :min="10"
              :max="300"
              :step="5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="forceAngle"
              v-model="uiParams.forceAngle"
              :label="$t('workPower.forceAngle')"
              unit="°"
              :min="0"
              :max="60"
              :step="5"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Variable Group 2: Payload & Friction -->
          <VariableGroup :title="$t('workPower.controlsTitle')">
            <UnitSlider
              id="payloadMass"
              v-model="uiParams.payloadMass"
              :label="$t('workPower.payloadMass')"
              unit="kg"
              :min="5"
              :max="100"
              :step="1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="mode === 'real'"
              id="surfaceFrictionMu"
              v-model="uiParams.surfaceFrictionMu"
              :label="$t('workPower.surfaceFriction')"
              unit=""
              :min="0.0"
              :max="0.4"
              :step="0.02"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="mode === 'real'"
              id="motorEfficiency"
              v-model="uiParams.motorEfficiency"
              :label="$t('workPower.motorEfficiency')"
              unit="%"
              :min="50"
              :max="100"
              :step="5"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slot Save/Load Persistence -->
          <SlotManager
            experiment-id="physics/energy/work-power"
            :current-params="uiParams"
            :current-mode="mode"
            @load="onLoadSlot"
          />
        </div>
      </aside>
    </div>

    <!-- Mobile BottomSheet Controls -->
    <BottomSheet class="mobile-only" :title="$t('common.controls')">
      <PresetPicker
        :presets="presetOptions"
        :current-preset="currentPresetId"
        @select="applyPreset"
      />

      <VariableGroup :title="$t('workPower.forceConfiguration')">
        <div class="profile-selector-group">
          <label class="control-label">{{ $t('workPower.forceProfile') }}</label>
          <div class="profile-pill-list">
            <button
              v-for="(profName, idx) in profileLabels"
              :key="idx"
              type="button"
              class="profile-pill-btn"
              :class="{ active: uiParams.forceProfileIndex === idx }"
              @click="setProfileIndex(idx)"
            >
              {{ profName }}
            </button>
          </div>
        </div>

        <UnitSlider
          id="appliedForceMax-mobile"
          v-model="uiParams.appliedForceMax"
          :label="$t('workPower.appliedForce')"
          unit="N"
          :min="10"
          :max="300"
          :step="5"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="forceAngle-mobile"
          v-model="uiParams.forceAngle"
          :label="$t('workPower.forceAngle')"
          unit="°"
          :min="0"
          :max="60"
          :step="5"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('workPower.controlsTitle')">
        <UnitSlider
          id="payloadMass-mobile"
          v-model="uiParams.payloadMass"
          :label="$t('workPower.payloadMass')"
          unit="kg"
          :min="5"
          :max="100"
          :step="1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          v-if="mode === 'real'"
          id="surfaceFrictionMu-mobile"
          v-model="uiParams.surfaceFrictionMu"
          :label="$t('workPower.surfaceFriction')"
          unit=""
          :min="0.0"
          :max="0.4"
          :step="0.02"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          v-if="mode === 'real'"
          id="motorEfficiency-mobile"
          v-model="uiParams.motorEfficiency"
          :label="$t('workPower.motorEfficiency')"
          unit="%"
          :min="50"
          :max="100"
          :step="5"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/energy/work-power"
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

        <!-- Tab 3: Work-Energy Theory & Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel">
          <FormulaPanel
            :title="$t('workPower.tabTheory')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('workPower.theoryContent') }}</p>
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
        :title="$t('experiments.workPower.title')"
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
  createWorkPowerModel,
  stepWorkPowerModel,
  type WorkPowerParams,
  type WorkPowerState,
  type ForceProfile
} from '../model/workPower';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { workPowerConfig } from '../config';

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
import WorkPowerCanvas from '../view/WorkPowerCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();
const canvasViewRef = ref<InstanceType<typeof WorkPowerCanvas> | null>(null);

const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('horizontalPull');
const userNotes = ref<string>('');

const PROFILES: ForceProfile[] = ['constant', 'linear-ramp', 'spring', 'pulsed'];

interface UIParams extends Record<string, number> {
  forceProfileIndex: number;
  appliedForceMax: number;
  forceAngle: number;
  payloadMass: number;
  surfaceFrictionMu: number;
  motorEfficiency: number;
}

const uiParams = reactive<UIParams>({
  forceProfileIndex: 0,
  appliedForceMax: 100,
  forceAngle: 20,
  payloadMass: 25,
  surfaceFrictionMu: 0.12,
  motorEfficiency: 85,
});

const profileLabels = computed(() => [
  t('workPower.profileConstant'),
  t('workPower.profileRamp'),
  t('workPower.profileSpring'),
  t('workPower.profilePulsed'),
]);

function setProfileIndex(idx: number) {
  uiParams.forceProfileIndex = idx;
  resetSimulation();
}

const internalParams = computed<WorkPowerParams>(() => {
  const profile = PROFILES[Math.max(0, Math.min(3, Math.round(uiParams.forceProfileIndex)))];
  return {
    forceProfile: profile,
    appliedForceMax: uiParams.appliedForceMax,
    forceAngle: uiParams.forceAngle,
    payloadMass: uiParams.payloadMass,
    surfaceFrictionMu: mode.value === 'real' ? uiParams.surfaceFrictionMu : 0,
    springConstant: 60,
    gConst: 9.80665,
    motorEfficiency: uiParams.motorEfficiency / 100,
    isRealMode: mode.value === 'real',
  };
});

let state = createWorkPowerModel(internalParams.value);
const currentState = ref<WorkPowerState>(state);

const series = reactive<DataSeries>({
  t: [0],
  x: [state.x],
  y: [state.v],
  vx: [state.workNet],
  vy: [state.kineticEnergy],
  v: [state.instantaneousPower],
});

const comparisonRuns = ref<ComparisonRun[]>([]);
let accumulator: PhysicsAccumulator | null = null;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.01,
    onPhysicsStep: (dt: number) => {
      const nextState = stepWorkPowerModel(currentState.value, internalParams.value, dt * speed.value);
      currentState.value = nextState;

      if (series.t.length > 500) {
        series.t.shift();
        series.x.shift();
        series.y.shift();
        series.vx.shift();
        series.vy.shift();
        series.v.shift();
      }

      series.t.push(nextState.t);
      series.x.push(nextState.x);
      series.y.push(nextState.v);
      series.vx.push(nextState.workNet);
      series.vy.push(nextState.kineticEnergy);
      series.v.push(nextState.instantaneousPower);
    },
    onRenderStep: () => {},
  });
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
  currentState.value = stepWorkPowerModel(currentState.value, internalParams.value, 0.01);
}

function resetSimulation() {
  pauseSimulation();
  currentState.value = createWorkPowerModel(internalParams.value);

  series.t = [0];
  series.x = [currentState.value.x];
  series.y = [currentState.value.v];
  series.vx = [currentState.value.workNet];
  series.vy = [currentState.value.kineticEnergy];
  series.v = [currentState.value.instantaneousPower];
}

function setSpeed(newSpeed: number) {
  speed.value = newSpeed;
}

function setMode(newMode: 'ideal' | 'real') {
  mode.value = newMode;
  resetSimulation();
}

function onParamChange() {
  resetSimulation();
}

const presetOptions = computed<PresetOption[]>(() => {
  return (workPowerConfig.presets || []).map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }));
});

function applyPreset(preset: PresetOption) {
  currentPresetId.value = preset.id;
  Object.assign(uiParams, preset.params);
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

const bottomTabs = computed(() => [
  { id: 'graph', label: t('common.graph') },
  { id: 'table', label: t('common.table') },
  { id: 'theory', label: t('workPower.tabTheory') },
  { id: 'notes', label: t('common.notes') },
  { id: 'guided', label: t('common.guided') },
]);

const formulaItems = computed<FormulaItem[]>(() => [
  {
    title: t('workPower.formula_workEnergy'),
    latex: `W_{\\text{net}} = \\Delta K = \\frac{1}{2} m v^2`,
    explanation: t('workPower.workEnergyExpl'),
    liveValue: `W_{\\text{net}} = ${currentState.value.workNet.toFixed(1)} \\text{ J}, \\; K = ${currentState.value.kineticEnergy.toFixed(1)} \\text{ J}`,
  },
  {
    title: t('workPower.formula_workIntegral'),
    latex: `W = \\int F(x) \\cos\\theta \\, dx`,
    explanation: t('workPower.workIntegralExpl'),
    liveValue: `W_F = ${currentState.value.workApplied.toFixed(1)} \\text{ J}`,
  },
  {
    title: t('workPower.formula_instantPower'),
    latex: `P(t) = F v \\cos\\theta`,
    explanation: t('workPower.instantPowerExpl'),
    liveValue: `P = ${currentState.value.instantaneousPower.toFixed(1)} \\text{ W}`,
  },
  {
    title: t('workPower.formula_efficiency'),
    latex: `\\eta = \\frac{W_{\\text{useful}}}{E_{\\text{input}}}`,
    explanation: t('workPower.efficiencyExpl'),
    liveValue: `\\eta = ${(internalParams.value.motorEfficiency * 100).toFixed(0)}\\%`,
  },
]);

const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step-1',
    title: t('workPower.preset_horizontalPull'),
    instruction: 'Run the constant horizontal pull experiment. Compare the Net Work value with the Kinetic Energy value in the top HUD.',
    hint: 'Notice that W_net and K are identical at every moment, proving the Work-Energy Theorem W_net = Delta K.',
  },
  {
    id: 'step-2',
    title: t('workPower.preset_angledTow'),
    instruction: 'Select Angled Tow (30 deg). Observe how pulling upward reduces the normal contact force and hence lowers the friction force in Real mode.',
    hint: 'Since N = mg - F*sin(theta), an upward angle relieves surface friction pressure.',
  },
  {
    id: 'step-3',
    title: 'Work as Area under F(x)',
    instruction: 'Select the Variable Ramp Force profile and look at the mini F(x) graph in the top-right corner.',
    hint: 'As force increases linearly with displacement, the shaded triangular area accurately computes W = integral(F dx).',
  },
]);

const calculatedResults = computed(() => ({
  displacement: currentState.value.x,
  speed: currentState.value.v,
  workNet: currentState.value.workNet,
  workApplied: currentState.value.workApplied,
  workFriction: currentState.value.workFriction,
  kineticEnergy: currentState.value.kineticEnergy,
  instantPower: currentState.value.instantaneousPower,
}));

const reportResultsRows = computed(() => [
  {
    name: t('workPower.displacement'),
    simulated: `${currentState.value.x.toFixed(2)} m`,
  },
  {
    name: t('workPower.speed'),
    simulated: `${currentState.value.v.toFixed(2)} m/s`,
  },
  {
    name: t('workPower.workNet'),
    simulated: `${currentState.value.workNet.toFixed(1)} J`,
    theoretical: `${currentState.value.kineticEnergy.toFixed(1)} J`,
  },
  {
    name: t('workPower.workApplied'),
    simulated: `${currentState.value.workApplied.toFixed(1)} J`,
  },
  {
    name: t('workPower.workFriction'),
    simulated: `${currentState.value.workFriction.toFixed(1)} J`,
  },
  {
    name: t('workPower.instantPower'),
    simulated: `${currentState.value.instantaneousPower.toFixed(1)} W`,
  },
]);

const reportVariablesList = computed(() => [
  { name: t('workPower.forceProfile'), symbol: 'Profile', value: profileLabels.value[uiParams.forceProfileIndex] || 'Constant', unit: '' },
  { name: t('workPower.appliedForce'), symbol: 'F', value: uiParams.appliedForceMax, unit: 'N' },
  { name: t('workPower.forceAngle'), symbol: 'θ', value: uiParams.forceAngle, unit: '°' },
  { name: t('workPower.payloadMass'), symbol: 'm', value: uiParams.payloadMass, unit: 'kg' },
  { name: t('workPower.surfaceFriction'), symbol: 'μ', value: uiParams.surfaceFrictionMu, unit: '' },
]);

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/energy/work-power').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/energy/work-power',
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    }
    store.showToast(t('common.save'), 'success');
  } catch (e) {
    console.error('Failed to save notes:', e);
  }
}

async function loadNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/energy/work-power').first();
    if (existing) {
      userNotes.value = existing.content;
    }
  } catch (e) {
    console.error('Failed to load notes:', e);
  }
}

onMounted(() => {
  initLoop();
  loadNotes();
});

onBeforeUnmount(() => {
  if (accumulator) {
    accumulator.destroy();
    accumulator = null;
  }
});
</script>

<style scoped>
.work-power-experiment {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
  width: 100%;
}

.experiment-workspace {
  display: flex;
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
  background-color: var(--color-surface, #0f172a);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

.control-sidebar {
  width: 320px;
  flex-shrink: 0;
  background: var(--color-surface, rgba(255, 255, 255, 0.7));
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
  border-radius: var(--radius-lg, 12px);
  padding: var(--space-4, 16px);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
}

.sidebar-header h3 {
  margin: 0 0 var(--space-3, 12px) 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text, #1e293b);
}

.sidebar-scroll {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.profile-selector-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.control-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text, #334155);
}

.profile-pill-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.profile-pill-btn {
  padding: 6px 10px;
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.15));
  background: rgba(0, 0, 0, 0.03);
  border-radius: var(--radius-md, 8px);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  color: var(--color-text, #334155);
  transition: all 0.15s ease;
  text-align: start;
}

.profile-pill-btn:hover {
  background: rgba(2, 132, 199, 0.08);
  border-color: #38bdf8;
}

.profile-pill-btn.active {
  background: #0284c7;
  border-color: #0284c7;
  color: #ffffff;
  font-weight: 600;
}

.bottom-tabs-section {
  width: 100%;
  background: var(--color-surface, rgba(255, 255, 255, 0.7));
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
}

.tabs-nav {
  display: flex;
  gap: var(--space-2, 8px);
  padding: var(--space-2, 8px) var(--space-4, 16px);
  border-bottom: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
  background: rgba(0, 0, 0, 0.02);
  overflow-x: auto;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary, #64748b);
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--color-text, #1e293b);
  background: rgba(0, 0, 0, 0.04);
}

.tab-btn.active {
  color: #0284c7;
  background: rgba(2, 132, 199, 0.1);
  font-weight: 600;
}

.tab-content-area {
  padding: var(--space-4, 16px);
  min-height: 280px;
}

.tab-panel {
  width: 100%;
}

.theory-prose {
  margin-top: var(--space-4, 16px);
  padding: var(--space-4, 16px);
  background: rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-md, 8px);
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-line;
}

.notes-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notes-header h4 {
  margin: 0;
  font-size: 1rem;
}

.btn-save-note {
  padding: 6px 14px;
  background: #0284c7;
  color: #ffffff;
  border: none;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  font-weight: 500;
}

.notes-textarea {
  width: 100%;
  min-height: 160px;
  padding: 12px;
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
  background: var(--color-bg, #ffffff);
  color: var(--color-text, #0f172a);
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
}

@media (max-width: 1023px) {
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
