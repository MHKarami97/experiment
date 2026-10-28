<template>
  <div class="kinematics-experiment">
    <!-- Top Toolbar -->
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
      <!-- Central Physical Scene -->
      <div class="scene-container">
        <PresetPicker
          :presets="presetOptions"
          :current-preset-id="currentPresetId"
          @select="applyPreset"
        />

        <div class="canvas-mount">
          <KinematicsCanvas
            ref="canvasViewRef"
            :params="params"
            :state="currentState"
            :trail-points="trailPoints"
            :mode="mode"
          />

          <!-- Overlaid Measurement Instruments -->
          <RulerWidget :visible="showRuler" @close="showRuler = false" />
          <StopwatchWidget :visible="showStopwatch" @close="showStopwatch = false" />
        </div>
      </div>

      <!-- Desktop Sidebar Controls -->
      <aside class="control-sidebar desktop-only">
        <div class="sidebar-header">
          <h3>🎛️ {{ $t('kinematics.controlsTitle') }}</h3>
        </div>

        <div class="sidebar-scroll">
          <VariableGroup :title="$t('kinematics.groupX')" icon="↔️">
            <UnitSlider
              id="x0"
              v-model="params.x0"
              :label="$t('kinematics.x0')"
              unit="m"
              :min="-50"
              :max="50"
              :step="1"
              :description="$t('kinematics.x0_desc')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="v0x"
              v-model="params.v0x"
              :label="$t('kinematics.v0x')"
              unit="m/s"
              :min="-50"
              :max="50"
              :step="0.5"
              :description="$t('kinematics.v0x_desc')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="ax"
              v-model="params.ax"
              :label="$t('kinematics.ax')"
              unit="m/s²"
              :min="-15"
              :max="15"
              :step="0.2"
              :description="$t('kinematics.ax_desc')"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <VariableGroup :title="$t('kinematics.groupY')" icon="↕️">
            <UnitSlider
              id="y0"
              v-model="params.y0"
              :label="$t('kinematics.y0')"
              unit="m"
              :min="-50"
              :max="50"
              :step="1"
              :description="$t('kinematics.y0_desc')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="v0y"
              v-model="params.v0y"
              :label="$t('kinematics.v0y')"
              unit="m/s"
              :min="-50"
              :max="50"
              :step="0.5"
              :description="$t('kinematics.v0y_desc')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="ay"
              v-model="params.ay"
              :label="$t('kinematics.ay')"
              unit="m/s²"
              :min="-15"
              :max="15"
              :step="0.2"
              :description="$t('kinematics.ay_desc')"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <VariableGroup :title="$t('kinematics.groupFriction')" icon="🧱" badge="Real">
            <UnitSlider
              id="mass"
              v-model="params.mass"
              :label="$t('kinematics.mass')"
              unit="kg"
              :min="0.1"
              :max="100"
              :step="0.5"
              :is-real-mode="mode === 'real'"
              :real-mode-effect="$t('kinematics.realEffectMass')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="frictionMu"
              v-model="params.frictionMu"
              :label="$t('kinematics.frictionMu')"
              unit=""
              :min="0"
              :max="1"
              :step="0.02"
              :is-real-mode="mode === 'real'"
              :real-mode-effect="$t('kinematics.realEffectFriction')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="dragCoeff"
              v-model="params.dragCoeff"
              :label="$t('kinematics.dragCoeff')"
              unit=""
              :min="0"
              :max="1.5"
              :step="0.05"
              :is-real-mode="mode === 'real'"
              :real-mode-effect="$t('kinematics.realEffectDrag')"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <SlotManager
            experiment-id="physics/motion/1d-2d-kinematics"
            :current-params="params"
            :current-mode="mode"
            @load="onLoadSlot"
          />
        </div>
      </aside>
    </div>

    <!-- Mobile Draggable Bottom Sheet for Controls -->
    <BottomSheet
      class="mobile-only"
      :title="$t('kinematics.controlsTitle')"
      :initial-snap="0.35"
      :snap-points="[0.15, 0.45, 0.85]"
    >
      <VariableGroup :title="$t('kinematics.groupX')" icon="↔️">
        <UnitSlider
          id="m-x0"
          v-model="params.x0"
          :label="$t('kinematics.x0')"
          unit="m"
          :min="-50"
          :max="50"
          :step="1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m-v0x"
          v-model="params.v0x"
          :label="$t('kinematics.v0x')"
          unit="m/s"
          :min="-50"
          :max="50"
          :step="0.5"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m-ax"
          v-model="params.ax"
          :label="$t('kinematics.ax')"
          unit="m/s²"
          :min="-15"
          :max="15"
          :step="0.2"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('kinematics.groupY')" icon="↕️">
        <UnitSlider
          id="m-y0"
          v-model="params.y0"
          :label="$t('kinematics.y0')"
          unit="m"
          :min="-50"
          :max="50"
          :step="1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m-v0y"
          v-model="params.v0y"
          :label="$t('kinematics.v0y')"
          unit="m/s"
          :min="-50"
          :max="50"
          :step="0.5"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m-ay"
          v-model="params.ay"
          :label="$t('kinematics.ay')"
          unit="m/s²"
          :min="-15"
          :max="15"
          :step="0.2"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('kinematics.groupFriction')" icon="🧱" badge="Real">
        <UnitSlider
          id="m-mass"
          v-model="params.mass"
          :label="$t('kinematics.mass')"
          unit="kg"
          :min="0.1"
          :max="100"
          :step="0.5"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m-frictionMu"
          v-model="params.frictionMu"
          :label="$t('kinematics.frictionMu')"
          unit=""
          :min="0"
          :max="1"
          :step="0.02"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m-dragCoeff"
          v-model="params.dragCoeff"
          :label="$t('kinematics.dragCoeff')"
          unit=""
          :min="0"
          :max="1.5"
          :step="0.05"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/motion/1d-2d-kinematics"
        :current-params="params"
        :current-mode="mode"
        @load="onLoadSlot"
      />
    </BottomSheet>

    <!-- Bottom Tab Panels (Graph, Table, Theory, Notes, Guided) -->
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

        <!-- Tab 3: Theory & Live Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel">
          <FormulaPanel
            :title="$t('kinematics.theoryTitle')"
            :formulas="formulaItems"
          />
        </div>

        <!-- Tab 4: Lab Notes -->
        <div v-show="activeTab === 'notes'" class="tab-panel notes-tab">
          <div class="notes-header">
            <h4>{{ $t('kinematics.notesTitle') }}</h4>
            <button type="button" class="btn-save-note touch-target" @click="saveNotes">
              💾 {{ $t('kinematics.saveNotes') }}
            </button>
          </div>
          <textarea
            v-model="userNotes"
            class="notes-textarea"
            :placeholder="$t('kinematics.notesPlaceholder')"
          ></textarea>
        </div>

        <!-- Tab 5: Guided Steps -->
        <div v-show="activeTab === 'guided'" class="tab-panel">
          <GuidedSteps :steps="guidedSteps" />
        </div>
      </div>
    </div>

    <!-- Export Modal -->
    <Modal
      :is-open="showExportModal"
      :title="$t('kinematics.exportModalTitle')"
      size="lg"
      @close="showExportModal = false"
    >
      <ExportReport
        :title="$t('kinematics.exportReportTitle')"
        :mode="mode"
        :params="params"
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
  KinematicsSimulation,
  computeIdealKinematicsAnalytical,
  type KinematicsParams,
  type KinematicsState
} from '../model/kinematics';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { kinematicsConfig } from '../config';

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
import KinematicsCanvas from '../view/KinematicsCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();

