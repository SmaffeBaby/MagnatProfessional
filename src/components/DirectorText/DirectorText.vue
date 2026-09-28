<script setup lang="ts">
import { computed } from 'vue'
import { useDirectorText } from '../../composables/useDirectorText'
import './style.css'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const {
  displayPhotoUrl,
  hasContent,
  localizedName,
  localizedPosition,
  localizedText,
} = useDirectorText()
const isDarkTheme = computed(() => props.theme === 'dark')
</script>

<template>
  <section
    v-if="hasContent"
    class="director-text"
    :class="{ 'director-text--dark': isDarkTheme }"
    aria-label="Director text"
  >
    <p v-if="localizedText" class="director-text__copy">{{ localizedText }}</p>

    <div class="director-text__person">
      <img
        v-if="displayPhotoUrl"
        class="director-text__avatar"
        :src="displayPhotoUrl"
        :alt="localizedName"
      >

      <div class="director-text__person-text">
        <p v-if="localizedName" class="director-text__name">{{ localizedName }}</p>
        <p v-if="localizedPosition" class="director-text__position">{{ localizedPosition }}</p>
      </div>
    </div>

    <img
      class="director-text__arrow"
      src="/ico/about/ArrowRight.svg"
      alt=""
      aria-hidden="true"
    >
  </section>
</template>
