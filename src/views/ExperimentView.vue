<template>
  <div class="experiment-view-container">
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>در حال بارگذاری شبیه‌سازی آزمایشگاه...</p>
    </div>

    <div v-else-if="error" class="error-state glass-card">
      <h3>⚠️ آزمایش مورد نظر یافت نشد</h3>
      <p>{{ error }}</p>
      <button type="button" class="btn-back touch-target" @click="$router.push('/')">
        بازگشت به فهرست آزمایش‌ها
      </button>
    </div>

    <component :is="activeComponent" v-else-if="activeComponent" />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getExperimentById } from '../experiments/registry';
import { registerExperimentMessages } from '../app/i18n';

const route = useRoute();
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
    error.value = `آزمایش با شناسه "${experimentId}" هنوز پیاده‌سازی نشده یا موجود نیست.`;
    isLoading.value = false;
    return;
  }

  try {
    const plugin = await catalogItem.load();
    // Register local messages
    if (plugin.messages) {
      if (plugin.messages.fa) {
        registerExperimentMessages('fa', 'projectile', plugin.messages.fa);
      }
      if (plugin.messages.en) {
        registerExperimentMessages('en', 'projectile', plugin.messages.en);
      }
    }
    activeComponent.value = plugin.component;
  } catch (err: any) {
    console.error('Failed to load experiment:', err);
    error.value = 'خطا در بارگذاری مؤلفه‌های آزمایش.';
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
