<template>
  <div class="settings-view">
    <div class="settings-container glass-card">
      <h1 class="settings-title">⚙️ {{ $t('settings.title') }}</h1>

      <!-- Language & Localization -->
      <section class="settings-group">
        <label class="setting-label">{{ $t('settings.language') }}</label>
        <div class="options-row">
          <button
            type="button"
            class="opt-btn touch-target"
            :class="{ active: store.locale === 'fa' }"
            @click="store.setLanguage('fa')"
          >
            🇮🇷 فارسی (RTL)
          </button>
          <button
            type="button"
            class="opt-btn touch-target"
            :class="{ active: store.locale === 'en' }"
            @click="store.setLanguage('en')"
          >
            🇬🇧 English (LTR)
          </button>
        </div>
      </section>

      <!-- Theme Preference -->
      <section class="settings-group">
        <label class="setting-label">{{ $t('settings.theme') }}</label>
        <div class="options-row">
          <button
            type="button"
            class="opt-btn touch-target"
            :class="{ active: store.theme === 'dark' }"
            @click="store.applyTheme('dark')"
          >
            🌙 {{ $t('settings.themeDark') }}
          </button>
          <button
            type="button"
            class="opt-btn touch-target"
            :class="{ active: store.theme === 'light' }"
            @click="store.applyTheme('light')"
          >
            ☀️ {{ $t('settings.themeLight') }}
          </button>
        </div>
      </section>

      <!-- Persian Digits Toggle -->
      <section class="settings-group">
        <div class="toggle-row">
          <div>
            <div class="setting-label">{{ $t('settings.persianDigits') }}</div>
            <div class="setting-desc">{{ $t('settings.persianDigitsDesc') }} (۱۲۳ vs 123)</div>
          </div>
          <input
            type="checkbox"
            class="toggle-checkbox"
            :checked="store.usePersianDigits"
            @change="store.setPersianDigits(!store.usePersianDigits)"
          />
        </div>
      </section>

      <!-- Offline Storage & Persistence -->
      <section class="settings-group">
        <div class="setting-label">{{ $t('settings.storage') }}</div>
        <p class="setting-desc">
          {{ $t('settings.storageStatusDesc') }}
          <strong>{{ store.isStoragePersisted ? $t('settings.storagePersistedStrong') : $t('settings.storageDefaultStrong') }}</strong>
        </p>

        <div class="storage-actions">
          <button
            type="button"
            class="btn-action touch-target"
            @click="exportJsonBackup"
          >
            📥 {{ $t('settings.exportBackup') }}
          </button>

          <label class="btn-action touch-target file-label">
            📤 {{ $t('settings.importBackup') }}
            <input type="file" accept=".json" class="hidden-file" @change="onImportFile" />
          </label>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAppStore } from '../app/store';
import { exportDatabaseBackup, importDatabaseBackup } from '../db';

const { t } = useI18n();
const store = useAppStore();

async function exportJsonBackup() {
  try {
    const json = await exportDatabaseBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `science-lab-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    store.showToast(t('settings.backupExported'), 'success');
  } catch (e) {
    store.showToast(t('settings.backupFailed'), 'danger');
  }
}

async function onImportFile(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    await importDatabaseBackup(text);
    store.showToast(t('settings.backupRestored'), 'success');
  } catch (e: any) {
    store.showToast(t('settings.backupRestoreError', { err: e.message }), 'danger');
  }
}
</script>

<style scoped>
.settings-view {
  width: 100%;
  max-width: 700px;
  margin: var(--space-4) auto;
  padding: var(--space-4);
  box-sizing: border-box;
}

.settings-container {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: var(--space-6);
  border-radius: var(--radius-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.settings-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--space-3);
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.setting-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.setting-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.options-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.opt-btn {
  flex: 1;
  min-width: 120px;
  padding: 0.6rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface-hover);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.9rem;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.opt-btn:hover {
  background: var(--surface-active);
}

.opt-btn.active {
  background: var(--color-physics);
  color: var(--text-inverse);
  border-color: var(--color-physics);
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.storage-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
  flex-wrap: wrap;
}

.btn-action {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface-hover);
  color: var(--text-primary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-action:hover {
  background: var(--surface-active);
  border-color: var(--border-focus);
}

.file-label {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
}

.hidden-file {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

@media (max-width: 640px) {
  .settings-view {
    padding: var(--space-3) var(--space-2);
  }
  .settings-container {
    padding: var(--space-4) var(--space-3);
    border-radius: var(--radius-xl);
    gap: var(--space-4);
  }
  .options-row {
    flex-direction: column;
  }
  .storage-actions {
    flex-direction: column;
  }
  .btn-action,
  .file-label {
    width: 100%;
    justify-content: center;
  }
}
</style>
