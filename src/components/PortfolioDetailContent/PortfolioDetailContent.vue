<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Footer from '../Footer/Footer.vue'
import { useLanguageStore } from '../../composables/useLanguageStore'
import { usePortfolioDetail } from '../../composables/usePortfolioDetail'
import './style.css'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const languageStore = useLanguageStore()
const { locale } = storeToRefs(languageStore)
const isDarkTheme = computed(() => props.theme === 'dark')
const panelSlug = computed(() => String(route.params.panelSlug || ''))
const { panel, cards, isLoading } = usePortfolioDetail(panelSlug)
const openProjectForm = inject<(() => void) | null>('openProjectForm', null)
const hasMascotError = ref(false)

const title = computed(() => {
  if (!panel.value) {
    return ''
  }

  const rawTitle = locale.value === 'en' && panel.value.titleEn ? panel.value.titleEn : panel.value.title
  return rawTitle.replace(/^#+\s*/, '')
})

const text = computed(() => {
  if (!panel.value) {
    return ''
  }

  return locale.value === 'en' && panel.value.detailTextEn
    ? panel.value.detailTextEn
    : panel.value.detailText || t('portfolioContent.text')
})
const mascotImage = computed(() => (
  !hasMascotError.value && panel.value?.mascotUrl
    ? panel.value.mascotUrl
    : '/portfolio_page/Jump_cat.png'
))

function cardTitle(card: { title: string, titleEn?: string | null }) {
  return locale.value === 'en' && card.titleEn ? card.titleEn : card.title
}

function cardGradient(card: {
  gradientFromColor?: string
  gradientFromOpacity?: number
  gradientToColor?: string
  gradientToOpacity?: number
  gradientToPosition?: number
}) {
  const fromColor = hexToRgba(card.gradientFromColor || '#DA2128', card.gradientFromOpacity ?? 1)
  const toColor = hexToRgba(card.gradientToColor || '#DA2128', card.gradientToOpacity ?? 0)
  const toPosition = clamp(card.gradientToPosition ?? 70, 0, 100)

  return {
    '--portfolio-card-gradient': `linear-gradient(180deg, ${fromColor} 0%, ${toColor} ${toPosition}%)`,
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push('/portfolio')
}

function handleProjectClick() {
  openProjectForm?.()
}

watch(panel, () => {
  hasMascotError.value = false
})

function hexToRgba(hex: string, opacity: number) {
  const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : 'DA2128'
  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${clamp(opacity, 0, 1)})`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
</script>

<template>
  <div
    class="portfolio-detail"
    :class="{ 'portfolio-detail--dark': isDarkTheme }"
  >
    <section class="portfolio-detail__hero" aria-labelledby="portfolio-detail-title">
      <button class="portfolio-detail__back" type="button" @click="goBack">
        <span aria-hidden="true">‹</span>
        {{ t('portfolioContent.back') }}
      </button>

      <div class="portfolio-detail__copy">
        <h1 id="portfolio-detail-title" class="portfolio-detail__title">
          {{ isLoading ? t('portfolioContent.loading') : title }}
        </h1>

        <p class="portfolio-detail__text">
          {{ text }}
        </p>
      </div>

      <button class="portfolio-detail__project-button" type="button" @click="handleProjectClick">
        {{ t('portfolioContent.project') }}
      </button>

      <img
        class="portfolio-detail__cat"
        :src="mascotImage"
        alt=""
        aria-hidden="true"
        @error="hasMascotError = true"
      >
    </section>

    <section v-if="cards.length" class="portfolio-detail__cards" aria-label="Карточки портфолио">
      <RouterLink
        v-for="card in cards"
        :key="card.id"
        class="portfolio-detail__card"
        :class="`portfolio-detail__card--${card.tileType}`"
        :to="card.linkPath"
        :style="cardGradient(card)"
      >
        <video
          v-if="card.videoUrl"
          class="portfolio-detail__media"
          :src="card.videoUrl"
          :poster="card.posterUrl || card.imageUrl || undefined"
          autoplay
          muted
          loop
          playsinline
        />
        <img
          v-else-if="card.imageUrl || card.posterUrl"
          class="portfolio-detail__media"
          :src="card.imageUrl || card.posterUrl || ''"
          :alt="cardTitle(card)"
          loading="lazy"
        >
        <span v-else class="portfolio-detail__empty" aria-hidden="true" />

        <span class="portfolio-detail__shade" aria-hidden="true" />
        <span class="portfolio-detail__card-title">{{ cardTitle(card) }}</span>
      </RouterLink>
    </section>

    <Footer />
  </div>
</template>
