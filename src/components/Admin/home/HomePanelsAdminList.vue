<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { HomePanel } from '../../../composables/useHomePanels'
import AdminPagination from '../shared/AdminPagination.vue'
import AdminIcon from '../shared/AdminIcon.vue'
const props = defineProps<{ panels: HomePanel[]; isLoading: boolean }>()
defineEmits<{ edit: [panel: HomePanel]; selectCards: [panel: HomePanel]; delete: [panel: HomePanel] }>()
const route = useRoute()
const router = useRouter()
const pageSize = 6
const search = computed({ get: () => String(route.query.search || ''), set: value => router.replace({ query: { ...route.query, search: value || undefined, p: undefined } }) })
const filtered = computed(() => props.panels.filter(panel => panel.title.toLocaleLowerCase().includes(search.value.toLocaleLowerCase())))
const page = computed({ get: () => Math.min(Math.max(1, Math.floor(Number(route.query.p)) || 1), Math.max(1, Math.ceil(filtered.value.length / pageSize))), set: value => router.push({ query: { ...route.query, p: value > 1 ? String(value) : undefined } }) })
const visiblePanels = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
watch(() => route.query.p, value => { if (value && Number(value) !== page.value) router.replace({ query: { ...route.query, p: String(page.value) } }) })
</script>
<template>
  <div class="admin-panel-browser">
    <div class="admin-panel-browser__toolbar"><label class="admin-search"><span>Поиск панелей</span><input v-model="search" type="search" placeholder="Найти по названию…"></label><AdminPagination v-model="page" :total="filtered.length" :page-size="pageSize" /></div>
    <p v-if="isLoading" class="admin-message" role="status">Загружаем панели…</p>
    <div v-else-if="!filtered.length" class="admin-empty"><AdminIcon name="grid" :size="32" /><h2>{{ search ? 'Панели не найдены' : 'Здесь появятся ваши панели' }}</h2><p>{{ search ? 'Попробуйте другое название.' : 'Создайте первую панель для главной страницы.' }}</p></div>
    <div v-else class="admin-panel-grid">
      <article v-for="panel in visiblePanels" :key="panel.id" class="admin-panel-card">
        <button class="admin-panel-card__open" :aria-label="`Открыть панель ${panel.title}`" @click="$emit('selectCards', panel)">
          <div class="admin-panel-card__preview"><img v-if="panel.posterUrl || panel.imageUrl" :src="panel.posterUrl || panel.imageUrl || ''" alt="" loading="lazy"><video v-else-if="panel.videoUrl" :src="panel.videoUrl" muted preload="metadata" /><AdminIcon v-else name="grid" :size="40" /><span class="admin-panel-card__type">{{ panel.tileType === 'wide' ? 'Широкая панель' : 'Вертикальная панель' }}</span><span class="admin-panel-card__enter"><AdminIcon name="arrow" /></span></div>
          <div class="admin-panel-card__content"><small>Панель {{ String(panel.sortOrder).padStart(2, '0') }}</small><h2>{{ panel.title }}</h2><p>{{ panel.linkPath }}</p></div>
        </button>
        <footer><button class="button-secondary" @click="$emit('edit', panel)">Настройки</button><button class="button-secondary" @click="$emit('selectCards', panel)">Карточки →</button><button class="button-danger admin-panel-card__delete" :aria-label="`Удалить панель ${panel.title}`" @click="$emit('delete', panel)">Удалить</button></footer>
      </article>
    </div>
  </div>
</template>
