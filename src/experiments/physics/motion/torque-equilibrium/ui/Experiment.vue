<template>
  <div class="torque-experiment">
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

    <!-- Main Visual Stage & Controls -->
    <div class="experiment-workspace">
      <!-- Left/Main Stage: Seesaw Canvas & Overlay Tools -->
      <div class="scene-container">
        <div class="canvas-mount">
          <SeesawCanvas
            ref="canvasViewRef"
            :state="currentState"
            :params="simulationParams"
            :mode="mode"
          />

          <!-- Floating Measurement Tools -->
          <RulerWidget v-if="showRuler" :visible="showRuler" @close="showRuler = false" />
          <StopwatchWidget v-if="showStopwatch" :visible="showStopwatch" @close="showStopwatch = false" />
        </div>
      </div>

      <!-- Desktop Sidebar Control Panel -->
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

          <!-- Variable Group 1: Left Mass Parameters -->
          <VariableGroup :title="$t('torqueEquilibrium.hud.tauLeft')">
            <UnitSlider
              id="m1"
              v-model="controls.m1"
              :label="$t('torqueEquilibrium.variables.m1')"
              unit="kg"
              :min="0.5"
              :max="20.0"
              :step="0.5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="x1"
              v-model="controls.x1"
              :label="$t('torqueEquilibrium.variables.x1')"
              unit="m"
              :min="-3.0"
              :max="-0.2"
              :step="0.1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Variable Group 2: Right Mass Parameters -->
          <VariableGroup :title="$t('torqueEquilibrium.hud.tauRight')">
            <UnitSlider
              id="m2"
              v-model="controls.m2"
              :label="$t('torqueEquilibrium.variables.m2')"
              unit="kg"
              :min="0.5"
              :max="20.0"
              :step="0.5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="x2"
              v-model="controls.x2"
              :label="$t('torqueEquilibrium.variables.x2')"
              unit="m"
              :min="0.2"
              :max="3.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Variable Group 3: Beam & Fulcrum Physics -->
          <VariableGroup :title="$t('torqueEquilibrium.variables.beamMass')">
            <UnitSlider
              id="beamMass"
              v-model="controls.beamMass"
              :label="$t('torqueEquilibrium.variables.beamMass')"
              unit="kg"
              :min="0.0"
              :max="20.0"
              :step="0.5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="pivotOffset"
              v-model="controls.pivotOffset"
              :label="$t('torqueEquilibrium.variables.pivotOffset')"
              unit="m"
              :min="-1.5"
              :max="1.5"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="mode === 'real'"
              id="friction"
              v-model="controls.friction"
              :label="$t('torqueEquilibrium.variables.friction')"
              unit="N·m·s"
              :min="0.0"
              :max="1.0"
              :step="0.05"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slots Persistence -->
          <SlotManager
            experiment-id="physics/motion/torque-equilibrium"
            :current-params="controls"
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

      <VariableGroup :title="$t('torqueEquilibrium.hud.tauLeft')">
        <UnitSlider
          id="m1-mobile"
          v-model="controls.m1"
          :label="$t('torqueEquilibrium.variables.m1')"
          unit="kg"
          :min="0.5"
          :max="20.0"
          :step="0.5"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="x1-mobile"
          v-model="controls.x1"
          :label="$t('torqueEquilibrium.variables.x1')"
          unit="m"
          :min="-3.0"
          :max="-0.2"
          :step="0.1"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('torqueEquilibrium.hud.tauRight')">
        <UnitSlider
          id="m2-mobile"
          v-model="controls.m2"
          :label="$t('torqueEquilibrium.variables.m2')"
          unit="kg"
          :min="0.5"
          :max="20.0"
          :step="0.5"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="x2-mobile"
          v-model="controls.x2"
          :label="$t('torqueEquilibrium.variables.x2')"
          unit="m"
          :min="0.2"
          :max="3.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('torqueEquilibrium.variables.beamMass')">
        <UnitSlider
          id="beamMass-mobile"
          v-model="controls.beamMass"
          :label="$t('torqueEquilibrium.variables.beamMass')"
          unit="kg"
          :min="0.0"
          :max="20.0"
          :step="0.5"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="pivotOffset-mobile"
          v-model="controls.pivotOffset"
          :label="$t('torqueEquilibrium.variables.pivotOffset')"
          unit="m"
          :min="-1.5"
          :max="1.5"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          v-if="mode === 'real'"
          id="friction-mobile"
          v-model="controls.friction"
          :label="$t('torqueEquilibrium.variables.friction')"
          unit="N·m·s"
          :min="0.0"
          :max="1.0"
          :step="0.05"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/motion/torque-equilibrium"
        :current-params="controls"
        :current-mode="mode"
        @load="onLoadSlot"
      />
    </BottomSheet>

    <!-- Bottom Data & Analysis Panel Tabs -->
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
            :comparison-runs="[]"
          />
        </div>

        <!-- Tab 2: Data Table -->
        <div v-show="activeTab === 'table'" class="tab-panel">
          <DataTable :series="series" />
        </div>

        <!-- Tab 3: Scientific Theory & Formulas -->
        <div v-show="activeTab === 'theory'" class="tab-panel">
          <FormulaPanel
            :title="$t('common.theory')"
            :formulas="formulaItems"
          />
        </div>

        <!-- Tab 4: Student Notes -->
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

        <!-- Tab 5: Guided Procedure Steps -->
        <div v-show="activeTab === 'guided'" class="tab-panel">
          <GuidedSteps :steps="guidedProcedureSteps" />
        </div>
      </div>
    </div>

    <!-- Export Report Modal -->
    <Modal
      :is-open="showExportModal"
      :title="$t('common.export')"
      size="lg"
      @close="showExportModal = false"
    >
      <ExportReport
        :title="$t('experiments.torqueEquilibrium.title')"
        :mode="mode"
        :params="controls"
        :results="calculatedResults"
        :results-rows="reportResultsRows"
        :variables-list="reportVariablesList"
        :notes="userNotes"
      />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import Toolbar from '@/shared/Toolbar.vue'
