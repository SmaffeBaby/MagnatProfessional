<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useHystoryCompany } from '../../composables/useHystoryCompany'
import './style.css'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const { localizedItems, localizedTitle } = useHystoryCompany()
const slider = ref<HTMLElement | null>(null)
const isDarkTheme = computed(() => props.theme === 'dark')
const canScrollPrev = ref(false)
const canScrollNext = ref(false)
const isDragging = ref(false)
let dragStartX = 0
let dragStartScrollLeft = 0
let hasDragged = false

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

  const firstCard = slider.value.querySelector<HTMLElement>('.hystory-company__item')
  const scrollDistance = firstCard
    ? firstCard.offsetWidth + Number.parseFloat(window.getComputedStyle(slider.value).columnGap || '0')
    : slider.value.clientWidth * 0.8

  slider.value.scrollBy({
    left: scrollDistance * direction,
    behavior: 'smooth',
  })
}

function startDrag(event: PointerEvent) {
  if (!slider.value || event.button !== 0 || event.pointerType === 'touch') {
    return
  }

  isDragging.value = true
  hasDragged = false
  dragStartX = event.clientX
  dragStartScrollLeft = slider.value.scrollLeft
  slider.value.setPointerCapture(event.pointerId)
}

function dragSlider(event: PointerEvent) {
  if (!slider.value || !isDragging.value) {
    return
  }

  const deltaX = event.clientX - dragStartX

  if (Math.abs(deltaX) > 3) {
    hasDragged = true
  }

  slider.value.scrollLeft = dragStartScrollLeft - deltaX
}

function stopDrag(event: PointerEvent) {
  if (!slider.value || !isDragging.value) {
    return
  }

  isDragging.value = false
  if (slider.value.hasPointerCapture(event.pointerId)) {
    slider.value.releasePointerCapture(event.pointerId)
  }
  updateScrollState()
}

function preventClickAfterDrag(event: MouseEvent) {
  if (hasDragged) {
    event.preventDefault()
    event.stopPropagation()
    hasDragged = false
  }
}

onMounted(() => {
  updateScrollState()
})

onUnmounted(() => {
  isDragging.value = false
})

watch(localizedItems, async () => {
  await nextTick()
  slider.value?.scrollTo({ left: 0 })
  updateScrollState()
})
</script>

<template>
  <section
    v-if="localizedItems.length"
    class="hystory-company"
    :class="{ 'hystory-company--dark': isDarkTheme }"
    aria-labelledby="hystory-company-title"
  >
    <header class="hystory-company__header">
      <h2 id="hystory-company-title" class="hystory-company__title">{{ localizedTitle }}</h2>

      <div class="hystory-company__controls">
        <button
          class="hystory-company__control"
          type="button"
          :aria-label="localizedTitle"
          :disabled="!canScrollPrev"
          @click="scrollSlider(-1)"
        >
          <img src="/ico/hystory_slider_arrow/arrow-left.svg" alt="">
        </button>
        <button
          class="hystory-company__control"
          type="button"
          :aria-label="localizedTitle"
          :disabled="!canScrollNext"
          @click="scrollSlider(1)"
        >
          <img src="/ico/hystory_slider_arrow/arrow-right.svg" alt="">
        </button>
      </div>
    </header>

    <div
      ref="slider"
      class="hystory-company__slider"
      :class="{ 'hystory-company__slider--dragging': isDragging }"
      tabindex="0"
      @scroll="updateScrollState"
      @pointerdown="startDrag"
      @pointermove="dragSlider"
      @pointerup="stopDrag"
      @pointercancel="stopDrag"
      @lostpointercapture="isDragging = false"
      @click.capture="preventClickAfterDrag"
    >
      <article
        v-for="item in localizedItems"
        :key="item.id"
        class="hystory-company__item"
      >
        <p class="hystory-company__year">{{ item.year }}</p>
        <h3 class="hystory-company__item-title">{{ item.localizedTitle }}</h3>
        <p class="hystory-company__text">{{ item.localizedText }}</p>
      </article>
    </div>
  </section>
</template>
