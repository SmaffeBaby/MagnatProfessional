<script setup>
import SharedLink from '../../SharedLink.vue'
import { useI18n } from 'vue-i18n'

defineProps({
  links: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['navigate'])
const { t } = useI18n()
</script>

<template>
  <nav class="mx-auto mt-[124px] flex w-full max-w-[340px] flex-col items-center gap-[clamp(1.8rem,5.6svh,3.25rem)] text-center text-[clamp(2.18rem,8.8vw,2.75rem)] font-medium leading-none tracking-normal text-white" :aria-label="t('sidebarMobile.menuLabel')">
    <SharedLink
      v-for="link in links"
      :key="link.id"
      class="mobile-menu-link text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:text-white/80 focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-white active:text-white"
      :href="link.href"
      @click="emit('navigate')"
    >
      {{ link.label }}
    </SharedLink>
  </nav>
</template>
