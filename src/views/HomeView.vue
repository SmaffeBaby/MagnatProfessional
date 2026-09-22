<script setup>
import { ref } from 'vue'
import Sidebar from '../components/Sidebar.vue'

const theme = ref('light')
</script>

<template>
  <main
    class="min-h-screen text-white transition-colors duration-500"
    :class="theme === 'dark' ? 'bg-[#222222]' : 'bg-magnat-red'"
  >
    <Sidebar v-model:theme="theme" />
  </main>
</template>
