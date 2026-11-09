<template>
  <div class="pendulum-experiment">
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
      <!-- Left/Main Stage: Pendulum Canvas & Overlay Tools -->
      <div class="scene-container">
        <div class="canvas-mount">
          <PendulumsCanvas
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
          <!-- Pendulum Type Selector (Simple vs Double) -->
          <div class="type-toggle-group">
            <button
              type="button"
              class="type-btn"
              :class="{ active: pendulumType === 'simple' }"
              @click="setPendulumType('simple')"
            >
              🎯 {{ $t('pendulums.hud.simple') }}
            </button>
            <button
              type="button"
              class="type-btn"
              :class="{ active: pendulumType === 'double' }"
              @click="setPendulumType('double')"
            >
              🌀 {{ $t('pendulums.hud.double') }}
            </button>
          </div>

          <!-- Preset Picker -->
          <PresetPicker
            :presets="presetOptions"
            :current-preset="currentPresetId"
            @select="applyPreset"
          />

          <!-- Variable Group 1: Arm 1 Parameters -->
          <VariableGroup :title="$t('pendulums.variables.l1')">
            <UnitSlider
              id="l1"
              v-model="controls.l1"
              :label="$t('pendulums.variables.l1')"
              unit="m"
              :min="0.2"
              :max="3.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="m1"
              v-model="controls.m1"
              :label="$t('pendulums.variables.m1')"
              unit="kg"
              :min="0.1"
              :max="10.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="theta1Deg"
              v-model="controls.theta1Deg"
              :label="$t('pendulums.variables.theta1')"
              unit="°"
              :min="-170"
              :max="170"
              :step="1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Variable Group 2: Arm 2 (Double Mode only) -->
          <VariableGroup v-if="pendulumType === 'double'" :title="$t('pendulums.variables.l2')">
            <UnitSlider
              id="l2"
              v-model="controls.l2"
              :label="$t('pendulums.variables.l2')"
              unit="m"
              :min="0.2"
              :max="3.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="m2"
              v-model="controls.m2"
              :label="$t('pendulums.variables.m2')"
              unit="kg"
              :min="0.1"
              :max="10.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="theta2Deg"
              v-model="controls.theta2Deg"
              :label="$t('pendulums.variables.theta2')"
              unit="°"
              :min="-170"
              :max="170"
              :step="1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Variable Group 3: Real Mode Effects -->
          <VariableGroup v-if="mode === 'real'" :title="$t('pendulums.variables.damping')">
            <UnitSlider
              id="damping"
              v-model="controls.damping"
              :label="$t('pendulums.variables.damping')"
              unit="N·s/m"
              :min="0.0"
              :max="1.0"
              :step="0.02"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slots Persistence -->
          <SlotManager
            experiment-id="physics/motion/pendulums"
            :current-params="controls"
            :current-mode="mode"
            @load="onLoadSlot"
          />
        </div>
      </aside>
    </div>

    <!-- Mobile BottomSheet Controls -->
    <BottomSheet class="mobile-only" :title="$t('common.controls')">
      <div class="type-toggle-group">
        <button
          type="button"
          class="type-btn"
          :class="{ active: pendulumType === 'simple' }"
          @click="setPendulumType('simple')"
        >
          🎯 {{ $t('pendulums.hud.simple') }}
        </button>
        <button
          type="button"
          class="type-btn"
          :class="{ active: pendulumType === 'double' }"
          @click="setPendulumType('double')"
        >
          🌀 {{ $t('pendulums.hud.double') }}
        </button>
      </div>

      <PresetPicker
        :presets="presetOptions"
        :current-preset="currentPresetId"
        @select="applyPreset"
      />

      <VariableGroup :title="$t('pendulums.variables.l1')">
        <UnitSlider
          id="l1-m"
          v-model="controls.l1"
          :label="$t('pendulums.variables.l1')"
          unit="m"
          :min="0.2"
          :max="3.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m1-m"
          v-model="controls.m1"
          :label="$t('pendulums.variables.m1')"
          unit="kg"
          :min="0.1"
          :max="10.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="theta1Deg-m"
          v-model="controls.theta1Deg"
          :label="$t('pendulums.variables.theta1')"
          unit="°"
          :min="-170"
          :max="170"
          :step="1"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup v-if="pendulumType === 'double'" :title="$t('pendulums.variables.l2')">
        <UnitSlider
          id="l2-m"
          v-model="controls.l2"
          :label="$t('pendulums.variables.l2')"
          unit="m"
          :min="0.2"
          :max="3.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="m2-m"
          v-model="controls.m2"
          :label="$t('pendulums.variables.m2')"
          unit="kg"
          :min="0.1"
          :max="10.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="theta2Deg-m"
          v-model="controls.theta2Deg"
          :label="$t('pendulums.variables.theta2')"
          unit="°"
          :min="-170"
          :max="170"
          :step="1"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup v-if="mode === 'real'" :title="$t('pendulums.variables.damping')">
        <UnitSlider
          id="damping-m"
          v-model="controls.damping"
          :label="$t('pendulums.variables.damping')"
          unit="N·s/m"
          :min="0.0"
          :max="1.0"
          :step="0.02"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/motion/pendulums"
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
        :title="$t('experiments.pendulums.title')"
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
import PendulumsCanvas from '../view/PendulumsCanvas.vue'
import type { DataSeries, FormulaItem, PresetOption, LabStep } from '@/shared/types'
import type { ExperimentPresetDef } from '@/experiments/registry'
import {
  createPendulumModel,
  stepPendulumModel,
  computeSimplePendulumAnalyticalPeriod,
  type PendulumState,
  type PendulumParams,
  type PendulumType,
} from '../model/pendulum'
import { pendulumsConfig } from '../config'
import { db, type StoredSlot } from '@/db'

