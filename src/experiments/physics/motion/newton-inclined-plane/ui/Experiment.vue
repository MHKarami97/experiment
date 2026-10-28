<template>
  <div class="inclined-plane-experiment">
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
          <InclinedPlaneCanvas
            ref="canvasViewRef"
            :params="params"
            :state="currentState"
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
          <h3>🎛️ {{ $t('inclinedPlane.controlsTitle') }}</h3>
        </div>

        <div class="sidebar-scroll">
          <VariableGroup :title="$t('inclinedPlane.groupGeometry')" icon="📐">
            <UnitSlider
              id="angle"
              v-model="params.angle"
              :label="$t('inclinedPlane.angle')"
              unit="°"
              :min="0"
              :max="80"
              :step="1"
              :description="$t('inclinedPlane.angle_desc')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="gravity"
              v-model="params.gravity"
              :label="$t('inclinedPlane.gravity')"
              unit="m/s²"
              :min="1"
              :max="25"
              :step="0.1"
              :description="$t('inclinedPlane.gravity_desc')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="initialPos"
              v-model="params.initialPos"
              :label="$t('inclinedPlane.initialPos')"
              unit="m"
              :min="0"
              :max="20"
              :step="0.5"
              :description="$t('inclinedPlane.initialPos_desc')"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <VariableGroup :title="$t('inclinedPlane.groupBlock')" icon="📦">
            <UnitSlider
              id="mass"
              v-model="params.mass"
              :label="$t('inclinedPlane.mass')"
              unit="kg"
              :min="0.5"
              :max="50"
              :step="0.5"
              :description="$t('inclinedPlane.mass_desc')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="fPull"
              v-model="params.fPull"
              :label="$t('inclinedPlane.fPull')"
              unit="N"
              :min="-80"
              :max="120"
              :step="1"
              :description="$t('inclinedPlane.fPull_desc')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="initialSpeed"
              v-model="params.initialSpeed"
              :label="$t('inclinedPlane.initialSpeed')"
              unit="m/s"
              :min="-15"
              :max="15"
              :step="0.5"
              :description="$t('inclinedPlane.initialSpeed_desc')"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <VariableGroup :title="$t('inclinedPlane.groupFriction')" icon="🧱" badge="Real">
            <UnitSlider
              id="muS"
              v-model="params.muS"
              :label="$t('inclinedPlane.muS')"
              unit=""
              :min="0"
              :max="1.2"
              :step="0.02"
              :is-real-mode="mode === 'real'"
              :real-mode-effect="$t('inclinedPlane.muS_desc')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="muK"
              v-model="params.muK"
              :label="$t('inclinedPlane.muK')"
              unit=""
              :min="0"
              :max="1"
              :step="0.02"
              :is-real-mode="mode === 'real'"
              :real-mode-effect="$t('inclinedPlane.muK_desc')"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <SlotManager
            experiment-id="physics/motion/newton-inclined-plane"
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
      :title="$t('inclinedPlane.controlsTitle')"
      :initial-snap="0.35"
      :snap-points="[0.15, 0.45, 0.85]"
    >
      <VariableGroup :title="$t('inclinedPlane.groupGeometry')" icon="📐">
        <UnitSlider
          id="m-angle"
          v-model="params.angle"
          :label="$t('inclinedPlane.angle')"
          unit="°"
          :min="0"
          :max="80"
          :step="1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m-gravity"
          v-model="params.gravity"
          :label="$t('inclinedPlane.gravity')"
          unit="m/s²"
          :min="1"
          :max="25"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m-initialPos"
          v-model="params.initialPos"
          :label="$t('inclinedPlane.initialPos')"
          unit="m"
          :min="0"
          :max="20"
          :step="0.5"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('inclinedPlane.groupBlock')" icon="📦">
        <UnitSlider
          id="m-mass"
          v-model="params.mass"
          :label="$t('inclinedPlane.mass')"
          unit="kg"
          :min="0.5"
          :max="50"
          :step="0.5"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m-fPull"
          v-model="params.fPull"
          :label="$t('inclinedPlane.fPull')"
          unit="N"
          :min="-80"
          :max="120"
          :step="1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m-initialSpeed"
          v-model="params.initialSpeed"
          :label="$t('inclinedPlane.initialSpeed')"
          unit="m/s"
          :min="-15"
          :max="15"
          :step="0.5"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('inclinedPlane.groupFriction')" icon="🧱" badge="Real">
        <UnitSlider
          id="m-muS"
          v-model="params.muS"
          :label="$t('inclinedPlane.muS')"
          unit=""
          :min="0"
          :max="1.2"
          :step="0.02"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m-muK"
          v-model="params.muK"
          :label="$t('inclinedPlane.muK')"
          unit=""
          :min="0"
          :max="1"
          :step="0.02"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/motion/newton-inclined-plane"
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
            :title="$t('inclinedPlane.theoryTitle')"
            :formulas="formulaItems"
          />
        </div>

        <!-- Tab 4: Lab Notes -->
        <div v-show="activeTab === 'notes'" class="tab-panel notes-tab">
          <div class="notes-header">
            <h4>{{ $t('inclinedPlane.notesTitle') }}</h4>
            <button type="button" class="btn-save-note touch-target" @click="saveNotes">
              💾 {{ $t('inclinedPlane.saveNotes') }}
            </button>
          </div>
          <textarea
            v-model="userNotes"
            class="notes-textarea"
            :placeholder="$t('inclinedPlane.notesPlaceholder')"
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
      :title="$t('inclinedPlane.exportModalTitle')"
      size="lg"
      @close="showExportModal = false"
    >
      <ExportReport
        :title="$t('inclinedPlane.exportReportTitle')"
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
  InclinedPlaneSimulation,
  computeAnalyticalInclinedPlane,
  type InclinedPlaneParams,
  type InclinedPlaneState
} from '../model/inclinedPlane';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { inclinedPlaneConfig } from '../config';

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
import InclinedPlaneCanvas from '../view/InclinedPlaneCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const { t } = useI18n();

