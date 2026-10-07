<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from '../../composables/useLanguageStore'
import { useHomePanels } from '../../composables/useHomePanels'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
  variant: {
    type: String,
    default: 'home',
  },
})

const { panels } = useHomePanels()
const languageStore = useLanguageStore()
const { locale } = storeToRefs(languageStore)
const isDarkTheme = computed(() => props.theme === 'dark')
const shouldUseVideo = computed(() => props.variant === 'home')
const videoElements = new Map<string, HTMLVideoElement>()
const activeVideoIds = ref(new Set<string>())
let videoObserver: IntersectionObserver | null = null
let isMounted = false

function panelTitle(panel: { title: string, titleEn?: string | null }) {
  return locale.value === 'en' && panel.titleEn ? panel.titleEn : panel.title
}

function panelGradient(panel: {
  gradientFromColor?: string
  gradientFromOpacity?: number
  gradientToColor?: string
  gradientToOpacity?: number
  gradientToPosition?: number
}) {
  const fromColor = hexToRgba(panel.gradientFromColor || '#DA2128', panel.gradientFromOpacity ?? 1)
  const toColor = hexToRgba(panel.gradientToColor || '#DA2128', panel.gradientToOpacity ?? 0)
  const toPosition = clamp(panel.gradientToPosition ?? 70, 0, 100)

  return {
    '--home-panel-gradient': `linear-gradient(180deg, ${fromColor} 0%, ${toColor} ${toPosition}%)`,
  }
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

function setVideoElement(panelId: string, element: Element | null) {
  const previousElement = videoElements.get(panelId)

  if (previousElement && previousElement !== element) {
    videoObserver?.unobserve(previousElement)
  }

  if (element instanceof HTMLVideoElement) {
    videoElements.set(panelId, element)

    if (shouldUseVideo.value) {
      if (videoObserver) {
        videoObserver.observe(element)
      }
      else if (isMounted) {
        activateVideo(panelId)
      }
    }

    return
  }

  if (previousElement) {
    videoElements.delete(panelId)
  }
}

function playVideo(video: HTMLVideoElement) {
  video.muted = true
  video.playsInline = true
  video.play().catch(() => undefined)
}

function activateVideo(panelId: string) {
  if (activeVideoIds.value.has(panelId)) {
    return
  }

  activeVideoIds.value = new Set(activeVideoIds.value).add(panelId)
}

function isVideoActive(panelId: string) {
  return activeVideoIds.value.has(panelId)
}

function pauseHiddenVideo(video: HTMLVideoElement) {
  if (!video.paused) {
    video.pause()
  }
}

function playAllVideos() {
  if (!shouldUseVideo.value) {
    return
  }

  nextTick(() => {
    videoElements.forEach(playVideo)
  })
}

function setupVideoObserver() {
  if (!shouldUseVideo.value) {
    return
  }

  if (!('IntersectionObserver' in window)) {
    videoElements.forEach((_video, panelId) => activateVideo(panelId))
    playAllVideos()
    return
  }

  videoObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const video = entry.target

      if (!(video instanceof HTMLVideoElement)) {
        continue
      }

      const panelId = video.dataset.panelId

      if (!panelId) {
        continue
      }

      if (entry.isIntersecting) {
        activateVideo(panelId)
        nextTick(() => playVideo(video))
      }
      else {
        pauseHiddenVideo(video)
      }
    }
  }, {
    rootMargin: '180px 0px',
    threshold: 0.01,
  })

  videoElements.forEach((video) => videoObserver?.observe(video))
}

function teardownVideoObserver() {
  videoObserver?.disconnect()
  videoObserver = null
}

onMounted(() => {
  isMounted = true
  setupVideoObserver()
})
onBeforeUnmount(() => {
  isMounted = false
  teardownVideoObserver()
  videoElements.forEach(pauseHiddenVideo)
  videoElements.clear()
})
watch(panels, playAllVideos)
watch(shouldUseVideo, (useVideo) => {
  teardownVideoObserver()

  if (!useVideo) {
    activeVideoIds.value = new Set()
    return
  }

  setupVideoObserver()
})
</script>

<template>
  <section
    v-if="panels.length"
    class="home-panels"
    :class="[
      { 'home-panels--dark': isDarkTheme },
      `home-panels--${props.variant}`,
    ]"
    aria-label="Панели на главной"
  >
    <RouterLink
      v-for="(panel, panelIndex) in panels"
      :key="panel.id"
      class="home-panels__item"
      :class="`home-panels__item--${panel.tileType}`"
      :to="panel.linkPath"
      :style="panelGradient(panel)"
    >
      <video
        v-if="shouldUseVideo && panel.videoUrl"
        :ref="(element) => setVideoElement(panel.id, element as Element | null)"
        class="home-panels__media"
        :data-panel-id="panel.id"
        :src="isVideoActive(panel.id) ? panel.videoUrl : undefined"
        :poster="panel.posterUrl || panel.imageUrl || undefined"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
      />
      <img
        v-else-if="panel.imageUrl || panel.posterUrl"
        class="home-panels__media"
        :src="panel.imageUrl || panel.posterUrl || ''"
        :alt="panelTitle(panel)"
        :loading="props.variant === 'home' && panelIndex === 0 ? 'eager' : 'lazy'"
        :fetchpriority="props.variant === 'home' && panelIndex === 0 ? 'high' : 'auto'"
        decoding="async"
      >
      <span v-else class="home-panels__empty" aria-hidden="true" />

      <span class="home-panels__shade" aria-hidden="true" />
      <span class="home-panels__title">{{ panelTitle(panel) }}</span>
    </RouterLink>
  </section>
</template>

<style src="./style.css" scoped></style>