const { t } = useI18n()

const pendulumType = ref<PendulumType>('simple')

// User controls
const controls = reactive<Record<string, number>>({
  l1: 1.0,
  m1: 1.0,
  theta1Deg: 30,
  l2: 1.0,
  m2: 1.0,
  theta2Deg: 45,
  damping: 0.05,
})

const mode = ref<'ideal' | 'real'>('ideal')
const isRunning = ref(false)
const speed = ref(1.0)
const currentPresetId = ref('simple-harmonic')
const activeTab = ref('graph')

// Tool states
const showRuler = ref(false)
const showStopwatch = ref(false)
const showExportModal = ref(false)
const userNotes = ref('')

// Compute full physics parameters structure
const simulationParams = computed<PendulumParams>(() => ({
  type: pendulumType.value,
  l1: controls.l1,
  m1: controls.m1,
  theta1: (controls.theta1Deg * Math.PI) / 180,
  omega1: 0,
  l2: controls.l2,
  m2: controls.m2,
  theta2: (controls.theta2Deg * Math.PI) / 180,
  omega2: 0,
  g: 9.80665,
  damping: controls.damping,
  isRealMode: mode.value === 'real',
}))

// State
let currentState = reactive<PendulumState>(createPendulumModel(simulationParams.value))

// Data series for Graph and Table
const series = reactive<DataSeries>({
  t: [0],
  x: [currentState.x1],
  y: [currentState.y1],
  vx: [((currentState.theta1 * 180) / Math.PI)],
  vy: [((currentState.theta2 * 180) / Math.PI)],
  v: [currentState.totalEnergy],
})

// Tab configuration
const bottomTabs = computed(() => [
  { id: 'graph', label: `📊 ${t('common.graph')}` },
  { id: 'table', label: `📋 ${t('common.table')}` },
  { id: 'theory', label: `📐 ${t('common.theory')}` },
  { id: 'notes', label: `📝 ${t('common.notes')}` },
  { id: 'guided', label: `🎯 ${t('common.guided')}` },
])

// Analytical Period
const analyticalT = computed(() => {
  return computeSimplePendulumAnalyticalPeriod(controls.l1, 9.80665, (controls.theta1Deg * Math.PI) / 180)
})

// Presets
const presetOptions = computed<PresetOption[]>(() =>
  pendulumsConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }))
)

// Guided steps
const guidedProcedureSteps = computed<LabStep[]>(() => [
  {
    id: 'step1',
    title: t('pendulums.guided.step1Title'),
    instruction: t('pendulums.guided.step1Desc'),
  },
  {
    id: 'step2',
    title: t('pendulums.guided.step2Title'),
    instruction: t('pendulums.guided.step2Desc'),
  },
  {
    id: 'step3',
    title: t('pendulums.guided.step3Title'),
    instruction: t('pendulums.guided.step3Desc'),
  },
])

