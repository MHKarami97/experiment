<template>
  <div class="projectile-experiment">
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
          <ProjectileCanvas
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

      <!-- Desktop Sidebar Controls (hidden on mobile, rendered in BottomSheet) -->
      <!-- Desktop Sidebar Controls (hidden on mobile, rendered in BottomSheet) -->
      <aside class="control-sidebar desktop-only">
        <div class="sidebar-header">
          <h3>🎛️ {{ $t('projectile.controlsTitle') }}</h3>
        </div>

        <div class="sidebar-scroll">
          <VariableGroup :title="$t('projectile.groupLaunch')" icon="🚀">
            <UnitSlider
              id="v0"
              v-model="params.v0"
              :label="$t('projectile.v0')"
              unit="m/s"
              :min="1"
              :max="100"
              :step="0.5"
              :description="$t('projectile.v0_desc')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="angle"
              v-model="params.angle"
              :label="$t('projectile.angle')"
              unit="°"
              :min="0"
              :max="90"
              :step="1"
              :description="$t('projectile.angle_desc')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="h0"
              v-model="params.h0"
              :label="$t('projectile.h0')"
              unit="m"
              :min="0"
              :max="50"
              :step="1"
              :description="$t('projectile.h0_desc')"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <VariableGroup :title="$t('projectile.groupEnvironment')" icon="🪐">
            <UnitSlider
              id="gravity"
              v-model="params.gravity"
              :label="$t('projectile.gravity')"
              unit="m/s²"
              :min="1"
              :max="30"
              :step="0.1"
              :description="$t('projectile.gravity_desc')"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <VariableGroup :title="$t('projectile.groupAero')" icon="🌪️" badge="Real">
            <UnitSlider
              id="mass"
              v-model="params.mass"
              :label="$t('projectile.mass')"
              unit="kg"
              :min="0.1"
              :max="50"
              :step="0.1"
              :is-real-mode="mode === 'real'"
              :real-mode-effect="$t('projectile.realEffectMass')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="airDensity"
              v-model="params.airDensity"
              :label="$t('projectile.airDensity')"
              unit="kg/m³"
              :min="0"
              :max="3.0"
              :step="0.05"
              :is-real-mode="mode === 'real'"
              :real-mode-effect="$t('projectile.realEffectAirDensity')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="dragCoeff"
              v-model="params.dragCoeff"
              :label="$t('projectile.dragCoeff')"
              unit="—"
              :min="0.01"
              :max="1.5"
              :step="0.01"
              :is-real-mode="mode === 'real'"
              :real-mode-effect="$t('projectile.realEffectDragCoeff')"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="wind"
              v-model="params.wind"
              :label="$t('projectile.wind')"
              unit="m/s"
              :min="-25"
              :max="25"
              :step="1"
              :is-real-mode="mode === 'real'"
              :real-mode-effect="$t('projectile.realEffectWind')"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <SlotManager
            experiment-id="physics/motion/projectile"
            :current-params="params"
            :current-mode="mode"
            @load="onLoadSlot"
          />
        </div>
      </aside>
    </div>

    <!-- Mobile BottomSheet for Controls -->
    <BottomSheet :title="$t('projectile.mobileControlsTitle')">
      <VariableGroup :title="$t('projectile.groupLaunch')" icon="🚀">
        <UnitSlider
          id="m-v0"
          v-model="params.v0"
          :label="$t('projectile.v0')"
          unit="m/s"
          :min="1"
          :max="100"
          :step="0.5"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m-angle"
          v-model="params.angle"
          :label="$t('projectile.angle')"
          unit="°"
          :min="0"
          :max="90"
          :step="1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m-h0"
          v-model="params.h0"
          :label="$t('projectile.h0')"
          unit="m"
          :min="0"
          :max="50"
          :step="1"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('projectile.groupEnvironment')" icon="🪐">
        <UnitSlider
          id="m-gravity"
          v-model="params.gravity"
          :label="$t('projectile.gravity')"
          unit="m/s²"
          :min="1"
          :max="30"
          :step="0.1"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('projectile.groupAero')" icon="🌪️">
        <UnitSlider
          id="m-mass"
          v-model="params.mass"
          :label="$t('projectile.mass')"
          unit="kg"
          :min="0.1"
          :max="50"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m-airDensity"
          v-model="params.airDensity"
          :label="$t('projectile.airDensity')"
          unit="kg/m³"
          :min="0"
          :max="3.0"
          :step="0.05"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m-wind"
          v-model="params.wind"
          :label="$t('projectile.wind')"
          unit="m/s"
          :min="-25"
          :max="25"
          :step="1"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/motion/projectile"
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
            :title="$t('projectile.theoryTitle')"
            :formulas="formulaItems"
          />
        </div>

        <!-- Tab 4: Lab Notes -->
        <div v-show="activeTab === 'notes'" class="tab-panel notes-tab">
          <div class="notes-header">
            <h4>{{ $t('projectile.notesTitle') }}</h4>
            <button type="button" class="btn-save-note touch-target" @click="saveNotes">
              💾 {{ $t('projectile.saveNotes') }}
            </button>
          </div>
          <textarea
            v-model="userNotes"
            class="notes-textarea"
            :placeholder="$t('projectile.notesPlaceholder')"
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
      :title="$t('projectile.exportModalTitle')"
      size="lg"
      @close="showExportModal = false"
    >
      <ExportReport
        :title="$t('projectile.exportReportTitle')"
        :mode="mode"
        :params="params"
        :results="calculatedResults"
        :notes="userNotes"
        :scene-canvas="canvasViewRef?.getCanvas()"
      />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { ProjectileSimulation, computeIdealAnalytical, type ProjectileParams, type ProjectileState } from '../model/projectile';
