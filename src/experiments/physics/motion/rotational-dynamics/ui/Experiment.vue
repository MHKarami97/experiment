<template>
  <div class="rotation-experiment">
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
          <RotationCanvas
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

          <!-- Variable Group 1: Rotor Geometry -->
          <VariableGroup :title="$t('rotationalDynamics.rotorGeometry')">
            <div class="shape-selector-group">
              <label class="control-label">{{ $t('rotationalDynamics.rotorShape') }}</label>
              <div class="shape-pill-list">
                <button
                  v-for="(shapeName, idx) in shapeLabels"
                  :key="idx"
                  type="button"
                  class="shape-pill-btn"
                  :class="{ active: uiParams.rotorShapeIndex === idx }"
                  @click="setShapeIndex(idx)"
                >
                  {{ shapeName }}
                </button>
              </div>
            </div>

            <UnitSlider
              id="rotorMass"
              v-model="uiParams.rotorMass"
              :label="$t('rotationalDynamics.rotorMass')"
              unit="kg"
              :min="0.5"
              :max="10.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="rotorRadius"
              v-model="uiParams.rotorRadius"
              :label="$t('rotationalDynamics.rotorRadius')"
              unit="m"
              :min="0.1"
              :max="0.8"
              :step="0.02"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Variable Group 2: Driving Mechanics & Friction -->
          <VariableGroup :title="$t('rotationalDynamics.controlsTitle')">
            <UnitSlider
              id="hangingMass"
              v-model="uiParams.hangingMass"
              :label="$t('rotationalDynamics.hangingMass')"
              unit="kg"
              :min="0.0"
              :max="3.0"
              :step="0.05"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="spindleRadius"
              v-model="uiParams.spindleRadius"
              :label="$t('rotationalDynamics.spindleRadius')"
              unit="cm"
              :min="1.0"
              :max="12.0"
              :step="0.5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="mode === 'real'"
              id="bearingFriction"
              v-model="uiParams.bearingFriction"
              :label="$t('rotationalDynamics.bearingFriction')"
              unit="N·m"
              :min="0.0"
              :max="0.3"
              :step="0.01"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slot Save/Load Persistence -->
          <SlotManager
            experiment-id="physics/motion/rotational-dynamics"
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

      <VariableGroup :title="$t('rotationalDynamics.rotorGeometry')">
        <div class="shape-selector-group">
          <label class="control-label">{{ $t('rotationalDynamics.rotorShape') }}</label>
          <div class="shape-pill-list">
            <button
              v-for="(shapeName, idx) in shapeLabels"
              :key="idx"
              type="button"
              class="shape-pill-btn"
              :class="{ active: uiParams.rotorShapeIndex === idx }"
              @click="setShapeIndex(idx)"
            >
              {{ shapeName }}
            </button>
          </div>
        </div>

        <UnitSlider
          id="rotorMass-mobile"
          v-model="uiParams.rotorMass"
          :label="$t('rotationalDynamics.rotorMass')"
          unit="kg"
          :min="0.5"
          :max="10.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="rotorRadius-mobile"
          v-model="uiParams.rotorRadius"
          :label="$t('rotationalDynamics.rotorRadius')"
          unit="m"
          :min="0.1"
          :max="0.8"
          :step="0.02"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('rotationalDynamics.controlsTitle')">
        <UnitSlider
          id="hangingMass-mobile"
          v-model="uiParams.hangingMass"
          :label="$t('rotationalDynamics.hangingMass')"
          unit="kg"
          :min="0.0"
          :max="3.0"
          :step="0.05"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="spindleRadius-mobile"
          v-model="uiParams.spindleRadius"
          :label="$t('rotationalDynamics.spindleRadius')"
          unit="cm"
          :min="1.0"
          :max="12.0"
          :step="0.5"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          v-if="mode === 'real'"
          id="bearingFriction-mobile"
          v-model="uiParams.bearingFriction"
          :label="$t('rotationalDynamics.bearingFriction')"
          unit="N·m"
          :min="0.0"
          :max="0.3"
          :step="0.01"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/motion/rotational-dynamics"
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

        <!-- Tab 3: Rotational Theory & Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel">
          <FormulaPanel
            :title="$t('rotationalDynamics.tabTheory')"
            :formulas="formulaItems"
          />
          <div class="theory-prose">
            <p>{{ $t('rotationalDynamics.theoryContent') }}</p>
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
        :title="$t('experiments.rotationalDynamics.title')"
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
  createRotationModel,
  stepRotationModel,
  computeAnalyticalRotation,
  computeMomentOfInertia,
  type RotationParams,
  type RotationState,
  type RotorShape
} from '../model/rotation';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { rotationalDynamicsConfig } from '../config';

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
import RotationCanvas from '../view/RotationCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();
const store = useAppStore();
const canvasViewRef = ref<InstanceType<typeof RotationCanvas> | null>(null);

