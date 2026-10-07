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

app.use(VueQueryPlugin, { queryClient }).use(i18n).use(router).mount('#app')
