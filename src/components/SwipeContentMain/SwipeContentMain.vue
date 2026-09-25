<script setup>
import AboutUs from '../AboutUs/AboutUs.vue'
import Description from '../Description/Description.vue'
import DottedSeparator from '../DottedSeparator/DottedSeparator.vue'
import HomePanels from '../HomePanels/HomePanels.vue'
import Map from '../Map/Map.vue'
import MainText from '../MainText/MainText.vue'
import Stats from '../Stats/Stats.vue'

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
    <AboutUs :theme="theme" />
    <Description :theme="theme" />
    <DottedSeparator />
    <Stats />
    <Map />
  </div>
</template>

<style src="./style.css" scoped></style>