import { PhysicsAccumulator } from '@/core/accumulator';
import { db, type StoredSlot } from '@/db';
import { useAppStore } from '@/app/store';
import { projectileConfig } from '../config';

const { t } = useI18n();

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
import ProjectileCanvas from '../view/ProjectileCanvas.vue';
import type { DataSeries, ComparisonRun, FormulaItem, PresetOption, LabStep } from '@/shared/types';
import type { ExperimentPresetDef } from '@/experiments/registry';

const store = useAppStore();
const canvasViewRef = ref<InstanceType<typeof ProjectileCanvas> | null>(null);

// State
const isRunning = ref(false);
const speed = ref(1.0);
const mode = ref<'ideal' | 'real'>('ideal');
const showRuler = ref(false);
const showStopwatch = ref(false);
const showExportModal = ref(false);
const activeTab = ref('graph');
const currentPresetId = ref<string>('earth-ideal');
const userNotes = ref<string>('');

const params = reactive<ProjectileParams>({
  v0: 25,
  angle: 45,
  h0: 0,
  gravity: 9.80665,
  mass: 1.0,
  dragCoeff: 0.47,
  crossSection: 0.01,
  airDensity: 1.225,
  wind: 0
});

let sim = new ProjectileSimulation(params, mode.value);
const currentState = ref<ProjectileState>(sim.getState());

const series = reactive<DataSeries>({
  t: [0],
  x: [0],
  y: [0],
  vx: [0],
  vy: [0],
  v: [0]
});

const trailPoints = ref<{ x: number; y: number }[]>([]);
const comparisonRuns = ref<ComparisonRun[]>([]);

// Accumulator decoupled loop
let accumulator: PhysicsAccumulator | null = null;

