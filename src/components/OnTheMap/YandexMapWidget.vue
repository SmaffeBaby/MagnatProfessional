<script setup>
defineProps({
  title: {
    type: String,
    default: 'Magnat',
  },
})

const mapSrc = 'https://yandex.ru/map-widget/v1/?ll=30.227283%2C59.944790&mode=poi&poi%5Bpoint%5D=30.226024%2C59.939634&poi%5Buri%5D=ymapsbm1%3A%2F%2Forg%3Foid%3D173665782756&utm_source=share&z=14.11'
</script>

<template>
  <div class="relative h-full min-h-[420px] overflow-hidden bg-white">
    <iframe
      class="relative h-full min-h-[420px] w-full border-0"
      :src="mapSrc"
      :title="title"
      allowfullscreen
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
    />

  </div>
</template>
