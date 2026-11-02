<script setup lang="ts">
import { prefetchPortfolioLink } from '../../composables/prefetchPortfolioLink'
import { computed, nextTick, ref, watch } from 'vue'
import { bindHorizontalSlider } from '../../utils/horizontalSlider'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from '../../composables/useLanguageStore'
import type { PortfolioCard } from '../../composables/useHomePanels'
import './style.css'

const props = defineProps<{
  cards: PortfolioCard[]
  theme?: string
}>()

const languageStore = useLanguageStore()
const { locale } = storeToRefs(languageStore)
const slider = ref<HTMLElement | null>(null)
const canScrollPrev = ref(false)
const canScrollNext = ref(false)
const isDragging = ref(false)
const isDarkTheme = computed(() => props.theme === 'dark')
const localizedTitle = computed(() => locale.value === 'en' ? 'Other projects' : 'Другие проекты')

function localized(value?: string | null, valueEn?: string | null) {
  return locale.value === 'en' && valueEn ? valueEn : value || ''
}

function cardTitle(card: PortfolioCard) {
  return localized(card.title, card.titleEn)
}

function cardMedia(card: PortfolioCard) {
  return card.posterUrl || card.imageUrl || card.caseHeroUrl || ''
}

function cardGradient(card: PortfolioCard) {
  const fromColor = hexToRgba(card.gradientFromColor || '#DA2128', card.gradientFromOpacity ?? 1)
  const toColor = hexToRgba(card.gradientToColor || '#DA2128', card.gradientToOpacity ?? 0)
  const toPosition = clamp(card.gradientToPosition ?? 70, 0, 100)

  return {
    '--portfolio-related-gradient': `linear-gradient(180deg, ${fromColor} 0%, ${toColor} ${toPosition}%)`,
  }
}

function updateScrollState() {
  if (!slider.value) {
    canScrollPrev.value = false
    canScrollNext.value = false
    return
  }

  const scrollLeft = slider.value.scrollLeft
  const maxScrollLeft = slider.value.scrollWidth - slider.value.clientWidth
  canScrollPrev.value = scrollLeft > 1
  canScrollNext.value = scrollLeft < maxScrollLeft - 1
}

function scrollSlider(direction: -1 | 1) {
  if (!slider.value) {
    return
  }

  const firstCard = slider.value.querySelector<HTMLElement>('.portfolio-related-projects__card')
  const scrollDistance = firstCard
    ? firstCard.offsetWidth + Number.parseFloat(window.getComputedStyle(slider.value).columnGap || '0')
    : slider.value.clientWidth * 0.8

  slider.value.scrollBy({
    left: scrollDistance * direction,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
}

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

watch(slider, (element, _previous, onCleanup) => {
  if (!element) return
  const unbind = bindHorizontalSlider(element, {
    isHorizontal: () => window.matchMedia('(min-width: 768px)').matches,
    onDraggingChange: value => { isDragging.value = value },
  })
  const resizeObserver = new ResizeObserver(updateScrollState)
  resizeObserver.observe(element)
  onCleanup(() => {
    unbind()
    resizeObserver.disconnect()
  })
  nextTick(updateScrollState)
})

watch(
  () => props.cards,
  async () => {
    await nextTick()
    slider.value?.scrollTo({ left: 0, top: 0 })
    updateScrollState()
  },
)
</script>

<template>
  <section
    v-if="cards.length"
    class="portfolio-related-projects"
    :class="{ 'portfolio-related-projects--dark': isDarkTheme }"
    aria-labelledby="portfolio-related-projects-title"
  >
    <header class="portfolio-related-projects__header">
      <h2 id="portfolio-related-projects-title" class="portfolio-related-projects__title">
        {{ localizedTitle }}
      </h2>

      <div class="portfolio-related-projects__controls">
        <button
          class="portfolio-related-projects__control"
          type="button"
          :aria-label="locale === 'en' ? 'Previous projects' : 'Предыдущие проекты'"
          :disabled="!canScrollPrev"
          @click="scrollSlider(-1)"
        >
          <img src="/ico/hystory_slider_arrow/arrow-left.svg" alt="">
        </button>
        <button
          class="portfolio-related-projects__control"
          type="button"
          :aria-label="locale === 'en' ? 'Next projects' : 'Следующие проекты'"
          :disabled="!canScrollNext"
          @click="scrollSlider(1)"
        >
          <img src="/ico/hystory_slider_arrow/arrow-right.svg" alt="">
        </button>
      </div>
    </header>

    <div
      ref="slider"
      class="portfolio-related-projects__slider"
      :class="{ 'portfolio-related-projects__slider--dragging': isDragging }"
      tabindex="0"
      @scroll="updateScrollState"
    >
      <RouterLink
        v-for="card in cards"
        :key="card.id"
        class="portfolio-related-projects__card"
        :to="card.linkPath"
        :style="cardGradient(card)"
        @mouseenter="prefetchPortfolioLink(card.linkPath)"
        @focus="prefetchPortfolioLink(card.linkPath)"
      >
        <img
          v-if="cardMedia(card)"
          class="portfolio-related-projects__media"
          :src="cardMedia(card)"
          :alt="cardTitle(card)"
          loading="lazy"
        >
        <span v-else class="portfolio-related-projects__empty" aria-hidden="true" />
        <span class="portfolio-related-projects__shade" aria-hidden="true" />
        <span class="portfolio-related-projects__card-title">{{ cardTitle(card) }}</span>
      </RouterLink>
    </div>
  </section>
</template>
