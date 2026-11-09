<template>
  <div class="collisions-experiment">
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
      <!-- Left/Main Stage: Air Track Canvas & Overlay Tools -->
      <div class="scene-container">
        <div class="canvas-mount">
          <CollisionsCanvas
            ref="canvasViewRef"
            :state="currentState"
            :params="params"
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

          <!-- Variable Group 1: Cart 1 Parameters -->
          <VariableGroup :title="$t('collisionsMomentum.hud.v1')">
            <UnitSlider
              id="m1"
              v-model="params.m1"
              :label="$t('collisionsMomentum.variables.m1')"
              unit="kg"
              :min="0.1"
              :max="10.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="v1"
              v-model="params.v1"
              :label="$t('collisionsMomentum.variables.v1')"
              unit="m/s"
              :min="-10.0"
              :max="10.0"
              :step="0.2"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Variable Group 2: Cart 2 Parameters -->
          <VariableGroup :title="$t('collisionsMomentum.hud.v2')">
            <UnitSlider
              id="m2"
              v-model="params.m2"
              :label="$t('collisionsMomentum.variables.m2')"
              unit="kg"
              :min="0.1"
              :max="10.0"
              :step="0.1"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              id="v2"
              v-model="params.v2"
              :label="$t('collisionsMomentum.variables.v2')"
              unit="m/s"
              :min="-10.0"
              :max="10.0"
              :step="0.2"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Variable Group 3: Collision Physics -->
          <VariableGroup :title="$t('collisionsMomentum.variables.restitution')">
            <UnitSlider
              id="restitution"
              v-model="params.restitution"
              :label="$t('collisionsMomentum.variables.restitution')"
              unit=""
              :min="0.0"
              :max="1.0"
              :step="0.05"
              @update:model-value="onParamChange"
            />
            <UnitSlider
              v-if="mode === 'real'"
              id="friction"
              v-model="params.friction"
              :label="$t('collisionsMomentum.variables.friction')"
              unit="1/m"
              :min="0.0"
              :max="0.2"
              :step="0.01"
              @update:model-value="onParamChange"
            />
          </VariableGroup>

          <!-- Slots Persistence -->
          <SlotManager
            experiment-id="physics/motion/collisions-momentum"
            :current-params="numericParams"
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

      <VariableGroup :title="$t('collisionsMomentum.hud.v1')">
        <UnitSlider
          id="m1-mobile"
          v-model="params.m1"
          :label="$t('collisionsMomentum.variables.m1')"
          unit="kg"
          :min="0.1"
          :max="10.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="v1-mobile"
          v-model="params.v1"
          :label="$t('collisionsMomentum.variables.v1')"
          unit="m/s"
          :min="-10.0"
          :max="10.0"
          :step="0.2"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('collisionsMomentum.hud.v2')">
        <UnitSlider
          id="m2-mobile"
          v-model="params.m2"
          :label="$t('collisionsMomentum.variables.m2')"
          unit="kg"
          :min="0.1"
          :max="10.0"
          :step="0.1"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          id="v2-mobile"
          v-model="params.v2"
          :label="$t('collisionsMomentum.variables.v2')"
          unit="m/s"
          :min="-10.0"
          :max="10.0"
          :step="0.2"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <VariableGroup :title="$t('collisionsMomentum.variables.restitution')">
        <UnitSlider
          id="restitution-mobile"
          v-model="params.restitution"
          :label="$t('collisionsMomentum.variables.restitution')"
          unit=""
          :min="0.0"
          :max="1.0"
          :step="0.05"
          @update:model-value="onParamChange"
        />
        <UnitSlider
          v-if="mode === 'real'"
          id="friction-mobile"
          v-model="params.friction"
          :label="$t('collisionsMomentum.variables.friction')"
          unit="1/m"
          :min="0.0"
          :max="0.2"
          :step="0.01"
          @update:model-value="onParamChange"
        />
      </VariableGroup>

      <SlotManager
        experiment-id="physics/motion/collisions-momentum"
        :current-params="numericParams"
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
        :title="$t('experiments.collisionsMomentum.title')"
        :mode="mode"
        :params="numericParams"
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
import CollisionsCanvas from '../view/CollisionsCanvas.vue'
import type { DataSeries, FormulaItem, PresetOption, LabStep } from '@/shared/types'
import type { ExperimentPresetDef } from '@/experiments/registry'
import {
  createCollisionModel,
  stepCollisionModel,
  computeAnalyticalPostCollision,
  type CollisionSimulationState,
  type CollisionParams,
} from '../model/collisions'
import { collisionsConfig } from '../config'
import { db, type StoredSlot } from '@/db'

