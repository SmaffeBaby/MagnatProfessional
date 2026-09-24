<script setup>
import { computed } from 'vue'
import { useMainText } from '../../composables/useMainText'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const { content } = useMainText()
const isDarkTheme = computed(() => props.theme === 'dark')
</script>

<template>
  <section
    class="main-text"
    :class="{ 'main-text--dark': isDarkTheme }"
    aria-labelledby="main-text-title"
  >
    <div class="main-text__heading" id="main-text-title">
      <h1 class="main-text__title">{{ content.titleText }}</h1>
      <p class="main-text__right-title">{{ content.rightText }}</p>
    </div>

    <p class="main-text__description">{{ content.descriptionText }}</p>

    <a
      class="main-text__button"
      href="#contacts"
      :aria-label="content.buttonText"
    >
      <span class="main-text__button-label" aria-hidden="true">
        <span class="main-text__button-track">
          <span class="main-text__button-text main-text__button-text--base">
            {{ content.buttonText }}
          </span>
          <span class="main-text__button-text main-text__button-text--hover">
            {{ content.buttonText }}
          </span>
        </span>
      </span>
    </a>
  </section>
</template>

<style src="./style.css" scoped></style>
