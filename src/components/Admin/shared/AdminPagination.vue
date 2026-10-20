<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(defineProps<{ modelValue: number; total: number; pageSize?: number }>(), { pageSize: 6 })
const emit = defineEmits<{ 'update:modelValue': [page: number] }>()
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const visiblePages = computed(() => Array.from(new Set([1, props.modelValue - 1, props.modelValue, props.modelValue + 1, pages.value])).filter(page => page >= 1 && page <= pages.value).sort((a, b) => a - b))
</script>
<template><nav class="admin-pagination" aria-label="Пагинация"><span>{{ total ? (modelValue - 1) * pageSize + 1 : 0 }}–{{ Math.min(modelValue * pageSize, total) }} из {{ total }}</span><div><button class="button-secondary" :disabled="modelValue <= 1" aria-label="Предыдущая страница" @click="emit('update:modelValue', modelValue - 1)">←</button><template v-for="(page, index) in visiblePages" :key="page"><span v-if="index && page - visiblePages[index - 1] > 1">…</span><button :class="page === modelValue ? '' : 'button-secondary'" :aria-label="`Страница ${page}`" :aria-current="page === modelValue ? 'page' : undefined" @click="emit('update:modelValue', page)">{{ page }}</button></template><button class="button-secondary" :disabled="modelValue >= pages" aria-label="Следующая страница" @click="emit('update:modelValue', modelValue + 1)">→</button></div></nav></template>
