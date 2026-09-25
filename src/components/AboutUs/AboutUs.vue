<script setup lang="ts">
import { computed } from 'vue'
import { useAboutUs } from '../../composables/useAboutUs'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const { hasContent, localizedButtonText, localizedText } = useAboutUs()
const isDarkTheme = computed(() => props.theme === 'dark')
</script>

<template>
  <section
    v-if="hasContent"
    id="about"
    class="about-us"
    :class="{ 'about-us--dark': isDarkTheme }"
    aria-labelledby="about-us-title"
  >
    <h2 id="about-us-title" class="about-us__title">{{ localizedText }}</h2>

    <a
      v-if="localizedButtonText"
      class="about-us__button"
      href="#contacts"
    >
      {{ localizedButtonText }}
    </a>
  </section>
</template>

<style src="./style.css" scoped></style>