const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('heavyDisk');
const userNotes = ref<string>('');

const G_CONST = 9.80665;
const SHAPE_KEYS: RotorShape[] = ['disk', 'hoop', 'sphere', 'rod'];

interface UIParams extends Record<string, number> {
  rotorShapeIndex: number;
  rotorMass: number;
  rotorRadius: number;
  hangingMass: number;
  spindleRadius: number;
  bearingFriction: number;
}

const uiParams = reactive<UIParams>({
  rotorShapeIndex: 0,
  rotorMass: 2.0,
  rotorRadius: 0.3,
  hangingMass: 0.4,
  spindleRadius: 4.0, // cm
  bearingFriction: 0.04,
});

const shapeLabels = computed(() => [
  t('rotationalDynamics.shapeDisk'),
  t('rotationalDynamics.shapeHoop'),
  t('rotationalDynamics.shapeSphere'),
  t('rotationalDynamics.shapeRod'),
]);

function setShapeIndex(idx: number) {
  uiParams.rotorShapeIndex = idx;
  resetSimulation();
}

const internalParams = computed<RotationParams>(() => {
  const shape = SHAPE_KEYS[Math.max(0, Math.min(3, Math.round(uiParams.rotorShapeIndex)))];
  return {
    rotorShape: shape,
    rotorMass: uiParams.rotorMass,
    rotorRadius: uiParams.rotorRadius,
    hangingMass: uiParams.hangingMass,
    spindleRadius: uiParams.spindleRadius / 100, // cm -> meters
    gConst: G_CONST,
    bearingFriction: mode.value === 'real' ? uiParams.bearingFriction : 0,
    viscousDamping: mode.value === 'real' ? 0.005 : 0,
    isRealMode: mode.value === 'real',
  };
});

let state = createRotationModel(internalParams.value);
const currentState = ref<RotationState>(state);

const series = reactive<DataSeries>({
  t: [0],
  x: [state.theta],
  y: [state.hangingPosition],
  vx: [state.omega],
  vy: [state.alpha],
  v: [state.rotationalKineticEnergy],
});

const comparisonRuns = ref<ComparisonRun[]>([]);
let accumulator: PhysicsAccumulator | null = null;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.01,
    onPhysicsStep: (dt: number) => {
      const nextState = stepRotationModel(currentState.value, internalParams.value, dt * speed.value);
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
      series.x.push(nextState.theta);
      series.y.push(nextState.hangingPosition);
      series.vx.push(nextState.omega);
      series.vy.push(nextState.alpha);
      series.v.push(nextState.rotationalKineticEnergy);
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
  currentState.value = stepRotationModel(currentState.value, internalParams.value, 0.01);
}

function resetSimulation() {
  pauseSimulation();
  currentState.value = createRotationModel(internalParams.value);

  series.t = [0];
  series.x = [currentState.value.theta];
  series.y = [currentState.value.hangingPosition];
  series.vx = [currentState.value.omega];
  series.vy = [currentState.value.alpha];
  series.v = [currentState.value.rotationalKineticEnergy];
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
  return (rotationalDynamicsConfig.presets || []).map((p: ExperimentPresetDef) => ({
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
  { id: 'theory', label: t('rotationalDynamics.tabTheory') },
  { id: 'notes', label: t('common.notes') },
  { id: 'guided', label: t('common.guided') },
]);

const formulaItems = computed<FormulaItem[]>(() => {
  const I = computeMomentOfInertia(
    internalParams.value.rotorShape,
    internalParams.value.rotorMass,
    internalParams.value.rotorRadius
  );
  const analytical = computeAnalyticalRotation(internalParams.value);

  return [
    {
      title: t('rotationalDynamics.formula_inertia'),
      latex: `I = c \\cdot M R^2`,
      explanation: t('rotationalDynamics.inertiaExpl'),
      liveValue: `I = ${I.toFixed(4)} \\text{ kg}\\cdot\\text{m}^2`,
    },
    {
      title: t('rotationalDynamics.formula_torque'),
      latex: `\\tau_{\\text{net}} = I \\alpha`,
      explanation: t('rotationalDynamics.torqueExpl'),
      liveValue: `\\alpha = ${analytical.angularAcc.toFixed(2)} \\text{ rad/s}^2`,
    },
    {
      title: t('rotationalDynamics.formula_linearAcc'),
      latex: `a_{\\text{lin}} = \\frac{m g}{m + I/r^2}`,
      explanation: t('rotationalDynamics.linearAccExpl'),
      liveValue: `a_{\\text{lin}} = ${analytical.linearAcc.toFixed(2)} \\text{ m/s}^2`,
    },
    {
      title: t('rotationalDynamics.formula_energy'),
      latex: `K_{\\text{rot}} = \\frac{1}{2} I \\omega^2`,
      explanation: t('rotationalDynamics.energyExpl'),
      liveValue: `K_{\\text{rot}} = ${currentState.value.rotationalKineticEnergy.toFixed(2)} \\text{ J}`,
    },
  ];
});

const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step-1',
    title: t('rotationalDynamics.preset_heavyDisk'),
    instruction: 'Select the Heavy Solid Disk preset, run the experiment, and note the time required for the mass to reach the bench.',
    hint: 'A solid disk has moment of inertia I = 0.5 M R^2.',
  },
  {
    id: 'step-2',
    title: t('rotationalDynamics.preset_hollowHoop'),
    instruction: 'Now select the Hollow Hoop with identical mass and radius. Notice how much slower it accelerates.',
    hint: 'Since all mass is located at the rim, I = M R^2 is twice as large as the disk, resulting in lower angular acceleration.',
  },
  {
    id: 'step-3',
    title: 'Bearing Friction & Deceleration',
    instruction: 'Switch to Real mode and observe the gradual deceleration and stop after the weight hits the floor.',
    hint: 'In Real mode, mechanical bearing friction torque exerts negative work, converting rotational kinetic energy into heat.',
  },
]);

