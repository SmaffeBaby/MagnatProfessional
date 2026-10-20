<script setup lang="ts">
import { computed, ref } from 'vue'
import AdminIcon from '../shared/AdminIcon.vue'
import { filterPortfolioCases, type PortfolioOverviewCategory } from '../../../composables/Admin/useAdminPortfolioOverview'
const props = defineProps<{ categories: PortfolioOverviewCategory[]; isLoading: boolean; error: string }>()
defineEmits<{ retry: [] }>()
const search = ref('')
const cases = computed(() => props.categories.flatMap(category => category.cases.map(item => ({ ...item, categoryId: category.id, categoryTitle: category.title }))))
const matchingCases = computed(() => filterPortfolioCases(cases.value, search.value))
function categoryLink(id: string) {
  return { path: '/admin', query: { section: 'home-panels', page: 'home', panel: id, tab: 'cards' } }
}
function caseLink(categoryId: string, caseId: string) {
  return { path: '/admin', query: { ...categoryLink(categoryId).query, case: caseId, caseTab: 'content' } }
}
</script>
<template>
  <section class="admin-content-overview" aria-labelledby="admin-content-title">
    <div class="admin-section-heading"><h2 id="admin-content-title">Контент</h2><span>Категории портфолио и кейсы</span></div>
    <div v-if="error" class="admin-message admin-message--error" role="alert">{{ error }} <button class="button-secondary" type="button" @click="$emit('retry')">Повторить</button></div>
    <p v-else-if="isLoading" class="admin-content-loading" role="status">Загружаем структуру портфолио…</p>
    <div v-else class="admin-content-tiles">
      <details class="admin-content-tile">
        <summary><span class="admin-content-tile__top"><span class="admin-content-tile__icon"><AdminIcon name="grid" /></span><AdminIcon name="chevron" class="admin-content-tile__chevron" :size="16" /></span><span class="admin-content-tile__count">{{ categories.length }}</span><strong>Категории портфолио</strong><small>Все направления портфолио</small><span class="admin-content-tile__hint">Посмотреть категории</span></summary>
        <div class="admin-content-tile__body"><ul v-if="categories.length" class="admin-content-links"><li v-for="category in categories" :key="category.id"><RouterLink :to="categoryLink(category.id)"><span>{{ category.title }}</span><AdminIcon name="arrow" :size="14" /></RouterLink></li></ul><p v-else class="admin-content-empty">Категорий пока нет.</p></div>
      </details>
      <details class="admin-content-tile">
        <summary><span class="admin-content-tile__top"><span class="admin-content-tile__icon"><AdminIcon name="building" /></span><AdminIcon name="chevron" class="admin-content-tile__chevron" :size="16" /></span><span class="admin-content-tile__count">{{ cases.length }}</span><strong>Кейсы по категориям</strong><small>Иерархия и количество проектов</small><span class="admin-content-tile__hint">Раскрыть дерево портфолио</span></summary>
        <div class="admin-content-tile__body"><div v-if="categories.length" class="admin-content-tree"><details v-for="category in categories" :key="category.id"><summary><AdminIcon name="chevron" :size="13" /><span>{{ category.title }}</span><span class="admin-content-tree__badge">{{ category.cases.length }}</span></summary><div class="admin-content-tree__children"><RouterLink class="admin-content-tree__category" :to="categoryLink(category.id)">Открыть категорию <AdminIcon name="arrow" :size="12" /></RouterLink><ul class="admin-content-links"><li v-for="item in category.cases" :key="item.id"><RouterLink :to="caseLink(category.id, item.id)"><span>{{ item.title }}</span><AdminIcon name="arrow" :size="12" /></RouterLink></li></ul><p v-if="!category.cases.length" class="admin-content-empty">В категории пока нет кейсов.</p></div></details></div><p v-else class="admin-content-empty">Категорий пока нет.</p></div>
      </details>
      <details class="admin-content-tile">
        <summary><span class="admin-content-tile__top"><span class="admin-content-tile__icon"><AdminIcon name="file" /></span><AdminIcon name="chevron" class="admin-content-tile__chevron" :size="16" /></span><span class="admin-content-tile__count">{{ cases.length }}</span><strong>Всего кейсов</strong><small>Все проекты с быстрым поиском</small><span class="admin-content-tile__hint">Найти нужный кейс</span></summary>
        <div class="admin-content-tile__body"><label class="admin-content-search"><span>Поиск кейса</span><input v-model="search" type="search" placeholder="Название кейса или категории…"></label><p class="admin-content-results" aria-live="polite">Найдено: {{ matchingCases.length }} из {{ cases.length }}</p><ul v-if="matchingCases.length" class="admin-content-links"><li v-for="item in matchingCases" :key="item.id"><RouterLink :to="caseLink(item.categoryId, item.id)"><span>{{ item.title }}<small>{{ item.categoryTitle }}</small></span><AdminIcon name="arrow" :size="14" /></RouterLink></li></ul><p v-else class="admin-content-empty">{{ search ? 'Ничего не найдено. Попробуйте другое название.' : 'Кейсов пока нет.' }}</p></div>
      </details>
    </div>
  </section>
</template>
