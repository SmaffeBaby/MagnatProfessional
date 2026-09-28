<script setup>
import AboutUs from '../AboutUs/AboutUs.vue'
import Description from '../Description/Description.vue'
import DottedSeparator from '../DottedSeparator/DottedSeparator.vue'
import Footer from '../Footer/Footer.vue'
import HomePanels from '../HomePanels/HomePanels.vue'
import Map from '../Map/Map.vue'
import MainText from '../MainText/MainText.vue'
import Stats from '../Stats/Stats.vue'
import './style.css'

defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})
</script>

<template>
  <div class="home-content">
    <MainText :theme="theme" />
    <HomePanels :theme="theme" />
    <AboutUs :theme="theme" />
    <Description :theme="theme" />
    <DottedSeparator />
    <Stats />
    <Map />
    <Footer />
  </div>
</template>
