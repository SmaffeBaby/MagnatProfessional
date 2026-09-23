<script setup>
import { computed } from 'vue'
import Sidebar from '../components/Sidebar/Sidebar.vue'
import SidebarMobile from '../components/Sidebar/mobile/SidebarMobile.vue'
import { useThemeStore } from '../composables/Sidebar/useThemeStore'

const themeStore = useThemeStore()
themeStore.preloadThemeAssets()

const theme = computed({
  get: () => themeStore.theme,
  set: (value) => themeStore.setTheme(value),
})
</script>

<template>
  <main
    class="min-h-screen text-white transition-colors duration-500"
    :class="theme === 'dark' ? 'bg-[#222222]' : 'bg-magnat-red'"
  >
    <div class="md:hidden">
      <SidebarMobile v-model:theme="theme" />
    </div>

    <div class="hidden md:block">
      <Sidebar v-model:theme="theme" />
    </div>
  </main>
</template>