const canvasViewRef = ref<InstanceType<typeof KinematicsCanvas> | null>(null);

// State
const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('uniform-1d');
const userNotes = ref<string>('');

const params = reactive<KinematicsParams>({
  x0: 0,
  v0x: 10,
  ax: 0,
  y0: 0,
  v0y: 0,
  ay: 0,
  mass: 2.0,
  frictionMu: 0.05,
  dragCoeff: 0.3,
  airDensity: 1.225,
  crossSection: 0.05
});

let sim = new KinematicsSimulation(params, mode.value);
const currentState = ref<KinematicsState>(sim.getState());

const series = reactive<DataSeries>({
  t: [0],
  x: [0],
  y: [0],
  vx: [10],
  vy: [0],
  v: [10]
});

const trailPoints = ref<{ x: number; y: number }[]>([]);
const comparisonRuns = ref<ComparisonRun[]>([]);

// Accumulator decoupled loop
let accumulator: PhysicsAccumulator | null = null;

function checkIsFinished(): boolean {
  if (currentState.value.isStopped) return true;
  if (params.ax === 0 && params.ay === 0 && currentState.value.t >= 25) return true;
  if (currentState.value.t >= 60) return true;
  return false;
}

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.01,
    onPhysicsStep: (dt: number) => {
      if (checkIsFinished()) {
        pauseSimulation();
        onRunCompleted();
        return;
      }
      const nextState = sim.step(dt);
      currentState.value = nextState;

      // Append to series & trail
      series.t.push(nextState.t);
      series.x.push(nextState.x);
      series.y.push(nextState.y);
      series.vx.push(nextState.vx);
      series.vy.push(nextState.vy);
      series.v.push(nextState.v);

      trailPoints.value.push({ x: nextState.x, y: nextState.y });
    },
    onRenderStep: () => {
      // Rendering handled smoothly in Canvas view requestAnimationFrame loop
    }
  });
}

