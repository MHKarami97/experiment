import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { i18n } from './i18n';
import '../styles/global.css';

// PWA Service Worker Registration
import { registerSW } from 'virtual:pwa-register';

registerSW({
  onNeedRefresh() {
    console.log('Virtual Science Lab update available.');
  },
  onOfflineReady() {
    console.log('Virtual Science Lab is ready for offline operation.');
  }
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);

app.mount('#app');
