<script setup lang="ts">
import { computed } from 'vue'
import { useAboutUs } from '../../composables/useAboutUs'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
  sectionId: {
    type: String,
    default: 'about',
  },
  highlightFirstWords: {
    type: Boolean,
    default: false,
  },
  buttonText: {
    type: String,
    default: '',
  },
  buttonHref: {
    type: String,
    default: '#contacts',
  },
})

const { hasContent, localizedButtonText, localizedText } = useAboutUs()
const isDarkTheme = computed(() => props.theme === 'dark')
const displayButtonText = computed(() => props.buttonText || localizedButtonText.value)
const titleParts = computed(() => {
  const words = localizedText.value.trim().split(/\s+/)

  if (!props.highlightFirstWords || words.length < 3) {
    return {
      highlighted: '',
      rest: localizedText.value,
    }
  }

  return {
    highlighted: words.slice(0, 2).join(' '),
    rest: localizedText.value.replace(words.slice(0, 2).join(' '), ''),
  }
})
</script>

<template>
  <section
    v-if="hasContent"
    :id="sectionId || undefined"
    class="about-us"
    :class="{ 'about-us--dark': isDarkTheme }"
    aria-labelledby="about-us-title"
  >
    <h2 id="about-us-title" class="about-us__title">
      <template v-if="highlightFirstWords && titleParts.highlighted">
        <span class="about-us__title-highlight">{{ titleParts.highlighted }}</span>{{ titleParts.rest }}
      </template>
      <template v-else>
        {{ localizedText }}
      </template>
    </h2>

    <a
      v-if="displayButtonText"
      class="about-us__button"
      :href="buttonHref"
    >
      {{ displayButtonText }}
    </a>
  </section>
</template>

<style src="./style.css" scoped></style>