function initLoop() {
  accumulator = new PhysicsAccumulator({
    fixedDeltaTime: 0.01,
    onPhysicsStep: (dt: number) => {
      if (currentState.value.isLanded) {
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
  if (currentState.value.isLanded) {
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
  if (currentState.value.isLanded) return;
  if (accumulator) {
    accumulator.stepOnce();
  }
}

function resetSimulation() {
  pauseSimulation();
  sim.setParams(params);
  sim.setMode(mode.value);
  currentState.value = sim.reset();

  // Reset series
  series.t = [0];
  series.x = [0];
  series.y = [params.h0];
  series.vx = [currentState.value.vx];
  series.vy = [currentState.value.vy];
  series.v = [currentState.value.v];

  trailPoints.value = [{ x: 0, y: params.h0 }];
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
  return projectileConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params
  }));
});

function applyPreset(preset: PresetOption) {
  currentPresetId.value = preset.id;
  Object.assign(params, preset.params);
  if (preset.id === 'earth-ideal' || preset.id === 'moon') {
    mode.value = 'ideal';
  } else {
    mode.value = 'real';
  }
  resetSimulation();
}

function onLoadSlot(slot: StoredSlot) {
  Object.assign(params, slot.params);
  mode.value = slot.mode;
  resetSimulation();
}

// When run lands, automatically persist run and add to comparison overlay
async function onRunCompleted() {
  const analytical = computeIdealAnalytical(params);
  const finalX = currentState.value.x;
  const error = Math.abs(finalX - analytical.range) / Math.max(1e-4, analytical.range);

  try {
    await db.runs.add({
      experimentId: 'physics/motion/projectile',
      createdAt: Date.now(),
      mode: mode.value,
      params: { ...params },
      summary: {
        maxHeight: currentState.value.maxHeight,
        range: currentState.value.x,
        flightTime: currentState.value.t,
        impactVelocity: currentState.value.v,
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

    // Add to comparison runs
    if (comparisonRuns.value.length >= 3) {
      comparisonRuns.value.shift();
    }
    const runLabel = mode.value === 'ideal'
      ? t('projectile.runComparisonIdeal', { v: params.v0 })
      : t('projectile.runComparisonReal', { v: params.v0 });

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

// Analytical vs Simulated Results for Export and Theory
const calculatedResults = computed(() => {
  const analytical = computeIdealAnalytical(params);
  const simRange = currentState.value.x;
  const simMaxH = currentState.value.maxHeight;
  const simTime = currentState.value.t;

  return {
    simulatedRange: simRange,
    theoreticalRange: analytical.range,
    rangeError: Math.abs(simRange - analytical.range) / Math.max(1e-4, analytical.range) * 100,
    simulatedMaxHeight: simMaxH,
    theoreticalMaxHeight: analytical.maxHeight,
    heightError: Math.abs(simMaxH - analytical.maxHeight) / Math.max(1e-4, analytical.maxHeight) * 100,
    simulatedFlightTime: simTime,
    theoreticalFlightTime: analytical.flightTime,
    timeError: Math.abs(simTime - analytical.flightTime) / Math.max(1e-4, analytical.flightTime) * 100
  };
});

const formulaItems = computed<FormulaItem[]>(() => {
  const res = calculatedResults.value;
  return [
    {
      title: t('projectile.formulas.rangeTitle'),
      latex: 'R = \\frac{v_0 \\cos\\theta}{g} \\left( v_0 \\sin\\theta + \\sqrt{v_0^2 \\sin^2\\theta + 2gh_0} \\right)',
      explanation: t('projectile.formulas.rangeExpl'),
      liveValue: `${res.theoreticalRange.toFixed(2)} m`
    },
    {
      title: t('projectile.formulas.maxHeightTitle'),
      latex: 'H_{\\text{max}} = h_0 + \\frac{v_0^2 \\sin^2\\theta}{2g}',
      explanation: t('projectile.formulas.maxHeightExpl'),
      liveValue: `${res.theoreticalMaxHeight.toFixed(2)} m`
    },
    {
      title: t('projectile.formulas.flightTimeTitle'),
      latex: 'T_{\\text{flight}} = \\frac{v_0 \\sin\\theta + \\sqrt{v_0^2 \\sin^2\\theta + 2gh_0}}{g}',
      explanation: t('projectile.formulas.flightTimeExpl'),
      liveValue: `${res.theoreticalFlightTime.toFixed(2)} s`
    },
    {
      title: t('projectile.formulas.dragTitle'),
      latex: '\\vec{F}_d = -\\frac{1}{2} \\rho C_d A |\\vec{v} - \\vec{v}_{\\text{wind}}| (\\vec{v} - \\vec{v}_{\\text{wind}})',
      explanation: t('projectile.formulas.dragExpl')
    }
  ];
});

const guidedSteps = computed<LabStep[]>(() => [
  {
    id: 'step1',
    title: t('projectile.steps.step1Title'),
    instruction: t('projectile.steps.step1Instr'),
    hint: t('projectile.steps.step1Hint')
  },
  {
    id: 'step2',
    title: t('projectile.steps.step2Title'),
    instruction: t('projectile.steps.step2Instr'),
    hint: t('projectile.steps.step2Hint')
  },
  {
    id: 'step3',
    title: t('projectile.steps.step3Title'),
    instruction: t('projectile.steps.step3Instr'),
    hint: t('projectile.steps.step3Hint')
  }
]);

const bottomTabs = computed(() => [
  { id: 'graph', label: `📈 ${t('common.graph')}` },
  { id: 'table', label: `📋 ${t('common.table')}` },
  { id: 'theory', label: `📐 ${t('common.theory')}` },
  { id: 'notes', label: `📝 ${t('common.notes')}` },
  { id: 'guided', label: `🧭 ${t('common.guided')}` }
]);

async function loadNotes() {
  const note = await db.notes.where('experimentId').equals('physics/motion/projectile').first();
  if (note) {
    userNotes.value = note.content;
  }
}

async function saveNotes() {
  const existing = await db.notes.where('experimentId').equals('physics/motion/projectile').first();
  await db.notes.put({
    id: existing?.id,
    experimentId: 'physics/motion/projectile',
    updatedAt: Date.now(),
    content: userNotes.value
  });
  store.showToast(t('projectile.notesSaved'), 'success');
}

onMounted(() => {
  initLoop();
  resetSimulation();
  loadNotes();
});

onBeforeUnmount(() => {
  accumulator?.destroy();
});
</script>

<style scoped>
.projectile-experiment {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: var(--space-3);
  padding: var(--space-3);
  overflow-x: hidden;
}

.experiment-workspace {
  display: grid;
  grid-template-columns: 1fr 390px;
  gap: var(--space-4);
  min-height: 520px;
}

.scene-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.canvas-mount {
  position: relative;
  width: 100%;
  height: 520px;
  overflow: hidden;
  border-radius: var(--radius-xl);
}

.control-sidebar {
  display: flex;
  flex-direction: column;
  background: var(--surface-card);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  height: 575px;
}

.sidebar-header {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-hover);
}

.sidebar-header h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.sidebar-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bottom-tabs-section {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-xl);
  overflow: hidden;
  height: 380px;
}

.tabs-nav {
  display: flex;
  background: var(--surface-hover);
  border-bottom: 1px solid var(--border-subtle);
  overflow-x: auto;
}

.tab-btn {
  padding: 0.65rem 1.25rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--color-physics);
  border-bottom-color: var(--color-physics);
  background: var(--surface-card);
}

.tab-content-area {
  padding: var(--space-3);
  flex: 1;
  overflow-y: auto;
}

.tab-panel {
  height: 100%;
}

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

.notes-textarea {
  width: 100%;
  min-height: 180px;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface-input);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
}

.btn-save-note {
  padding: 0.35rem 0.8rem;
  border-radius: var(--radius-md);
  background: var(--color-physics);
  color: var(--text-inverse);
  font-size: 0.8rem;
  font-weight: 600;
}

@media (max-width: 1023px) {
  .experiment-workspace {
    grid-template-columns: 1fr;
  }
  .desktop-only {
    display: none;
  }
}
</style>
