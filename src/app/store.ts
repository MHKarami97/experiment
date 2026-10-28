import { defineStore } from 'pinia';
import { ref } from 'vue';
import { setAppLanguage } from './i18n';
import { db, requestPersistentStorage } from '../db';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  text: string;
  duration?: number;
}

export const useAppStore = defineStore('app', () => {
  const locale = ref<'fa' | 'en'>('fa');
  const theme = ref<'dark' | 'light'>('dark');
  const usePersianDigits = ref<boolean>(true);
  const favorites = ref<string[]>([]);
  const toasts = ref<ToastMessage[]>([]);
  const isStoragePersisted = ref<boolean>(false);
  const storageUsage = ref<number>(0);
  const storageQuota = ref<number>(0);

  async function init(): Promise<void> {
    // Load settings from db
    try {
      const savedLocale = await db.settings.get('locale');
      if (savedLocale?.value) {
        locale.value = savedLocale.value;
      }
      const savedTheme = await db.settings.get('theme');
      if (savedTheme?.value) {
        theme.value = savedTheme.value;
      }
      const savedDigits = await db.settings.get('usePersianDigits');
      if (savedDigits?.value !== undefined) {
        usePersianDigits.value = savedDigits.value;
      }
      const savedFavs = await db.settings.get('favorites');
      if (Array.isArray(savedFavs?.value)) {
        favorites.value = savedFavs.value;
      }

      // Apply initial theme & language to DOM
      applyTheme(theme.value);
      setAppLanguage(locale.value);

      // Check persistent storage
      const persistInfo = await requestPersistentStorage();
      isStoragePersisted.value = persistInfo.persisted;
      storageUsage.value = persistInfo.usage ?? 0;
      storageQuota.value = persistInfo.quota ?? 0;
    } catch (e) {
      console.warn('Could not initialize preferences from db:', e);
    }
  }

  function applyTheme(newTheme: 'dark' | 'light'): void {
    theme.value = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    db.settings.put({ key: 'theme', value: newTheme });
  }

  function setLanguage(newLang: 'fa' | 'en'): void {
    locale.value = newLang;
    setAppLanguage(newLang);
    db.settings.put({ key: 'locale', value: newLang });
  }

  function setPersianDigits(enabled: boolean): void {
    usePersianDigits.value = enabled;
    db.settings.put({ key: 'usePersianDigits', value: enabled });
  }

  function toggleFavorite(experimentId: string): void {
    const idx = favorites.value.indexOf(experimentId);
    if (idx >= 0) {
      favorites.value.splice(idx, 1);
    } else {
      favorites.value.push(experimentId);
    }
    db.settings.put({ key: 'favorites', value: [...favorites.value] });
  }

  function isFavorite(experimentId: string): boolean {
    return favorites.value.includes(experimentId);
  }

  function showToast(text: string, type: ToastMessage['type'] = 'info', duration = 3500): void {
    const id = Math.random().toString(36).slice(2, 9);
    toasts.value.push({ id, text, type, duration });
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }

  function removeToast(id: string): void {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    locale,
    theme,
    usePersianDigits,
    favorites,
    toasts,
    isStoragePersisted,
    storageUsage,
    storageQuota,
    init,
    applyTheme,
    setLanguage,
    setPersianDigits,
    toggleFavorite,
    isFavorite,
    showToast,
    removeToast
  };
});