// Theory Formulas
const formulaItems = computed<FormulaItem[]>(() => [
  {
    title: t('pendulums.formulas.simplePeriod'),
    latex: 'T_0 = 2\\pi \\sqrt{\\frac{L}{g}}',
    liveValue: `T_0 = ${(2 * Math.PI * Math.sqrt(controls.l1 / 9.80665)).toFixed(3)} s`,
  },
  {
    title: t('pendulums.formulas.bordaPeriod'),
    latex: 'T \\approx T_0 \\left(1 + \\frac{1}{16}\\theta_0^2\\right)',
    liveValue: `T = ${analyticalT.value.toFixed(3)} s`,
  },
  {
    title: t('pendulums.formulas.energy'),
    latex: 'E = K + U = \\text{const}',
    liveValue: `E = ${currentState.totalEnergy.toFixed(2)} J (U = ${currentState.pe.toFixed(2)} J, K = ${currentState.ke.toFixed(2)} J)`,
  },
  {
    title: t('pendulums.formulas.lagrangian'),
    latex: '\\frac{d}{dt}\\frac{\\partial L}{\\partial \\dot{\\theta}_i} - \\frac{\\partial L}{\\partial \\theta_i} = 0',
    liveValue: `\\theta_1 = ${((currentState.theta1 * 180) / Math.PI).toFixed(1)}°${pendulumType.value === 'double' ? `, \\theta_2 = ${((currentState.theta2 * 180) / Math.PI).toFixed(1)}°` : ''}`,
  },
])

// Report Variables & Results
const reportVariablesList = computed(() => [
  { name: t('pendulums.variables.l1'), symbol: 'L₁', value: controls.l1, unit: 'm' },
  { name: t('pendulums.variables.m1'), symbol: 'm₁', value: controls.m1, unit: 'kg' },
  { name: t('pendulums.variables.theta1'), symbol: 'θ₁', value: controls.theta1Deg, unit: '°' },
  { name: t('pendulums.variables.l2'), symbol: 'L₂', value: controls.l2, unit: 'm' },
  { name: t('pendulums.variables.m2'), symbol: 'm₂', value: controls.m2, unit: 'kg' },
])

const reportResultsRows = computed(() => [
  { name: t('pendulums.hud.period'), simulated: `${analyticalT.value.toFixed(3)} s`, theoretical: `${(2 * Math.PI * Math.sqrt(controls.l1 / 9.80665)).toFixed(3)} s` },
  { name: t('pendulums.hud.energy'), simulated: `${currentState.totalEnergy.toFixed(2)} J`, theoretical: `${currentState.initialEnergy.toFixed(2)} J` },
  { name: t('pendulums.hud.theta1'), simulated: `${((currentState.theta1 * 180) / Math.PI).toFixed(1)}°`, theoretical: '—' },
])

const calculatedResults = computed(() => ({
  maxHeight: currentState.pe,
  range: currentState.totalEnergy,
  flightTime: currentState.t,
  analyticalRange: analyticalT.value,
  rangeErrorPercent: 0,
}))

// Animation loop
let lastFrameTime = performance.now()
let animReq: number | null = null

function loop(now: number) {
  if (isRunning.value) {
    const rawDt = (now - lastFrameTime) / 1000
    lastFrameTime = now
    const safeDt = Math.min(rawDt, 0.05) * speed.value
    stepSimulationDt(safeDt)
  } else {
    lastFrameTime = now
  }
  animReq = requestAnimationFrame(loop)
}

function stepSimulationDt(dt: number) {
  const next = stepPendulumModel(currentState, simulationParams.value, dt)
  Object.assign(currentState, next)

  // Append series record
  series.t.push(currentState.t)
  series.x.push(currentState.x1)
  series.y.push(currentState.y1)
  series.vx.push((currentState.theta1 * 180) / Math.PI)
  series.vy.push((currentState.theta2 * 180) / Math.PI)
  series.v.push(currentState.totalEnergy)

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

function setPendulumType(type: PendulumType) {
  pendulumType.value = type
  resetSimulation()
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
  const fresh = createPendulumModel(simulationParams.value)
  Object.assign(currentState, fresh)

  series.t = [0]
  series.x = [fresh.x1]
  series.y = [fresh.y1]
  series.vx = [(fresh.theta1 * 180) / Math.PI]
  series.vy = [(fresh.theta2 * 180) / Math.PI]
  series.v = [fresh.totalEnergy]
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
  if (preset.id === 'double-chaos' || preset.id === 'inverted-instability') {
    pendulumType.value = 'double'
  } else {
    pendulumType.value = 'simple'
  }
  resetSimulation()
}

function onLoadSlot(slot: StoredSlot) {
  if (slot.params) Object.assign(controls, slot.params)
  if (slot.mode) setMode(slot.mode)
  resetSimulation()
}

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/motion/pendulums').first()
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      })
    } else {
      await db.notes.add({
        experimentId: 'physics/motion/pendulums',
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
    const existing = await db.notes.where('experimentId').equals('physics/motion/pendulums').first()
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
.pendulum-experiment {
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

.type-toggle-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.25rem;
  border-radius: var(--radius-md);
}

.type-btn {
  padding: 0.5rem;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn.active {
  background: var(--surface-card);
  color: var(--accent-physics);
  box-shadow: var(--shadow-sm);
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
