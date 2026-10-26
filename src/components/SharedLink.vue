<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { isExternalChromeLink } from '../composables/useSiteChrome'
defineProps<{ href: string }>()
</script>
<template><a v-if="isExternalChromeLink(href)" :href="href" :rel="/^https?:/i.test(href) ? 'noopener noreferrer' : undefined"><slot /></a><RouterLink v-else :to="href"><slot /></RouterLink></template>
