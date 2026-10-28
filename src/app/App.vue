<template>
  <div class="app-root">
    <!-- Top Navigation Bar -->
    <header class="app-header glass-panel">
      <div class="header-left">
        <router-link
          v-if="isExperimentRoute"
          to="/"
          class="btn-back-home touch-target"
          :title="$t('experiment.backToList')"
        >
          {{ store.locale === 'fa' ? '→' : '←' }} {{ $t('app.nav.home') }}
        </router-link>

        <router-link to="/" class="app-brand touch-target">
          <img src="/icons/icon-48.png" alt="آزمایشگاه علوم" class="brand-icon" />
          <span class="brand-name">{{ $t('app.title') }}</span>
        </router-link>
      </div>

      <div class="header-right">
        <!-- Quick Language Switch -->
        <button
          type="button"
          class="btn-hdr touch-target"
          @click="toggleLang"
          :title="store.locale === 'fa' ? 'Switch to English' : 'تغییر به فارسی'"
        >
          {{ store.locale === 'fa' ? 'EN' : 'فا' }}
        </button>

        <!-- Quick Theme Switch -->
        <button
          type="button"
          class="btn-hdr touch-target"
          @click="toggleTheme"
          :title="store.theme === 'dark' ? $t('settings.lightMode') : $t('settings.darkMode')"
        >
          {{ store.theme === 'dark' ? '☀️' : '🌙' }}
        </button>

        <!-- Settings Route Link -->
        <router-link to="/settings" class="btn-hdr touch-target" :title="$t('settings.title')">
          ⚙️
        </router-link>
      </div>
    </header>

    <!-- Main View Content -->
    <main class="app-main" :class="{ 'in-experiment': isExperimentRoute }">
      <router-view />
    </main>

    <!-- Mobile Bottom Navigation Bar (< 768px, Hidden inside experiments) -->
    <nav v-if="!isExperimentRoute" class="mobile-nav glass-panel">
      <router-link to="/" class="nav-item touch-target" active-class="active">
        <span class="nav-icon">🔬</span>
        <span class="nav-text">{{ $t('app.nav.home') }}</span>
      </router-link>
      <router-link to="/experiment/physics/motion/projectile" class="nav-item touch-target" active-class="active">
        <span class="nav-icon">🚀</span>
        <span class="nav-text">{{ $t('app.nav.projectile') }}</span>
      </router-link>
      <router-link to="/settings" class="nav-item touch-target" active-class="active">
        <span class="nav-icon">⚙️</span>
        <span class="nav-text">{{ $t('app.nav.settings') }}</span>
      </router-link>
    </nav>

    <!-- Global Toast Notifications -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from './store';
import Toast from '../shared/Toast.vue';

const store = useAppStore();
const route = useRoute();

const isExperimentRoute = computed(() => route.path.startsWith('/experiment'));

function toggleLang() {
  store.setLanguage(store.locale === 'fa' ? 'en' : 'fa');
}

function toggleTheme() {
  store.applyTheme(store.theme === 'dark' ? 'light' : 'dark');
}

onMounted(() => {
  store.init();
});
</script>

<style scoped>
.app-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  overflow-x: hidden;
}

.app-header {
  height: var(--header-height);
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.btn-back-home {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0.35rem 0.65rem;
  background: var(--surface-hover);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--primary);
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.btn-back-home:hover {
  background: var(--primary-surface);
  border-color: var(--primary);
}

.app-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1.05rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.brand-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.btn-hdr {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--surface-hover);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.btn-hdr:hover {
  background: var(--surface-active);
  border-color: var(--border-focus);
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  overflow-x: hidden;
  padding-bottom: calc(var(--space-8) + env(safe-area-inset-bottom, 0px));
}

.app-main.in-experiment {
  padding-bottom: 0 !important;
}

.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3.8rem;
  display: none;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid var(--border-subtle);
  z-index: 999;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: var(--radius-md);
  transition: color var(--transition-fast);
}

.nav-item.active {
  color: var(--color-physics);
  font-weight: 700;
}

.nav-icon {
  font-size: 1.15rem;
}

@media (max-width: 768px) {
  .mobile-nav {
    display: flex;
  }
  .app-main:not(.in-experiment) {
    padding-bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px));
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0 var(--space-2);
  }
  .brand-name {
    font-size: 0.85rem;
    max-width: 120px;
  }
  .btn-hdr {
    width: 34px;
    height: 34px;
    font-size: 0.85rem;
  }
}
</style>