import UnitSlider from '@/shared/UnitSlider.vue'
import VariableGroup from '@/shared/VariableGroup.vue'
import GraphPanel from '@/shared/GraphPanel.vue'
import DataTable from '@/shared/DataTable.vue'
import FormulaPanel from '@/shared/FormulaPanel.vue'
import PresetPicker from '@/shared/PresetPicker.vue'
import SlotManager from '@/shared/SlotManager.vue'
import GuidedSteps from '@/shared/GuidedSteps.vue'
import BottomSheet from '@/shared/BottomSheet.vue'
import Modal from '@/shared/Modal.vue'
import ExportReport from '@/shared/ExportReport.vue'
import RulerWidget from '@/shared/ToolWidgets/RulerWidget.vue'
import StopwatchWidget from '@/shared/ToolWidgets/StopwatchWidget.vue'
import SeesawCanvas from '../view/SeesawCanvas.vue'
import type { DataSeries, FormulaItem, PresetOption, LabStep } from '@/shared/types'
import type { ExperimentPresetDef } from '@/experiments/registry'
import {
  createTorqueModel,
  stepTorqueModel,
  computeTorqueAnalytical,
  type TorqueEquilibriumState,
  type TorqueEquilibriumParams,
} from '../model/torque'
import { torqueEquilibriumConfig } from '../config'
import { db, type StoredSlot } from '@/db'

const { t } = useI18n()

// User control variables
const controls = reactive<Record<string, number>>({
  m1: 4.0,
  x1: -1.5,
  m2: 2.0,
  x2: 3.0,
  beamMass: 4.0,
  pivotOffset: 0.0,
  friction: 0.2,
})

const mode = ref<'ideal' | 'real'>('ideal')
const isRunning = ref(false)
const speed = ref(1.0)
const currentPresetId = ref('perfect-balance')
const activeTab = ref('graph')

// Tool states
const showRuler = ref(false)
const showStopwatch = ref(false)
const showExportModal = ref(false)
const userNotes = ref('')

// Compute full physics parameters structure
const simulationParams = computed<TorqueEquilibriumParams>(() => ({
  beamLength: 6.0,
  beamMass: controls.beamMass,
  pivotOffset: controls.pivotOffset,
  g: 9.80665,
  maxAngleDeg: 20,
  friction: controls.friction,
  loads: [
    { id: '1', mass: controls.m1, x: controls.x1 },
    { id: '2', mass: controls.m2, x: controls.x2 },
  ],
  isRealMode: mode.value === 'real',
}))

// State
let currentState = reactive<TorqueEquilibriumState>(createTorqueModel(simulationParams.value))

// Data series for Graph and Table
const series = reactive<DataSeries>({
  t: [0],
  x: [0],
  y: [0],
  vx: [currentState.leftTorque],
  vy: [currentState.rightTorque],
  v: [currentState.netTorque],
})

// Tab configuration
const bottomTabs = computed(() => [
  { id: 'graph', label: `📊 ${t('common.graph')}` },
  { id: 'table', label: `📋 ${t('common.table')}` },
  { id: 'theory', label: `📐 ${t('common.theory')}` },
  { id: 'notes', label: `📝 ${t('common.notes')}` },
  { id: 'guided', label: `🎯 ${t('common.guided')}` },
])

