<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import NumberFlow from '@number-flow/vue'
import { continuous } from '@number-flow/vue'
import { useStats } from '../../composables/useStats'

const { localizedItems } = useStats()
const statsElement = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const displayValues = ref<Record<string, number>>({})
let observer: IntersectionObserver | null = null
let animationFrame = 0
let hasAnimated = false
const numberFlowPlugins = [continuous]

const animatedItems = computed(() => localizedItems.value.map((item) => {
  const numericValue = Number(String(item.numberText).replace(/[^\d.-]/g, ''))

  return {
    ...item,
    numericValue: Number.isFinite(numericValue) ? numericValue : null,
  }
}))

function observeStats() {
  if (isVisible.value || observer || !statsElement.value) {
    return
  }

  observer = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) {
      isVisible.value = true
      observer?.disconnect()
      observer = null
    }
  }, {
    threshold: 0.25,
  })

  observer.observe(statsElement.value)
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 4)
}

function animateNumbers() {
  if (hasAnimated || !isVisible.value || !animatedItems.value.length) {
    return
  }

  hasAnimated = true
  const startedAt = performance.now()
  const duration = 2600
  const targets = animatedItems.value.filter((item) => item.numericValue !== null)

  animationFrame = window.requestAnimationFrame(function tick(now) {
    const progress = Math.min((now - startedAt) / duration, 1)
    const easedProgress = easeOutCubic(progress)
    const nextValues: Record<string, number> = {}

    for (const item of targets) {
      nextValues[item.id] = Math.round((item.numericValue || 0) * easedProgress)
    }

    displayValues.value = nextValues

    if (progress < 1) {
      animationFrame = window.requestAnimationFrame(tick)
    }
  })
}

onMounted(() => {
  observeStats()
})

onUnmounted(() => {
  observer?.disconnect()
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame)
  }
})

watch(animatedItems, async () => {
  await nextTick()
  observeStats()
  animateNumbers()
})

watch(isVisible, () => {
  animateNumbers()
})
</script>

<template>
  <section v-if="animatedItems.length" ref="statsElement" class="stats" aria-label="Статистика">
    <article v-for="item in animatedItems" :key="item.id" class="stats__item">
      <p class="stats__number">
        <NumberFlow
          v-if="item.numericValue !== null"
          :value="displayValues[item.id] || 0"
          :plugins="numberFlowPlugins"
          :spin-timing="{ duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }"
          :transform-timing="{ duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }"
          :opacity-timing="{ duration: 450, easing: 'ease-out' }"
          class="stats__number-flow"
        />
        <span v-else>{{ item.numberText }}</span>
      </p>
      <p class="stats__text">{{ item.localizedText }}</p>
    </article>
  </section>
</template>

<style src="./style.css" scoped></style>