const canvasViewRef = ref<InstanceType<typeof InclinedPlaneCanvas> | null>(null);

// State
const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('frictionless-slide');
const userNotes = ref<string>('');

const params = reactive<InclinedPlaneParams>({
  angle: 30,
  mass: 2.0,
  gravity: 9.81,
  muS: 0.4,
  muK: 0.25,
  fPull: 0,
  initialPos: 15,
  initialSpeed: 0,
  inclineLength: 20,
  airDensity: 1.225,
  dragCoeff: 0.2,
  crossSection: 0.05
});

let sim = new InclinedPlaneSimulation(params, mode.value);
const currentState = ref<InclinedPlaneState>(sim.getState());

const series = reactive<DataSeries>({
  t: [0],
  x: [15],
  y: [15 * Math.sin((30 * Math.PI) / 180)],
  vx: [0],
  vy: [0],
  v: [0]
});

const comparisonRuns = ref<ComparisonRun[]>([]);

// Accumulator decoupled loop
let accumulator: PhysicsAccumulator | null = null;

function checkIsFinished(): boolean {
  if (currentState.value.atBoundary !== 'none' && Math.abs(currentState.value.v) < 1e-3) return true;
  if (currentState.value.isStatic && currentState.value.t > 1.0) return true;
  if (currentState.value.t >= 40) return true;
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

      // Update series (s as horizontal progression, height as vertical)
      const rad = (params.angle * Math.PI) / 180;
      series.t.push(nextState.t);
      series.x.push(nextState.s);
      series.y.push(nextState.s * Math.sin(rad));
      series.vx.push(nextState.v * Math.cos(rad));
      series.vy.push(nextState.v * Math.sin(rad));
      series.v.push(nextState.v);
    },
    onRenderStep: () => {}
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

  const rad = (params.angle * Math.PI) / 180;
  series.t = [0];
  series.x = [params.initialPos];
  series.y = [params.initialPos * Math.sin(rad)];
  series.vx = [params.initialSpeed * Math.cos(rad)];
  series.vy = [params.initialSpeed * Math.sin(rad)];
  series.v = [params.initialSpeed];
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
  return inclinedPlaneConfig.presets.map((p: ExperimentPresetDef) => ({
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
  const analytical = computeAnalyticalInclinedPlane(params, mode.value);
  const error = Math.abs(currentState.value.a - analytical.acceleration) / Math.max(1e-4, Math.abs(analytical.acceleration));

  try {
    await db.runs.add({
      experimentId: 'physics/motion/newton-inclined-plane',
      createdAt: Date.now(),
      mode: mode.value,
      params: { ...params },
      summary: {
        finalPosition: currentState.value.s,
        finalVelocity: currentState.value.v,
        finalAcceleration: currentState.value.a,
        normalForce: currentState.value.normalForce,
        frictionForce: currentState.value.frictionForce,
        totalEnergy: currentState.value.totalEnergy,
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
      ? t('inclinedPlane.runComparisonIdeal', { angle: params.angle })
      : t('inclinedPlane.runComparisonReal', { angle: params.angle, mu: params.muK });

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
  const analytical = computeAnalyticalInclinedPlane(params, mode.value);
  const simA = currentState.value.a;
  const theoA = analytical.acceleration;

  return {
    simulatedA: simA,
    theoreticalA: theoA,
    errorA: Math.abs(simA - theoA) / Math.max(1e-4, Math.abs(theoA)) * 100,
    normalForce: currentState.value.normalForce,
    frictionForce: currentState.value.frictionForce,
    criticalAngle: analytical.criticalAngleDeg,
    kineticEnergy: currentState.value.kineticEnergy,
    potentialEnergy: currentState.value.potentialEnergy,
    totalEnergy: currentState.value.totalEnergy
  };
});

const reportResultsRows = computed(() => {
  const res = calculatedResults.value;
  return [
    {
      name: 'شتاب خالص امتداد شیب (Acceleration a)',
      simulated: `${res.simulatedA.toFixed(2)} m/s²`,
      theoretical: `${res.theoreticalA.toFixed(2)} m/s²`,
      error: `${res.errorA.toFixed(2)} %`
    },
    {
      name: 'نیروی عمودی سطح (Normal Force N)',
      simulated: `${res.normalForce.toFixed(2)} N`,
      theoretical: `${(params.mass * params.gravity * Math.cos((params.angle * Math.PI) / 180)).toFixed(2)} N`,
      error: '0.00 %'
    },
    {
      name: 'نیروی اصطکاک (Friction Force f)',
      simulated: `${res.frictionForce.toFixed(2)} N`,
      theoretical: '—',
      error: '—'
    },
    {
      name: 'زاویه بحرانی لغزش (Critical Angle θc)',
      simulated: `${res.criticalAngle.toFixed(2)}°`,
      theoretical: `${(Math.atan(params.muS) * 180 / Math.PI).toFixed(2)}°`,
      error: '0.00 %'
    },
    {
      name: 'انرژی مکانیکی کل (Total Energy E)',
      simulated: `${res.totalEnergy.toFixed(2)} J`,
      theoretical: '—',
      error: '—'
    }
  ];
});

const reportVariablesList = computed(() => [
  { name: 'زاویه شیب', symbol: 'θ', value: params.angle, unit: '°' },
  { name: 'جرم جعبه', symbol: 'm', value: params.mass, unit: 'kg' },
  { name: 'شتاب گرانش', symbol: 'g', value: params.gravity, unit: 'm/s²' },
  { name: 'نیروی کشش', symbol: 'F_pull', value: params.fPull, unit: 'N' },
  { name: 'مکان اولیه', symbol: 's₀', value: params.initialPos, unit: 'm' },
  { name: 'سرعت اولیه', symbol: 'v₀', value: params.initialSpeed, unit: 'm/s' },
  { name: 'ضریب اصطکاک ایستایی', symbol: 'μ_s', value: params.muS, unit: '—' },
  { name: 'ضریب اصطکاک جنبشی', symbol: 'μ_k', value: params.muK, unit: '—' }
]);

const formulaItems = computed<FormulaItem[]>(() => {
  const res = calculatedResults.value;
  return [
    {
      title: t('inclinedPlane.formulas.netForceTitle'),
      latex: 'F_{\\text{net}} = F_{\\text{pull}} - m g \\sin\\theta + f_{\\text{friction}} = m a',
      explanation: t('inclinedPlane.formulas.netForceExpl'),
      liveValue: `a = ${currentState.value.a.toFixed(2)} m/s²`
    },
    {
      title: t('inclinedPlane.formulas.normalTitle'),
      latex: 'N = m g \\cos\\theta',
      explanation: t('inclinedPlane.formulas.normalExpl'),
      liveValue: `N = ${currentState.value.normalForce.toFixed(2)} N`
    },
    {
      title: t('inclinedPlane.formulas.frictionTitle'),
      latex: 'f_s \\le \\mu_s N, \\quad f_k = \\mu_k N',
      explanation: t('inclinedPlane.formulas.frictionExpl'),
      liveValue: `f = ${currentState.value.frictionForce.toFixed(2)} N`
    },
    {
      title: t('inclinedPlane.formulas.criticalTitle'),
      latex: '\\tan\\theta_c = \\mu_s',
      explanation: t('inclinedPlane.formulas.criticalExpl'),
      liveValue: `\\theta_c = ${res.criticalAngle.toFixed(1)}^\\circ`
    }
  ];
});

const bottomTabs = computed(() => [
  { id: 'graph', label: `📈 ${t('inclinedPlane.tabs.graph')}` },
  { id: 'table', label: `📊 ${t('inclinedPlane.tabs.table')}` },
  { id: 'theory', label: `📐 ${t('inclinedPlane.tabs.theory')}` },
  { id: 'notes', label: `📝 ${t('inclinedPlane.tabs.notes')}` },
  { id: 'guided', label: `🧭 ${t('inclinedPlane.tabs.guided')}` }
]);

const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step1',
    title: t('inclinedPlane.steps.step1Title'),
    instruction: t('inclinedPlane.steps.step1Instr'),
    hint: t('inclinedPlane.steps.step1Hint')
  },
  {
    id: 'step2',
    title: t('inclinedPlane.steps.step2Title'),
    instruction: t('inclinedPlane.steps.step2Instr'),
    hint: t('inclinedPlane.steps.step2Hint')
  },
  {
    id: 'step3',
    title: t('inclinedPlane.steps.step3Title'),
    instruction: t('inclinedPlane.steps.step3Instr'),
    hint: t('inclinedPlane.steps.step3Hint')
  }
]);

async function loadNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/motion/newton-inclined-plane').first();
    if (existing) {
      userNotes.value = existing.content;
    }
  } catch (e) {
    console.warn('Could not load notes:', e);
  }
}

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/motion/newton-inclined-plane').first();
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now()
      });
    } else {
      await db.notes.add({
        experimentId: 'physics/motion/newton-inclined-plane',
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
.inclined-plane-experiment {
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
  .inclined-plane-experiment {
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
