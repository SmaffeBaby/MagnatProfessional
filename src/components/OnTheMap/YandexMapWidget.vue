<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

defineProps({
  title: {
    type: String,
    default: 'Magnat',
  },
})

const mapSrc = 'https://yandex.ru/map-widget/v1/?ll=30.227283%2C59.944790&mode=poi&poi%5Bpoint%5D=30.226024%2C59.939634&poi%5Buri%5D=ymapsbm1%3A%2F%2Forg%3Foid%3D173665782756&utm_source=share&z=14.11'
const root = ref(null)
const isMapRequested = ref(false)
let mapObserver = null

function requestMap() {
  isMapRequested.value = true
  mapObserver?.disconnect()
}

onMounted(() => {
  mapObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      window.requestIdleCallback?.(requestMap) ?? window.setTimeout(requestMap, 1)
    }
  }, {
    rootMargin: '240px 0px',
    threshold: 0.01,
  })

  if (root.value) {
    mapObserver.observe(root.value)
  }
})

onUnmounted(() => {
  mapObserver?.disconnect()
})
</script>

<template>
  <div
    ref="root"
    class="relative h-full min-h-[420px] overflow-hidden bg-white [pointer-events:auto] [touch-action:auto]"
    @pointerenter.once="requestMap"
    @focusin.once="requestMap"
  >
    <iframe
      v-if="isMapRequested"
      class="relative h-full min-h-[420px] w-full border-0 [pointer-events:auto] [touch-action:auto]"
      :src="mapSrc"
      :title="title"
      allowfullscreen
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
    />
  </div>
</template>
