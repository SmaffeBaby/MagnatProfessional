<script setup lang="ts">
import { computed } from 'vue'
import { useDescription } from '../../composables/useDescription'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const { content, hasContent, localizedCardText, localizedText } = useDescription()
const isDarkTheme = computed(() => props.theme === 'dark')
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
      <picture v-if="content.desktopPlaqueUrl || content.tabletPlaqueUrl || content.mobilePlaqueUrl">
        <source
          v-if="content.desktopPlaqueUrl"
          media="(min-width: 1301px)"
          :srcset="content.desktopPlaqueUrl"
        >
        <source
          v-if="content.tabletPlaqueUrl"
          media="(min-width: 1040px)"
          :srcset="content.tabletPlaqueUrl"
        >
        <img
          class="description__card-image"
          :src="content.mobilePlaqueUrl || content.tabletPlaqueUrl || content.desktopPlaqueUrl || ''"
          alt=""
          loading="lazy"
        >
      </picture>

      <p v-if="localizedCardText" class="description__card-text">{{ localizedCardText }}</p>
    </article>
  </section>
</template>

<style src="./style.css" scoped></style>
