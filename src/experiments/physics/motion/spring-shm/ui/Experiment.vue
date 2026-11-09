<template>
  <div class="spring-experiment">
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
      <!-- Left/Main Stage: Spring Canvas & Overlay Tools -->
      <div class="scene-container">
        <div class="canvas-mount">
          <SpringCanvas
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

          <!-- Variable Group 1: Spring & Load Parameters -->
          <VariableGroup :title="$t('springShm.variables.k')">
            <UnitSlider
              id="k"
              v-model="controls.k"
              :label="$t('springShm.variables.k')"
              unit="N/m"
              :min="5.0"
              :max="200.0"
              :step="5.0"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="mass"
              v-model="controls.mass"
              :label="$t('springShm.variables.mass')"
              unit="kg"
              :min="0.2"
              :max="10.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="initialX"
              v-model="controls.initialX"
              :label="$t('springShm.variables.initialX')"
              unit="m"
              :min="-1.0"
              :max="1.0"
              :step="0.05"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Variable Group 2: Damping & Real Effects -->
          <VariableGroup v-if="mode === 'real'" :title="$t('springShm.variables.damping')">
            <UnitSlider
              id="damping"
              v-model="controls.damping"
              :label="$t('springShm.variables.damping')"
              unit="N·s/m"
              :min="0.0"
              :max="5.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Variable Group 3: Periodic Driving & Resonance -->
          <VariableGroup :title="$t('springShm.variables.driveAmp')">
            <UnitSlider
              id="driveAmp"
              v-model="controls.driveAmp"
              :label="$t('springShm.variables.driveAmp')"
              unit="N"
              :min="0.0"
              :max="20.0"
              :step="0.5"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="driveFreq"
              v-model="controls.driveFreq"
              :label="$t('springShm.variables.driveFreq')"
              unit="Hz"
              :min="0.1"
              :max="5.0"
              :step="0.05"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slots Persistence -->
          <SlotManager
            experiment-id="physics/motion/spring-shm"
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

      <VariableGroup :title="$t('springShm.variables.k')">
        <UnitSlider
          id="k-m"
          v-model="controls.k"
          :label="$t('springShm.variables.k')"
          unit="N/m"
          :min="5.0"
          :max="200.0"
          :step="5.0"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="mass-m"
          v-model="controls.mass"
          :label="$t('springShm.variables.mass')"
          unit="kg"
          :min="0.2"
          :max="10.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="initialX-m"
          v-model="controls.initialX"
          :label="$t('springShm.variables.initialX')"
          unit="m"
          :min="-1.0"
          :max="1.0"
          :step="0.05"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup v-if="mode === 'real'" :title="$t('springShm.variables.damping')">
        <UnitSlider
          id="damping-m"
          v-model="controls.damping"
          :label="$t('springShm.variables.damping')"
          unit="N·s/m"
          :min="0.0"
          :max="5.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('springShm.variables.driveAmp')">
        <UnitSlider
          id="driveAmp-m"
          v-model="controls.driveAmp"
          :label="$t('springShm.variables.driveAmp')"
          unit="N"
          :min="0.0"
          :max="20.0"
          :step="0.5"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="driveFreq-m"
          v-model="controls.driveFreq"
          :label="$t('springShm.variables.driveFreq')"
          unit="Hz"
          :min="0.1"
          :max="5.0"
          :step="0.05"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/motion/spring-shm"
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
        :title="$t('experiments.springShm.title')"
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
import SpringCanvas from '../view/SpringCanvas.vue'
import type { DataSeries, FormulaItem, PresetOption, LabStep } from '@/shared/types'
import type { ExperimentPresetDef } from '@/experiments/registry'
import {
  createSpringModel,
  stepSpringModel,
  computeSpringAnalytical,
  type SpringState,
  type SpringParams,
} from '../model/spring'
import { springShmConfig } from '../config'
import { db, type StoredSlot } from '@/db'

const { t } = useI18n()

// User control variables
const controls = reactive<Record<string, number>>({
  mass: 1.0,
  k: 40.0,
  initialX: 0.5,
  damping: 0.3,
  driveAmp: 0.0,
  driveFreq: 1.0,
})

const mode = ref<'ideal' | 'real'>('ideal')
const isRunning = ref(false)
const speed = ref(1.0)
const currentPresetId = ref('undamped-simple')
const activeTab = ref('graph')

// Tool states
const showRuler = ref(false)
const showStopwatch = ref(false)
const showExportModal = ref(false)
const userNotes = ref('')

// Compute full physics parameters structure
const simulationParams = computed<SpringParams>(() => ({
  mass: controls.mass,
  k: controls.k,
  damping: controls.damping,
  driveAmp: controls.driveAmp,
  driveFreq: controls.driveFreq,
  initialX: controls.initialX,
  initialV: 0.0,
  isRealMode: mode.value === 'real',
}))

// State
let currentState = reactive<SpringState>(createSpringModel(simulationParams.value))

// Data series for Graph and Table
const series = reactive<DataSeries>({
  t: [0],
  x: [currentState.x],
  y: [0],
  vx: [currentState.v],
  vy: [currentState.a],
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

// Analytical Calculations
const analytical = computed(() => {
  return computeSpringAnalytical(simulationParams.value)
})

// Presets
const presetOptions = computed<PresetOption[]>(() =>
  springShmConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }))
)