function togglePlay() {
  if (checkIsFinished()) {
    resetSimulation();
  }
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
  if (checkIsFinished()) return;
  if (accumulator) {
    accumulator.stepOnce();
  }
}

function resetSimulation() {
  pauseSimulation();
  sim.setParams(params);
  sim.setMode(mode.value);
  currentState.value = sim.reset();

  series.t = [0];
  series.x = [params.x0];
  series.y = [params.y0];
  series.vx = [currentState.value.vx];
  series.vy = [currentState.value.vy];
  series.v = [currentState.value.v];

  trailPoints.value = [{ x: params.x0, y: params.y0 }];
}

function setSpeed(s: number) {
  speed.value = s;
  accumulator?.setSpeed(s);
}

function setMode(m: 'ideal' | 'real') {
  mode.value = m;
  sim.setMode(m);
  resetSimulation();
}

function onParamChange() {
  currentPresetId.value = 'custom';
  resetSimulation();
}

const presetOptions = computed<PresetOption[]>(() => {
  return kinematicsConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params
  }));
});

function applyPreset(preset: PresetOption) {
  currentPresetId.value = preset.id;
  Object.assign(params, preset.params);
  if (preset.id === 'real-friction') {
    mode.value = 'real';
  } else {
    mode.value = 'ideal';
  }
  resetSimulation();
}

function onLoadSlot(slot: StoredSlot) {
  Object.assign(params, slot.params);
  mode.value = slot.mode;
  resetSimulation();
}

async function onRunCompleted() {
  const analytical = computeIdealKinematicsAnalytical(params);
  const simT = currentState.value.t;
  const theoX = analytical.xAtT(simT);
  const finalX = currentState.value.x;
  const error = Math.abs(finalX - theoX) / Math.max(1e-4, Math.abs(theoX));

  try {
    await db.runs.add({
      experimentId: 'physics/motion/1d-2d-kinematics',
      createdAt: Date.now(),
      mode: mode.value,
      params: { ...params },
      summary: {
        distanceTraveled: currentState.value.distanceTraveled,
        finalVelocity: currentState.value.v,
        finalTime: currentState.value.t,
        errorVsIdealPercent: error * 100
      },
      series: {
        t: [...series.t],
        x: [...series.x],
        y: [...series.y],
        vx: [...series.vx],
        vy: [...series.vy],
        v: [...series.v]
      }
    });

    if (comparisonRuns.value.length >= 3) {
      comparisonRuns.value.shift();
    }
    const runLabel = mode.value === 'ideal'
      ? t('kinematics.runComparisonIdeal', { v: params.v0x })
      : t('kinematics.runComparisonReal', { v: params.v0x });

    comparisonRuns.value.push({
      name: runLabel,
      color: mode.value === 'ideal' ? '#10b981' : '#f59e0b',
      series: {
        t: [...series.t],
        x: [...series.x],
        y: [...series.y],
        vx: [...series.vx],
        vy: [...series.vy],
        v: [...series.v]
      }
    });
  } catch (e) {
    console.warn('Error saving run to Dexie:', e);
  }
}

