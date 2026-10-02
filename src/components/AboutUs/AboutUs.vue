<script setup lang="ts">
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'
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
    default: '/about',
  },
})

const { hasContent, localizedButtonText, localizedText } = useAboutUs()
const isDarkTheme = computed(() => props.theme === 'dark')
const displayButtonText = computed(() => props.buttonText || localizedButtonText.value)
const openProjectForm = inject<(() => void) | null>('openProjectForm', null)
const router = useRouter()
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

function handleButtonClick() {
  if (props.buttonHref === '/about') {
    router.push('/about')
    return
  }

  if (openProjectForm) {
    openProjectForm()
    return
  }

  if (props.buttonHref.startsWith('/')) {
    router.push(props.buttonHref)
    return
  }

  window.location.href = props.buttonHref
}
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

    <button
      v-if="displayButtonText"
      class="about-us__button"
      type="button"
      @click="handleButtonClick"
    >
      {{ displayButtonText }}
    </button>
  </section>
</template>

<style src="./style.css" scoped></style>