// Guided steps
const guidedProcedureSteps = computed<LabStep[]>(() => [
  {
    id: 'step1',
    title: t('springShm.guided.step1Title'),
    instruction: t('springShm.guided.step1Desc'),
  },
  {
    id: 'step2',
    title: t('springShm.guided.step2Title'),
    instruction: t('springShm.guided.step2Desc'),
  },
  {
    id: 'step3',
    title: t('springShm.guided.step3Title'),
    instruction: t('springShm.guided.step3Desc'),
  },
])

// Theory Formulas
const formulaItems = computed<FormulaItem[]>(() => [
  {
    title: t('springShm.formulas.hookeLaw'),
    latex: 'F_s = -k \\cdot x',
    liveValue: `F_s = ${currentState.fSpring.toFixed(1)} N`,
  },
  {
    title: t('springShm.formulas.periodFormula'),
    latex: 'T_0 = 2\\pi \\sqrt{\\frac{m}{k}}, \\quad \\omega_0 = \\sqrt{\\frac{k}{m}}',
    liveValue: `T_0 = ${analytical.value.period0.toFixed(3)} s, \\omega_0 = ${analytical.value.omega0.toFixed(2)} rad/s, f_0 = ${analytical.value.f0.toFixed(2)} Hz`,
  },
  {
    title: t('springShm.formulas.energy'),
    latex: 'E = \\frac{1}{2}k x^2 + \\frac{1}{2}m v^2 = \\text{const}',
    liveValue: `E = ${currentState.totalEnergy.toFixed(2)} J (U = ${currentState.pe.toFixed(2)} J, K = ${currentState.ke.toFixed(2)} J)`,
  },
  {
    title: t('springShm.formulas.resonanceEq'),
    latex: 'A_{\\text{res}} \\implies f_{\\text{drive}} = f_0',
    liveValue: `f_{\\text{drive}} = ${controls.driveFreq.toFixed(2)} Hz, f_{\\text{res}} = ${analytical.value.resFreqHz.toFixed(2)} Hz`,
  },
])

// Report Variables & Results
const reportVariablesList = computed(() => [
  { name: t('springShm.variables.mass'), symbol: 'm', value: controls.mass, unit: 'kg' },
  { name: t('springShm.variables.k'), symbol: 'k', value: controls.k, unit: 'N/m' },
  { name: t('springShm.variables.initialX'), symbol: 'x₀', value: controls.initialX, unit: 'm' },
  { name: t('springShm.variables.damping'), symbol: 'c', value: controls.damping, unit: 'N·s/m' },
  { name: t('springShm.variables.driveAmp'), symbol: 'F₀', value: controls.driveAmp, unit: 'N' },
  { name: t('springShm.variables.driveFreq'), symbol: 'f_drive', value: controls.driveFreq, unit: 'Hz' },
])

const reportResultsRows = computed(() => [
  { name: t('springShm.hud.freq0'), simulated: `${analytical.value.f0.toFixed(2)} Hz`, theoretical: `${(Math.sqrt(controls.k / controls.mass) / (2 * Math.PI)).toFixed(2)} Hz` },
  { name: t('springShm.hud.energy'), simulated: `${currentState.totalEnergy.toFixed(2)} J`, theoretical: `${(0.5 * controls.k * controls.initialX * controls.initialX).toFixed(2)} J` },
  { name: t('springShm.hud.displacement'), simulated: `${(currentState.x * 100).toFixed(1)} cm`, theoretical: '—' },
  { name: t('springShm.hud.velocity'), simulated: `${currentState.v.toFixed(2)} m/s`, theoretical: '—' },
])

const calculatedResults = computed(() => ({
  maxHeight: currentState.pe,
  range: currentState.totalEnergy,
  flightTime: currentState.t,
  analyticalRange: analytical.value.period0,
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
  const next = stepSpringModel(currentState, simulationParams.value, dt)
  Object.assign(currentState, next)

  // Append series record (x: displacement m, vx: velocity m/s, vy: acceleration m/s^2, v: energy J)
  series.t.push(currentState.t)
  series.x.push(currentState.x)
  series.y.push(0)
  series.vx.push(currentState.v)
  series.vy.push(currentState.a)
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

function togglePlay() {
  isRunning.value = !isRunning.value
  lastFrameTime = performance.now()
}

function stepSimulation() {
  stepSimulationDt(0.02)
}

function resetSimulation() {
  isRunning.value = false
  const fresh = createSpringModel(simulationParams.value)
  Object.assign(currentState, fresh)

  series.t = [0]
  series.x = [fresh.x]
  series.y = [0]
  series.vx = [fresh.v]
  series.vy = [fresh.a]
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
  resetSimulation()
}

function onLoadSlot(slot: StoredSlot) {
  if (slot.params) Object.assign(controls, slot.params)
  if (slot.mode) setMode(slot.mode)
  resetSimulation()
}

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/motion/spring-shm').first()
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      })
    } else {
      await db.notes.add({
        experimentId: 'physics/motion/spring-shm',
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
    const existing = await db.notes.where('experimentId').equals('physics/motion/spring-shm').first()
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
.spring-experiment {
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
