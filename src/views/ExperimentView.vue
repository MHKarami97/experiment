<template>
  <div class="experiment-view-container">
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('experiment.loading') }}</p>
    </div>

    <div v-else-if="error" class="error-state glass-card">
      <h3>⚠️ {{ $t('experiment.notFound') }}</h3>
      <p>{{ error }}</p>
      <button type="button" class="btn-back touch-target" @click="$router.push('/')">
        {{ $t('experiment.backToList') }}
      </button>
    </div>

    <component :is="activeComponent" v-else-if="activeComponent" />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { getExperimentById } from '../experiments/registry';
import { registerExperimentMessages } from '../app/i18n';

const route = useRoute();
const { t } = useI18n();
const isLoading = ref(true);
const error = ref<string | null>(null);
const activeComponent = shallowRef<any>(null);

async function loadPlugin() {
  const { subject, topic, id } = route.params;
  const experimentId = `${subject}/${topic}/${id}`;

  isLoading.value = true;
  error.value = null;

  const catalogItem = getExperimentById(experimentId);
  if (!catalogItem) {
    error.value = t('experiment.notFoundDesc', { id: experimentId });
    isLoading.value = false;
    return;
  }

  try {
    const plugin = await catalogItem.load();
    // Register local messages under proper namespace
    if (plugin.messages) {
      const nsMap: Record<string, string> = {
        'projectile': 'projectile',
        '1d-2d-kinematics': 'kinematics',
        'newton-inclined-plane': 'inclinedPlane',
        'pulleys-levers': 'pulleysLevers'
      };
      const ns = nsMap[id as string] || (id as string);
      if (plugin.messages.fa) {
        registerExperimentMessages('fa', ns, plugin.messages.fa);
      }
      if (plugin.messages.en) {
        registerExperimentMessages('en', ns, plugin.messages.en);
      }
    }
    activeComponent.value = plugin.component;
  } catch (err: any) {
    console.error('Failed to load experiment:', err);
    error.value = t('experiment.loadError');
  } finally {
    isLoading.value = false;
  }
}

watch(() => route.params, () => {
  loadPlugin();
});

onMounted(() => {
  loadPlugin();
});
</script>

<style scoped>
.experiment-view-container {
  width: 100%;
  height: 100%;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: var(--space-3);
  text-align: center;
  padding: var(--space-4);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-subtle);
  border-top-color: var(--color-physics);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-back {
  padding: 0.5rem 1rem;
  background: var(--color-physics);
  color: var(--text-inverse);
  border-radius: var(--radius-md);
  font-weight: 600;
}
</style>