const calculatedResults = computed(() => {
  const analytical = computeIdealKinematicsAnalytical(params);
  const simT = currentState.value.t;
  const simX = currentState.value.x;
  const theoX = analytical.xAtT(simT);
  const simY = currentState.value.y;
  const theoY = analytical.yAtT(simT);
  const simV = currentState.value.v;
  const theoVx = analytical.vxAtT(simT);
  const theoVy = analytical.vyAtT(simT);
  const theoV = Math.sqrt(theoVx ** 2 + theoVy ** 2);

  return {
    simulatedX: simX,
    theoreticalX: theoX,
    errorX: Math.abs(simX - theoX) / Math.max(1e-4, Math.abs(theoX)) * 100,
    simulatedY: simY,
    theoreticalY: theoY,
    errorY: Math.abs(simY - theoY) / Math.max(1e-4, Math.abs(theoY)) * 100,
    simulatedV: simV,
    theoreticalV: theoV,
    errorV: Math.abs(simV - theoV) / Math.max(1e-4, Math.abs(theoV)) * 100,
    distanceTraveled: currentState.value.distanceTraveled,
    stoppingDistance: analytical.stoppingDistance ?? 0
  };
});

const reportResultsRows = computed(() => {
  const res = calculatedResults.value;
  return [
    {
      name: 'موقعیت افقی (Position X)',
      simulated: `${res.simulatedX.toFixed(2)} m`,
      theoretical: `${res.theoreticalX.toFixed(2)} m`,
      error: `${res.errorX.toFixed(2)} %`
    },
    {
      name: 'موقعیت عمودی (Position Y)',
      simulated: `${res.simulatedY.toFixed(2)} m`,
      theoretical: `${res.theoreticalY.toFixed(2)} m`,
      error: `${res.errorY.toFixed(2)} %`
    },
    {
      name: 'تندی کل (Speed |v|)',
      simulated: `${res.simulatedV.toFixed(2)} m/s`,
      theoretical: `${res.theoreticalV.toFixed(2)} m/s`,
      error: `${res.errorV.toFixed(2)} %`
    },
    {
      name: 'مسافت طی‌شده (Distance Traveled)',
      simulated: `${res.distanceTraveled.toFixed(2)} m`,
      theoretical: '—',
      error: '—'
    }
  ];
});

const reportVariablesList = computed(() => [
  { name: 'موقعیت اولیه افقی', symbol: 'x₀', value: params.x0, unit: 'm' },
  { name: 'سرعت اولیه افقی', symbol: 'v₀x', value: params.v0x, unit: 'm/s' },
  { name: 'شتاب افقی', symbol: 'a_x', value: params.ax, unit: 'm/s²' },
  { name: 'موقعیت اولیه عمودی', symbol: 'y₀', value: params.y0, unit: 'm' },
  { name: 'سرعت اولیه عمودی', symbol: 'v₀y', value: params.v0y, unit: 'm/s' },
  { name: 'شتاب عمودی', symbol: 'a_y', value: params.ay, unit: 'm/s²' },
  { name: 'جرم متحرک', symbol: 'm', value: params.mass, unit: 'kg' },
  { name: 'ضریب اصطکاک', symbol: 'μ_k', value: params.frictionMu, unit: '—' },
  { name: 'ضریب پسار', symbol: 'C_d', value: params.dragCoeff, unit: '—' }
]);

const formulaItems = computed<FormulaItem[]>(() => {
  const res = calculatedResults.value;
  return [
    {
      title: t('kinematics.formulas.posTitle'),
      latex: 'x(t) = x_0 + v_{0x} t + \\frac{1}{2} a_x t^2',
      explanation: t('kinematics.formulas.posExpl'),
      liveValue: `x(${currentState.value.t.toFixed(1)}s) = ${currentState.value.x.toFixed(2)} m`
    },
    {
      title: t('kinematics.formulas.velTitle'),
      latex: 'v_x(t) = v_{0x} + a_x t',
      explanation: t('kinematics.formulas.velExpl'),
      liveValue: `v_x = ${currentState.value.vx.toFixed(2)} m/s`
    },
    {
      title: t('kinematics.formulas.torricelliTitle'),
      latex: 'v^2 - v_0^2 = 2 a \\Delta x',
      explanation: t('kinematics.formulas.torricelliExpl'),
      liveValue: res.stoppingDistance > 0 ? `d_{\\text{stop}} = ${res.stoppingDistance.toFixed(2)} m` : `v = ${currentState.value.v.toFixed(2)} m/s`
    },
    {
      title: t('kinematics.formulas.vecTitle'),
      latex: '\\vec{r}(t) = x(t)\\hat{i} + y(t)\\hat{j}, \\quad \\vec{v}(t) = v_x\\hat{i} + v_y\\hat{j}',
      explanation: t('kinematics.formulas.vecExpl'),
      liveValue: `|\\vec{v}| = ${currentState.value.v.toFixed(2)} m/s`
    }
  ];
});

