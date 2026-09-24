<script setup>
import { computed, ref } from 'vue'
import DesktopHome from '../components/DesktopHome/DesktopHome.vue'
import OnTheMapPanel from '../components/OnTheMap/OnTheMapPanel.vue'
import Sidebar from '../components/Sidebar/Sidebar.vue'
import SidebarMobile from '../components/Sidebar/mobile/SidebarMobile.vue'
import { useThemeStore } from '../composables/Sidebar/useThemeStore'

const themeStore = useThemeStore()
themeStore.preloadThemeAssets()

const theme = computed({
  get: () => themeStore.theme,
  set: (value) => themeStore.setTheme(value),
})

const isMapOpen = ref(false)
</script>

<template>
  <main
    class="min-h-screen text-white transition-colors duration-500"
    :class="theme === 'dark' ? 'bg-[#222222]' : 'bg-magnat-red'"
  >
    <div class="md:hidden">
      <SidebarMobile v-model:theme="theme" @open-map="isMapOpen = true" />
    </div>

    <div class="hidden min-h-screen md:flex">
      <div class="w-[504px] shrink-0">
        <Sidebar v-model:theme="theme" @open-map="isMapOpen = true" />
      </div>

      <DesktopHome :theme="theme" />
    </div>

    <OnTheMapPanel :is-open="isMapOpen" @close="isMapOpen = false" />
  </main>
</template>
