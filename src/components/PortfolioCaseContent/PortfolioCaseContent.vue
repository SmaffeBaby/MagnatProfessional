<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Footer from '../Footer/Footer.vue'
import PortfolioRelatedProjects from '../PortfolioRelatedProjects/PortfolioRelatedProjects.vue'
import QuestionsForm from '../QuestionsForm/QuestionsForm.vue'
import { useLanguageStore } from '../../composables/useLanguageStore'
import { usePortfolioCase } from '../../composables/usePortfolioCase'
import type { PortfolioArticleImage } from '../../composables/useHomePanels'
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
const root = ref<HTMLElement | null>(null)
const scrollProgress = ref(0)
const isBackToTopVisible = ref(false)
const lightboxIndex = ref(-1)
const visibleBlockIds = ref(new Set<string>())
const blockElements = new Map<string, Element>()
let blockObserver: IntersectionObserver | null = null
let lastScrollTop = 0
const panelSlug = computed(() => String(route.params.panelSlug || ''))
const cardSlug = computed(() => String(route.params.cardSlug || ''))
const { panel, card, previousCard, nextCard, relatedCards, isLoading } = usePortfolioCase(panelSlug, cardSlug)
const isDarkTheme = computed(() => props.theme === 'dark')

const title = computed(() => localized(card.value?.title, card.value?.titleEn))
const panelTitle = computed(() => localized(panel.value?.title, panel.value?.titleEn).replace(/^#+\s*/, ''))
const heroImage = computed(() => card.value?.caseHeroUrl || card.value?.imageUrl || card.value?.posterUrl || '')
const blocks = computed(() => card.value?.articleBlocks || [])
const galleryImages = computed(() => {
  const images: PortfolioArticleImage[] = []

  if (heroImage.value) {
    images.push({
      id: 'hero',
      path: card.value?.imagePath || card.value?.posterPath || null,
      url: heroImage.value,
      alt: title.value,
    })
  }

  for (const block of blocks.value) {
    if (block.imageGroups?.length) {
      images.push(...block.imageGroups.flatMap((group) => group.images))
    }
    else {
      images.push(...block.images)
    }
  }

  return images
})
const currentLightboxImage = computed(() => galleryImages.value[lightboxIndex.value] || null)

function localized(value?: string | null, valueEn?: string | null) {
  return locale.value === 'en' && valueEn ? valueEn : value || ''
}

function blockTitle(block: { title: string, titleEn?: string | null }) {
  return localized(block.title, block.titleEn)
}

function blockText(block: { text: string, textEn?: string | null }) {
  return localized(block.text, block.textEn)
}

function goBack() {
  router.push(panel.value?.linkPath || `/portfolio/${panelSlug.value}/`)
}

function openImage(url: string) {
  const index = galleryImages.value.findIndex((image) => image.url === url)
  lightboxIndex.value = index >= 0 ? index : -1
}

function closeLightbox() {
  lightboxIndex.value = -1
}

function showNextImage(direction: -1 | 1) {
  if (!galleryImages.value.length) {
    return
  }

  lightboxIndex.value = (lightboxIndex.value + direction + galleryImages.value.length) % galleryImages.value.length
}

function updateProgress() {
  const scrollState = getScrollState()

  scrollProgress.value = scrollState.progress

  if (scrollState.delta !== 0) {
    isBackToTopVisible.value = scrollState.top > 260 && scrollState.delta < 0
  }

  lastScrollTop = scrollState.top
}

function getScrollState() {
  const element = root.value

  if (element && element.scrollHeight > element.clientHeight + 1) {
    const top = element.scrollTop
    const maxScroll = element.scrollHeight - element.clientHeight

    return {
      top,
      delta: top - lastScrollTop,
      progress: top / maxScroll,
    }
  }

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight

  return {
    top: window.scrollY,
    delta: window.scrollY - lastScrollTop,
    progress: maxScroll > 0 ? window.scrollY / maxScroll : 0,
  }
}

function scrollToTop() {
  const element = root.value

  if (element && element.scrollHeight > element.clientHeight + 1) {
    element.scrollTo({ top: 0, behavior: 'smooth' })
  }
  else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  isBackToTopVisible.value = false
}

function handleKeydown(event: KeyboardEvent) {
  if (lightboxIndex.value < 0) {
    return
  }

  if (event.key === 'Escape') {
    closeLightbox()
  }
  else if (event.key === 'ArrowLeft') {
    showNextImage(-1)
  }
  else if (event.key === 'ArrowRight') {
    showNextImage(1)
  }
}

function setBlockElement(blockId: string, element: Element | null) {
  if (!element) {
    blockElements.delete(blockId)
    return
  }

  blockElements.set(blockId, element)
  blockObserver?.observe(element)
}

function setupBlockObserver() {
  blockObserver?.disconnect()
  blockObserver = new IntersectionObserver((entries) => {
    const nextVisible = new Set(visibleBlockIds.value)

    for (const entry of entries) {
      const id = (entry.target as HTMLElement).dataset.blockId

      if (id && entry.isIntersecting) {
        nextVisible.add(id)
      }
    }

    visibleBlockIds.value = nextVisible
  }, {
    root: root.value && root.value.scrollHeight > root.value.clientHeight + 1 ? root.value : null,
    threshold: 0.01,
    rootMargin: '0px 0px 28% 0px',
  })

  blockElements.forEach((element) => blockObserver?.observe(element))
}

onMounted(() => {
  lastScrollTop = getScrollState().top
  updateProgress()
  setupBlockObserver()
  window.addEventListener('scroll', updateProgress, { passive: true })
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  blockObserver?.disconnect()
  window.removeEventListener('scroll', updateProgress)
  window.removeEventListener('keydown', handleKeydown)
})

watch(card, () => {
  closeLightbox()
  visibleBlockIds.value = new Set()
  blockElements.clear()
  root.value?.scrollTo({ top: 0 })
  window.scrollTo({ top: 0 })
  lastScrollTop = 0
  isBackToTopVisible.value = false
  updateProgress()
  nextTick(() => {
    setupBlockObserver()
  })
})
</script>

<template>
  <div
    ref="root"
    class="portfolio-case"
    :class="{ 'portfolio-case--dark': isDarkTheme }"
    @scroll.passive="updateProgress"
  >
    <div class="portfolio-case__progress" aria-hidden="true">
      <span :style="{ transform: `scaleX(${Math.min(1, Math.max(0, scrollProgress))})` }"></span>
    </div>

    <Transition name="portfolio-case-back-to-top">
      <button
        v-if="isBackToTopVisible"
        class="portfolio-case__back-to-top"
        type="button"
        aria-label="Наверх"
        @click="scrollToTop"
      >
        <svg
          class="portfolio-case__back-to-top-icon"
          width="90"
          height="90"
          viewBox="0 0 90 90"
          fill="none"
          aria-hidden="true"
        >
          <circle class="portfolio-case__back-to-top-circle" cx="45" cy="35" r="30" />
          <path d="M45 46.3335L45 23.0002" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M33.333 35C33.333 35 44.9997 30 44.9997 23.3333C44.9997 30 56.6663 35 56.6663 35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </Transition>

    <Transition name="portfolio-case-fade" mode="out-in">
      <article :key="card?.id || route.fullPath" class="portfolio-case__inner">
        <nav class="portfolio-case__breadcrumbs" :aria-label="t('portfolioContent.breadcrumbs')">
          <RouterLink to="/portfolio">{{ t('portfolioContent.title') }}</RouterLink>
          <span>/</span>
          <RouterLink :to="panel?.linkPath || `/portfolio/${panelSlug}/`">{{ panelTitle }}</RouterLink>
        </nav>

        <button class="portfolio-case__back" type="button" @click="goBack">
          <span aria-hidden="true">‹</span>
          {{ t('portfolioContent.back') }}
        </button>

        <h1 class="portfolio-case__title">
          {{ isLoading ? t('portfolioContent.loading') : title }}
        </h1>

        <button
          v-if="heroImage"
          class="portfolio-case__hero-image"
          type="button"
          @click="openImage(heroImage)"
        >
          <img :src="heroImage" :alt="title">
        </button>

        <nav class="portfolio-case__project-nav" :aria-label="t('portfolioContent.projectNavigation')">
          <RouterLink
            v-if="previousCard"
            class="portfolio-case__project-link"
            :to="previousCard.linkPath"
          >
            <span aria-hidden="true">‹</span>
            {{ t('portfolioContent.previousProject') }}
          </RouterLink>

          <RouterLink
            v-if="nextCard"
            class="portfolio-case__project-link portfolio-case__project-link--next"
            :to="nextCard.linkPath"
          >
            {{ t('portfolioContent.nextProject') }}
            <span aria-hidden="true">›</span>
          </RouterLink>
        </nav>

        <section class="portfolio-case__article">
          <section
            v-for="block in blocks"
            :key="block.id"
            :ref="(element) => setBlockElement(block.id, element as Element | null)"
            class="portfolio-case__block"
            :class="{ 'portfolio-case__block--visible': visibleBlockIds.has(block.id) }"
            :data-block-id="block.id"
          >
            <div v-if="blockTitle(block) || blockText(block)" class="portfolio-case__block-copy">
              <h2 v-if="blockTitle(block)" class="portfolio-case__block-title">{{ blockTitle(block) }}</h2>
              <p v-if="blockText(block)" class="portfolio-case__block-text">{{ blockText(block) }}</p>
            </div>

            <div v-if="block.imageGroups?.length || block.images.length" class="portfolio-case__image-groups">
              <div
                v-for="group in (block.imageGroups?.length ? block.imageGroups : [{ id: `${block.id}-legacy`, layout: block.layout, images: block.images }])"
                :key="group.id"
                class="portfolio-case__images"
                :class="`portfolio-case__images--${group.layout}`"
              >
                <button
                  v-for="image in group.images"
                  :key="image.id"
                  class="portfolio-case__image-button"
                  type="button"
                  @click="openImage(image.url)"
                >
                  <img :src="image.url" :alt="image.alt || blockTitle(block)">
                </button>
              </div>
            </div>
          </section>
        </section>

        <PortfolioRelatedProjects :cards="relatedCards" :theme="theme" />

        <QuestionsForm class="portfolio-case__questions" />
        <Footer />
      </article>
    </Transition>

    <Teleport to="body">
      <div
        v-if="currentLightboxImage"
        class="portfolio-case-lightbox"
        role="dialog"
        aria-modal="true"
        @click.self="closeLightbox"
      >
        <button class="portfolio-case-lightbox__close" type="button" aria-label="Закрыть" @click="closeLightbox">×</button>
        <button class="portfolio-case-lightbox__arrow portfolio-case-lightbox__arrow--prev" type="button" aria-label="Предыдущее изображение" @click="showNextImage(-1)">‹</button>
        <img :src="currentLightboxImage.url" :alt="currentLightboxImage.alt || title">
        <button class="portfolio-case-lightbox__arrow portfolio-case-lightbox__arrow--next" type="button" aria-label="Следующее изображение" @click="showNextImage(1)">›</button>
        <div class="portfolio-case-lightbox__thumbs" aria-label="Все изображения статьи">
          <button
            v-for="(image, index) in galleryImages"
            :key="image.id"
            class="portfolio-case-lightbox__thumb"
            :class="{ 'portfolio-case-lightbox__thumb--active': index === lightboxIndex }"
            type="button"
            @click="lightboxIndex = index"
          >
            <img :src="image.url" :alt="image.alt || title">
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
