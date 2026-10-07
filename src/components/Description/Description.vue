<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDescription } from '../../composables/useDescription'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const { content, hasContent, localizedCardText, localizedText } = useDescription()
const isDarkTheme = computed(() => props.theme === 'dark')
const hasPlaqueError = ref(false)
const plaqueImage = computed(() => (
  !hasPlaqueError.value
    ? content.value.mobilePlaqueUrl || content.value.tabletPlaqueUrl || content.value.desktopPlaqueUrl || ''
    : ''
))

watch(content, () => {
  hasPlaqueError.value = false
})
</script>

<template>
  <section
    v-if="hasContent"
    class="description"
    :class="{ 'description--dark': isDarkTheme }"
    aria-labelledby="description-title"
  >
    <h2 id="description-title" class="description__text">{{ localizedText }}</h2>

    <article class="description__card">
      <picture v-if="plaqueImage">
        <source
          v-if="content.desktopPlaqueUrl"
          media="(min-width: 1200px)"
          :srcset="content.desktopPlaqueUrl"
        >
        <source
          v-if="content.tabletPlaqueUrl"
          media="(min-width: 768px)"
          :srcset="content.tabletPlaqueUrl"
        >
        <img
          class="description__card-image"
          :src="plaqueImage"
          alt=""
          loading="lazy"
          @error="hasPlaqueError = true"
        >
      </picture>

      <img
        v-else
        class="description__cat"
        src="/ico/cat.svg"
        alt=""
        aria-hidden="true"
        loading="lazy"
      >

      <p v-if="localizedCardText" class="description__card-text">{{ localizedCardText }}</p>
    </article>
  </section>
</template>

<style src="./style.css" scoped></style>
