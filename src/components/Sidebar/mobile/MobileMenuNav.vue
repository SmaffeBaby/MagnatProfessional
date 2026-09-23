<script setup>
defineProps({
  links: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['navigate'])
</script>

<template>
  <nav class="mx-auto mt-[124px] flex w-full max-w-[340px] flex-col items-center gap-[clamp(1.8rem,5.6svh,3.25rem)] text-center text-[clamp(2.18rem,8.8vw,2.75rem)] font-medium leading-none tracking-normal" aria-label="Главное меню">
    <a
      v-for="link in links"
      :key="link.href"
      class="mobile-menu-link transition duration-300 ease-out hover:-translate-y-0.5 hover:text-white/80 focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-white"
      :href="link.href"
      @click="emit('navigate')"
    >
      {{ link.label }}
    </a>
  </nav>
</template>