const calculatedResults = computed(() => ({
  momentOfInertia: currentState.value.momentOfInertia,
  angularAcc: currentState.value.alpha,
  angularVelocity: currentState.value.omega,
  rotationalKE: currentState.value.rotationalKineticEnergy,
  stringTension: currentState.value.stringTension,
}));

const reportResultsRows = computed(() => [
  {
    name: t('rotationalDynamics.momentOfInertia'),
    simulated: `${currentState.value.momentOfInertia.toFixed(4)} kg·m²`,
    theoretical: `${currentState.value.momentOfInertia.toFixed(4)} kg·m²`,
  },
  {
    name: t('rotationalDynamics.angularAcc'),
    simulated: `${currentState.value.alpha.toFixed(2)} rad/s²`,
    theoretical: `${currentState.value.alpha.toFixed(2)} rad/s²`,
  },
  {
    name: t('rotationalDynamics.angularVelocity'),
    simulated: `${currentState.value.omega.toFixed(2)} rad/s`,
  },
  {
    name: t('rotationalDynamics.rotationalKE'),
    simulated: `${currentState.value.rotationalKineticEnergy.toFixed(2)} J`,
  },
  {
    name: t('rotationalDynamics.tension'),
    simulated: `${currentState.value.stringTension.toFixed(2)} N`,
  },
]);

const reportVariablesList = computed(() => [
  { name: t('rotationalDynamics.rotorShape'), symbol: 'Shape', value: shapeLabels.value[uiParams.rotorShapeIndex] || 'Disk', unit: '' },
  { name: t('rotationalDynamics.rotorMass'), symbol: 'M', value: uiParams.rotorMass, unit: 'kg' },
  { name: t('rotationalDynamics.rotorRadius'), symbol: 'R', value: uiParams.rotorRadius, unit: 'm' },
  { name: t('rotationalDynamics.hangingMass'), symbol: 'm', value: uiParams.hangingMass, unit: 'kg' },
  { name: t('rotationalDynamics.spindleRadius'), symbol: 'r', value: uiParams.spindleRadius, unit: 'cm' },
]);

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/motion/rotational-dynamics').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/motion/rotational-dynamics',
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
    const existing = await db.notes.where('experimentId').equals('physics/motion/rotational-dynamics').first();
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
.rotation-experiment {
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
  background-color: var(--bg-scene, #0f172a);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.control-sidebar {
  width: 320px;
  flex-shrink: 0;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg, 12px);
  padding: var(--space-4, 16px);
  box-shadow: var(--shadow-sm);
}

.sidebar-header h3 {
  margin: 0 0 var(--space-3, 12px) 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.sidebar-scroll {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.shape-selector-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.control-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.shape-pill-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.shape-pill-btn {
  padding: 6px 8px;
  border: 1px solid var(--border-subtle);
  background: var(--surface-input);
  border-radius: var(--radius-md, 8px);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shape-pill-btn:hover {
  background: var(--surface-hover);
  border-color: #38bdf8;
  color: var(--text-primary);
}

.shape-pill-btn.active {
  background: #0284c7;
  border-color: #0284c7;
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
  transition: all 0.15s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--surface-active);
}

.tab-btn.active {
  color: var(--color-physics, #0284c7);
  background: var(--surface-card);
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
  background: var(--surface-hover);
  border-radius: var(--radius-md, 8px);
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-secondary);
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
  color: var(--text-primary);
}

.btn-save-note {
  padding: 6px 14px;
  background: var(--color-physics, #0284c7);
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
  border: 1px solid var(--border-subtle);
  background: var(--surface-input);
  color: var(--text-primary);
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
