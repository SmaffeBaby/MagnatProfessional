<script setup lang="ts">
import { computed } from 'vue'
import { useMissionValues } from '../../composables/useMissionValues'
import './style.css'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const {
  hasContent,
  localizedCards,
  localizedMainTextHtml,
  localizedTitle,
} = useMissionValues()
const isDarkTheme = computed(() => props.theme === 'dark')
</script>

<template>
  <section
    v-if="hasContent"
    class="mission-values"
    :class="{ 'mission-values--dark': isDarkTheme }"
    aria-labelledby="mission-values-title"
  >
    <h2 id="mission-values-title" class="mission-values__title">{{ localizedTitle }}</h2>

    <div class="mission-values__intro-wrap">
      <div
        v-if="localizedMainTextHtml"
        class="mission-values__intro"
        v-html="localizedMainTextHtml"
      />
      <img
        class="mission-values__cat"
        src="/about_page/Mission_cat.png"
        alt=""
        aria-hidden="true"
      >
    </div>

    <div v-if="localizedCards.length" class="mission-values__cards">
      <article
        v-for="card in localizedCards"
        :key="card.id"
        class="mission-values__card"
      >
        <h3 class="mission-values__card-title">{{ card.localizedTitle }}</h3>
        <p class="mission-values__card-text">{{ card.localizedText }}</p>
      </article>
    </div>
  </section>
</template>