// Analytical Reference
const analyticalPrediction = computed(() => {
  return computeTorqueAnalytical(simulationParams.value)
})

// Presets
const presetOptions = computed<PresetOption[]>(() =>
  torqueEquilibriumConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }))
)

// Guided steps
const guidedProcedureSteps = computed<LabStep[]>(() => [
  {
    id: 'step1',
    title: t('torqueEquilibrium.guided.step1Title'),
    instruction: t('torqueEquilibrium.guided.step1Desc'),
  },
  {
    id: 'step2',
    title: t('torqueEquilibrium.guided.step2Title'),
    instruction: t('torqueEquilibrium.guided.step2Desc'),
  },
  {
    id: 'step3',
    title: t('torqueEquilibrium.guided.step3Title'),
    instruction: t('torqueEquilibrium.guided.step3Desc'),
  },
])

// Theory Formulas
const formulaItems = computed<FormulaItem[]>(() => [
  {
    title: t('torqueEquilibrium.formulas.torqueDef'),
    latex: '\\tau = x \\cdot (m \\cdot g)',
    liveValue: `\\tau_1 = ${currentState.leftTorque.toFixed(1)} \\text{ N·m}, \\tau_2 = ${currentState.rightTorque.toFixed(1)} \\text{ N·m}`,
  },
  {
    title: t('torqueEquilibrium.formulas.equilibriumLaw'),
    latex: '\\sum \\tau = \\tau_2 - \\tau_1 = 0',
    liveValue: `\\tau_{\\text{net}} = ${currentState.netTorque.toFixed(2)} \\text{ N·m}`,
  },
  {
    title: t('torqueEquilibrium.formulas.archimedesLaw'),
    latex: 'm_1 |x_1| = m_2 x_2',
    liveValue: `${controls.m1} \\times ${Math.abs(controls.x1).toFixed(1)} = ${(controls.m1 * Math.abs(controls.x1)).toFixed(1)} \\text{ vs } ${controls.m2} \\times ${controls.x2.toFixed(1)} = ${(controls.m2 * controls.x2).toFixed(1)}`,
  },
  {
    title: t('torqueEquilibrium.formulas.rotationalDynamics'),
    latex: '\\tau_{\\text{net}} = I \\cdot \\alpha',
    liveValue: `I = ${currentState.momentOfInertia.toFixed(2)} \\text{ kg·m}^2, \\alpha = ${currentState.alpha.toFixed(2)} \\text{ rad/s}^2`,
  },
])

// Report Variables & Results
const reportVariablesList = computed(() => [
  { name: t('torqueEquilibrium.variables.m1'), symbol: 'm₁', value: controls.m1, unit: 'kg' },
  { name: t('torqueEquilibrium.variables.x1'), symbol: 'x₁', value: controls.x1, unit: 'm' },
  { name: t('torqueEquilibrium.variables.m2'), symbol: 'm₂', value: controls.m2, unit: 'kg' },
  { name: t('torqueEquilibrium.variables.x2'), symbol: 'x₂', value: controls.x2, unit: 'm' },
  { name: t('torqueEquilibrium.variables.beamMass'), symbol: 'M_beam', value: controls.beamMass, unit: 'kg' },
])

const reportResultsRows = computed(() => [
  { name: t('torqueEquilibrium.hud.tauLeft'), simulated: `${currentState.leftTorque.toFixed(1)} N·m`, theoretical: `${analyticalPrediction.value.leftTorque.toFixed(1)} N·m` },
  { name: t('torqueEquilibrium.hud.tauRight'), simulated: `${currentState.rightTorque.toFixed(1)} N·m`, theoretical: `${analyticalPrediction.value.rightTorque.toFixed(1)} N·m` },
  { name: t('torqueEquilibrium.hud.tauNet'), simulated: `${currentState.netTorque.toFixed(2)} N·m`, theoretical: `${analyticalPrediction.value.netTorque.toFixed(2)} N·m` },
  { name: t('torqueEquilibrium.hud.supportForce'), simulated: `${currentState.pivotSupportForce.toFixed(1)} N`, theoretical: `${analyticalPrediction.value.totalSupportForce.toFixed(1)} N` },
  { name: t('torqueEquilibrium.hud.angle'), simulated: `${((currentState.theta * 180) / Math.PI).toFixed(1)}°`, theoretical: analyticalPrediction.value.isBalanced ? '0.0°' : 'Tilted' },
])

const calculatedResults = computed(() => ({
  maxHeight: currentState.rightTorque,
  range: currentState.leftTorque,
  flightTime: currentState.t,
  analyticalRange: analyticalPrediction.value.netTorque,
  rangeErrorPercent: 0,
}))

