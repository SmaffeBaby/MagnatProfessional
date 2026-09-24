<script setup>
import HomePanels from '../HomePanels/HomePanels.vue'
import MainText from '../MainText/MainText.vue'

defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})
</script>

<template>
  <div class="swipe-content-main">
    <MainText :theme="theme" />
    <HomePanels :theme="theme" />
  </div>
</template>

<style src="./style.css" scoped></style>