const { t } = useI18n()

// Core Simulation Parameters
const params = reactive<CollisionParams>({
  m1: 1.0,
  m2: 2.0,
  v1: 3.0,
  v2: 0.0,
  restitution: 1.0,
  cartWidth: 0.4,
  trackLength: 8.0,
  friction: 0.03,
  noiseLevel: 0.0,
  isRealMode: false,
})

const numericParams = computed<Record<string, number>>(() => ({
  m1: params.m1,
  m2: params.m2,
  v1: params.v1,
  v2: params.v2,
  restitution: params.restitution,
  cartWidth: params.cartWidth,
  trackLength: params.trackLength,
  friction: params.friction,
  noiseLevel: params.noiseLevel,
}))

const mode = ref<'ideal' | 'real'>('ideal')
const isRunning = ref(false)
const speed = ref(1.0)
const currentPresetId = ref('elastic-equal-masses')
const activeTab = ref('graph')

// Tool states
const showRuler = ref(false)
const showStopwatch = ref(false)
const showExportModal = ref(false)
const userNotes = ref('')

// State
let currentState = reactive<CollisionSimulationState>(createCollisionModel(params))

// Data series for Graph and Table
const series = reactive<DataSeries>({
  t: [0],
  x: [0.25 * 8.0],
  y: [0.65 * 8.0],
  vx: [3.0],
  vy: [0.0],
  v: [3.0],
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
  return computeAnalyticalPostCollision(params.m1, params.m2, params.v1, params.v2, params.restitution)
})

// Presets
const presetOptions = computed<PresetOption[]>(() =>
  collisionsConfig.presets.map((p: ExperimentPresetDef) => ({
    id: p.id,
    label: t(p.labelKey),
    params: p.params,
  }))
)

// Guided steps
const guidedProcedureSteps = computed<LabStep[]>(() => [
  {
    id: 'step1',
    title: t('collisionsMomentum.guided.step1Title'),
    instruction: t('collisionsMomentum.guided.step1Desc'),
  },
  {
    id: 'step2',
    title: t('collisionsMomentum.guided.step2Title'),
    instruction: t('collisionsMomentum.guided.step2Desc'),
  },
  {
    id: 'step3',
    title: t('collisionsMomentum.guided.step3Title'),
    instruction: t('collisionsMomentum.guided.step3Desc'),
  },
])

// Theory Formulas
const formulaItems = computed<FormulaItem[]>(() => [
  {
    title: t('collisionsMomentum.formulas.momentum'),
    latex: 'P_{\\text{tot}} = m_1 v_1 + m_2 v_2 = \\text{const}',
    liveValue: `${currentState.derived.pTotal.toFixed(2)} kg·m/s`,
  },
  {
    title: t('collisionsMomentum.formulas.restitution'),
    latex: 'e = -\\frac{v_2\' - v_1\'}{v_2 - v_1}',
    liveValue: `e = ${params.restitution.toFixed(2)}`,
  },
  {
    title: t('collisionsMomentum.formulas.v1Prime'),
    latex: 'v_1\' = \\frac{(m_1 - e m_2) v_1 + (1 + e) m_2 v_2}{m_1 + m_2}',
    liveValue: `v_1' = ${analyticalPrediction.value.v1Prime.toFixed(2)} m/s, v_2' = ${analyticalPrediction.value.v2Prime.toFixed(2)} m/s`,
  },
  {
    title: t('collisionsMomentum.formulas.kineticEnergy'),
    latex: 'E_k = \\frac{1}{2} m_1 v_1^2 + \\frac{1}{2} m_2 v_2^2',
    liveValue: `E_k = ${currentState.derived.keTotal.toFixed(2)} J (\\Delta E_k = ${currentState.derived.deltaKe.toFixed(2)} J)`,
  },
])

