<script setup>
import { computed } from 'vue'
import AboutUs from '../AboutUs/AboutUs.vue'
import Description from '../Description/Description.vue'
import DirectorText from '../DirectorText/DirectorText.vue'
import DottedSeparator from '../DottedSeparator/DottedSeparator.vue'
import HystoryCompany from '../HystoryCompany/HystoryCompany.vue'
import Stats from '../Stats/Stats.vue'
import { useMainText } from '../../composables/useMainText'
import './style.css'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const isDarkTheme = computed(() => props.theme === 'dark')
const { content: mainTextContent } = useMainText()
</script>

<template>
  <div
    class="about-content"
    :class="{ 'about-content--dark': isDarkTheme }"
  >
    <AboutUs
      :theme="theme"
      section-id=""
      highlight-first-words
      :button-text="mainTextContent.buttonText"
      button-href="/#contacts"
    />
    <Description :theme="theme" />
    <DottedSeparator />
    <Stats number-variant="gradient" />
    <DirectorText :theme="theme" />
    <HystoryCompany :theme="theme" />
  </div>
</template>
