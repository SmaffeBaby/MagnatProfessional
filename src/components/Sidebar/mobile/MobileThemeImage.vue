<script setup>
import { computed } from 'vue'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const isDarkTheme = computed(() => props.theme === 'dark')
</script>

<template>
  <div class="pointer-events-none absolute inset-0 z-[-1]" aria-hidden="true">
    <div
      class="mobile-theme-image mobile-theme-image--light"
      :class="isDarkTheme ? '' : 'mobile-theme-image--visible'"
    />
    <div
      class="mobile-theme-image mobile-theme-image--dark"
      :class="isDarkTheme ? 'mobile-theme-image--visible' : ''"
    />
  </div>
</template>