// Animation loop
let lastFrameTime = performance.now()
let animReq: number | null = null

function loop(now: number) {
  if (isRunning.value) {
    const rawDt = (now - lastFrameTime) / 1000
    lastFrameTime = now
    const safeDt = Math.min(rawDt, 0.1) * speed.value
    stepSimulationDt(safeDt)
  } else {
    lastFrameTime = now
  }
  animReq = requestAnimationFrame(loop)
}

function stepSimulationDt(dt: number) {
  const next = stepTorqueModel(currentState, simulationParams.value, dt)
  Object.assign(currentState, next)

  // Append series record (x: angle deg, vx: leftTorque, vy: rightTorque, v: netTorque)
  const angleDeg = (currentState.theta * 180) / Math.PI
  series.t.push(currentState.t)
  series.x.push(angleDeg)
  series.y.push(0)
  series.vx.push(currentState.leftTorque)
  series.vy.push(currentState.rightTorque)
  series.v.push(currentState.netTorque)

  // Cap max points
  if (series.t.length > 500) {
    series.t.shift()
    series.x.shift()
    series.y.shift()
    series.vx.shift()
    series.vy.shift()
    series.v.shift()
  }
}

function togglePlay() {
  isRunning.value = !isRunning.value
  lastFrameTime = performance.now()
}

function stepSimulation() {
  stepSimulationDt(0.02)
}

function resetSimulation() {
  isRunning.value = false
  const fresh = createTorqueModel(simulationParams.value)
  Object.assign(currentState, fresh)

  series.t = [0]
  series.x = [0]
  series.y = [0]
  series.vx = [fresh.leftTorque]
  series.vy = [fresh.rightTorque]
  series.v = [fresh.netTorque]
}

function setSpeed(val: number) {
  speed.value = val
}

function setMode(newMode: 'ideal' | 'real') {
  mode.value = newMode
  resetSimulation()
}

function onParamChange() {
  currentPresetId.value = 'custom'
  resetSimulation()
}

function applyPreset(preset: PresetOption) {
  currentPresetId.value = preset.id
  Object.assign(controls, preset.params)
  resetSimulation()
}

function onLoadSlot(slot: StoredSlot) {
  if (slot.params) Object.assign(controls, slot.params)
  if (slot.mode) setMode(slot.mode)
  resetSimulation()
}

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/motion/torque-equilibrium').first()
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      })
    } else {
      await db.notes.add({
        experimentId: 'physics/motion/torque-equilibrium',
        content: userNotes.value,
        updatedAt: Date.now(),
      })
    }
  } catch (e) {
    console.error('Failed to save notes:', e)
  }
}

async function loadNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/motion/torque-equilibrium').first()
    if (existing) {
      userNotes.value = existing.content
    }
  } catch (e) {
    console.warn('Could not load notes:', e)
  }
}

onMounted(() => {
  resetSimulation()
  loadNotes()
  lastFrameTime = performance.now()
  animReq = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  if (animReq) cancelAnimationFrame(animReq)
})
</script>

<style scoped>
.torque-experiment {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--bg-scene);
}

.experiment-workspace {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.scene-container {
  flex: 1;
  min-width: 0;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.canvas-mount {
  width: 100%;
  height: 100%;
  position: relative;
}

.control-sidebar {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--surface-glass);
  backdrop-filter: blur(12px);
  border-inline-start: 1px solid var(--border-color);
  z-index: 10;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-color);
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.bottom-tabs-section {
  display: flex;
  flex-direction: column;
  height: 280px;
  flex-shrink: 0;
  border-top: 1px solid var(--border-color);
  overflow: hidden;
}

.tabs-nav {
  display: flex;
  background: rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
}

.tab-btn {
  padding: 0.625rem 1.25rem;
  background: transparent;
  border: none;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-color);
}

.tab-btn.active {
  color: var(--accent-physics);
  border-bottom-color: var(--accent-physics);
}

.tab-content-area {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.tab-panel {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.notes-tab {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  height: 100%;
  box-sizing: border-box;
}

.notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.notes-header h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-color);
}

.btn-save-note {
  padding: 0.375rem 0.75rem;
  background: var(--surface-glass);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8125rem;
}

.notes-textarea {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  background: var(--surface-glass);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  color: var(--text-color);
  font-family: inherit;
  font-size: 0.875rem;
  resize: none;
}

@media (max-width: 1023px) {
  .desktop-only {
    display: none !important;
  }
  .bottom-tabs-section {
    height: 240px;
  }
}

@media (min-width: 1024px) {
  .mobile-only {
    display: none !important;
  }
}
</style>