const bottomTabs = computed(() => [
  { id: 'graph', label: `📈 ${t('kinematics.tabs.graph')}` },
  { id: 'table', label: `📊 ${t('kinematics.tabs.table')}` },
  { id: 'theory', label: `📐 ${t('kinematics.tabs.theory')}` },
  { id: 'notes', label: `📝 ${t('kinematics.tabs.notes')}` },
  { id: 'guided', label: `🧭 ${t('kinematics.tabs.guided')}` }
]);

const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step1',
    title: t('kinematics.steps.step1Title'),
    instruction: t('kinematics.steps.step1Instr'),
    hint: t('kinematics.steps.step1Hint')
  },
  {
    id: 'step2',
    title: t('kinematics.steps.step2Title'),
    instruction: t('kinematics.steps.step2Instr'),
    hint: t('kinematics.steps.step2Hint')
  },
  {
    id: 'step3',
    title: t('kinematics.steps.step3Title'),
    instruction: t('kinematics.steps.step3Instr'),
    hint: t('kinematics.steps.step3Hint')
  }
]);

async function loadNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/motion/1d-2d-kinematics').first();
    if (existing) {
      userNotes.value = existing.content;
    }
  } catch (e) {
    console.warn('Could not load notes:', e);
  }
}

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/motion/1d-2d-kinematics').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now()
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/motion/1d-2d-kinematics',
        content: userNotes.value,
        updatedAt: Date.now()
      });
    }
  } catch (e) {
    console.error('Failed to save notes:', e);
  }
}

onMounted(() => {
  initLoop();
  loadNotes();
});

onBeforeUnmount(() => {
  if (accumulator) {
    accumulator.pause();
    accumulator = null;
  }
});
</script>

<style scoped>
.kinematics-experiment {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.experiment-workspace {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  min-height: 480px;
}

@media (min-width: 1024px) {
  .experiment-workspace {
    grid-template-columns: 1fr 340px;
    align-items: stretch;
  }
}

.scene-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  position: relative;
  min-height: auto;
}

.canvas-mount {
  position: relative;
  flex: 1;
  height: 480px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-subtle);
}

.control-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--surface-glass);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  max-height: 600px;
  overflow: hidden;
}

.sidebar-header h3 {
  font-size: var(--text-md);
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.sidebar-scroll {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  overflow-y: auto;
  min-height: 0;
  padding-inline-end: var(--space-1);
}

.bottom-tabs-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-xl);
}

.tabs-nav {
  display: flex;
  gap: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--space-2);
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast);
  white-space: nowrap;
}

.tab-btn:hover {
  background: var(--surface-overlay);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--primary-surface);
  color: var(--primary);
}

.tab-content-area {
  min-height: 280px;
}

.tab-panel {
  width: 100%;
}

.notes-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notes-header h4 {
  margin: 0;
  font-size: var(--text-md);
  color: var(--text-primary);
}

.btn-save-note {
  padding: var(--space-2) var(--space-3);
  background: var(--primary);
  color: var(--text-on-primary);
  border: none;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--duration-fast);
}

.btn-save-note:hover {
  opacity: 0.9;
}

.notes-textarea {
  width: 100%;
  min-height: 200px;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface-base);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-sm);
  resize: vertical;
}

.notes-textarea:focus {
  outline: none;
  border-color: var(--primary);
}

@media (max-width: 1023px) {
  .experiment-workspace {
    min-height: auto;
  }
  .canvas-mount {
    height: clamp(260px, 38vh, 420px);
  }
  .desktop-only {
    display: none !important;
  }
}

@media (max-width: 640px) {
  .kinematics-experiment {
    padding: var(--space-2);
    gap: var(--space-2);
  }
  .bottom-tabs-section {
    padding: var(--space-2);
  }
  .tab-btn {
    padding: 0.45rem 0.8rem;
    font-size: 0.8rem;
  }
}

@media (min-width: 1024px) {
  .mobile-only {
    display: none !important;
  }
}
</style>