// Report Variables & Results
const reportVariablesList = computed(() => [
  { name: t('collisionsMomentum.variables.m1'), symbol: 'm₁', value: params.m1, unit: 'kg' },
  { name: t('collisionsMomentum.variables.m2'), symbol: 'm₂', value: params.m2, unit: 'kg' },
  { name: t('collisionsMomentum.variables.v1'), symbol: 'v₁', value: params.v1, unit: 'm/s' },
  { name: t('collisionsMomentum.variables.v2'), symbol: 'v₂', value: params.v2, unit: 'm/s' },
  { name: t('collisionsMomentum.variables.restitution'), symbol: 'e', value: params.restitution, unit: '—' },
])

const reportResultsRows = computed(() => [
  { name: t('collisionsMomentum.hud.pTotal'), simulated: `${currentState.derived.pTotal.toFixed(2)} kg·m/s`, theoretical: `${analyticalPrediction.value.pTotal.toFixed(2)} kg·m/s` },
  { name: t('collisionsMomentum.hud.keTotal'), simulated: `${currentState.derived.keTotal.toFixed(2)} J`, theoretical: `${analyticalPrediction.value.keTotalAfter.toFixed(2)} J` },
  { name: t('collisionsMomentum.hud.v1'), simulated: `${currentState.cart1.v.toFixed(2)} m/s`, theoretical: `${analyticalPrediction.value.v1Prime.toFixed(2)} m/s` },
  { name: t('collisionsMomentum.hud.v2'), simulated: `${currentState.cart2.v.toFixed(2)} m/s`, theoretical: `${analyticalPrediction.value.v2Prime.toFixed(2)} m/s` },
  { name: t('collisionsMomentum.hud.deltaKe'), simulated: `${currentState.derived.deltaKe.toFixed(2)} J`, theoretical: `${analyticalPrediction.value.deltaKe.toFixed(2)} J` },
])

const calculatedResults = computed(() => ({
  maxHeight: currentState.derived.keTotal,
  range: currentState.derived.pTotal,
  flightTime: currentState.t,
  analyticalRange: analyticalPrediction.value.pTotal,
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
  const next = stepCollisionModel(currentState, params, dt)
  Object.assign(currentState, next)

  // Append series record (vx: v1, vy: v2, v: pTotal)
  series.t.push(currentState.t)
  series.x.push(currentState.cart1.x)
  series.y.push(currentState.cart2.x)
  series.vx.push(currentState.cart1.v)
  series.vy.push(currentState.cart2.v)
  series.v.push(currentState.derived.pTotal)

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
  const fresh = createCollisionModel(params)
  Object.assign(currentState, fresh)

  series.t = [0]
  series.x = [fresh.cart1.x]
  series.y = [fresh.cart2.x]
  series.vx = [fresh.cart1.v]
  series.vy = [fresh.cart2.v]
  series.v = [fresh.derived.pTotal]
}

function setSpeed(val: number) {
  speed.value = val
}

function setMode(newMode: 'ideal' | 'real') {
  mode.value = newMode
  params.isRealMode = newMode === 'real'
  resetSimulation()
}

function onParamChange() {
  currentPresetId.value = 'custom'
  resetSimulation()
}

function applyPreset(preset: PresetOption) {
  currentPresetId.value = preset.id
  Object.assign(params, preset.params)
  resetSimulation()
}

function onLoadSlot(slot: StoredSlot) {
  if (slot.params) Object.assign(params, slot.params)
  if (slot.mode) setMode(slot.mode)
  resetSimulation()
}

async function saveNotes() {
  try {
    const existing = await db.notes.where('experimentId').equals('physics/motion/collisions-momentum').first()
    if (existing && existing.id) {
      await db.notes.update(existing.id, {
        content: userNotes.value,
        updatedAt: Date.now(),
      })
    } else {
      await db.notes.add({
        experimentId: 'physics/motion/collisions-momentum',
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
    const existing = await db.notes.where('experimentId').equals('physics/motion/collisions-momentum').first()
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
.collisions-experiment {
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
