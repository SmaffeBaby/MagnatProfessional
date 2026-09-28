<script setup lang="ts">
import { computed } from 'vue'
import { useClients } from '../../composables/useClients'
import './style.css'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const { items, localizedTitle } = useClients()
const isDarkTheme = computed(() => props.theme === 'dark')
</script>

<template>
  <section
    v-if="items.length"
    class="clients"
    :class="{ 'clients--dark': isDarkTheme }"
    aria-labelledby="clients-title"
  >
    <h2 id="clients-title" class="clients__title">{{ localizedTitle }}</h2>

    <div class="clients__grid">
      <a
        v-for="item in items"
        :key="item.id"
        class="clients__item"
        :href="item.linkUrl || undefined"
        :target="item.linkUrl ? '_blank' : undefined"
        :rel="item.linkUrl ? 'noopener noreferrer' : undefined"
        :aria-disabled="!item.linkUrl"
      >
        <img class="clients__image" :src="item.imageUrl" alt="">
      </a>
    </div>
  </section>
</template>
