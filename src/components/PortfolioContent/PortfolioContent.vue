<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Footer from '../Footer/Footer.vue'
import HomePanels from '../HomePanels/HomePanels.vue'
import './style.css'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const { t } = useI18n()
const isDarkTheme = computed(() => props.theme === 'dark')
</script>

<template>
  <div
    class="portfolio-content"
    :class="{ 'portfolio-content--dark': isDarkTheme }"
  >
    <section class="portfolio-content__hero" aria-labelledby="portfolio-content-title">
      <div class="portfolio-content__copy">
        <h1 id="portfolio-content-title" class="portfolio-content__title">
          {{ t('portfolioContent.title') }}
        </h1>

        <p class="portfolio-content__text">
          {{ t('portfolioContent.text') }}
        </p>
      </div>

      <a class="portfolio-content__project-button" href="mailto:office@magnatmedia.com">
        {{ t('portfolioContent.project') }}
      </a>

      <img
        class="portfolio-content__cat"
        src="/portfolio_page/Jump_cat.png"
        alt=""
        aria-hidden="true"
      >
    </section>

    <HomePanels :theme="theme" variant="portfolio" />

    <Footer />
  </div>
</template>
