<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
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
  if (element instanceof HTMLVideoElement) {
    videoElements.set(panelId, element)
    playVideo(element)
    return
  }

  videoElements.delete(panelId)
}

function playVideo(video: HTMLVideoElement) {
  video.muted = true
  video.playsInline = true
  video.play().catch(() => undefined)
}

function playAllVideos() {
  if (!shouldUseVideo.value) {
    return
  }

  nextTick(() => {
    videoElements.forEach(playVideo)
  })
}

onMounted(playAllVideos)
watch(panels, playAllVideos)
watch(shouldUseVideo, playAllVideos)
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
      v-for="panel in panels"
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
        :src="panel.videoUrl"
        :poster="panel.posterUrl || panel.imageUrl || undefined"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
      />
      <img
        v-else-if="panel.imageUrl || panel.posterUrl"
        class="home-panels__media"
        :src="panel.imageUrl || panel.posterUrl || ''"
        :alt="panelTitle(panel)"
        loading="lazy"
      >
      <span v-else class="home-panels__empty" aria-hidden="true" />

      <span class="home-panels__shade" aria-hidden="true" />
      <span class="home-panels__title">{{ panelTitle(panel) }}</span>
    </RouterLink>
  </section>
</template>

<style src="./style.css" scoped></style>
