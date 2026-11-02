import { createApp } from 'vue'
import './style.css'
import 'flowbite'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { i18n } from './i18n'
import { useLanguageStore } from './composables/useLanguageStore'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient } from './queryClient'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const languageStore = useLanguageStore()
languageStore.initLocale()

app.use(VueQueryPlugin, { queryClient }).use(i18n).use(router)

async function mountApp() {
  try {
    // The variable font covers every weight used by the site. Preload starts
    // the request in index.html; wait here to avoid rendering fallback metrics.
    await document.fonts?.load('400 16px "Unbounded"', 'Magnat Привет')
  } catch (error) {
    // A failed font request must not leave the entire site inaccessible.
    console.warn('Unable to load the site font', error)
  }
  app.mount('#app')
}

void mountApp()
