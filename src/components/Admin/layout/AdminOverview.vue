<script setup lang="ts">
import { onMounted } from 'vue'
import AdminContentOverview from './AdminContentOverview.vue'
import { useAdminPortfolioOverview } from '../../../composables/Admin/useAdminPortfolioOverview'
import { adminNavigation } from '../../../config/adminNavigation'
import AdminIcon from '../shared/AdminIcon.vue'
const content = useAdminPortfolioOverview()
onMounted(content.load)
defineProps<{ requestsCount: number }>()
defineEmits<{ navigate: [section: string, page: string] }>()
</script>
<template>
  <section class="admin-content admin-overview">
    <div class="admin-content__header"><div><p>Ваш рабочий кабинет</p><h1>Управление сайтом</h1><p class="admin-overview__intro">Контент, страницы и обращения — всё в одном месте.</p></div><span class="admin-environment"><span class="admin-status-dot" /> Сайт подключён</span></div>
    <RouterLink :to="{ path: '/admin', query: { section: 'project-requests', page: 'settings' } }" class="admin-requests-metric"><span class="admin-requests-metric__icon"><AdminIcon name="file" :size="24" /></span><div><span>Новые заявки</span><strong>{{ requestsCount }}</strong><small>Ожидают вашего внимания</small></div><span class="admin-requests-metric__link">Перейти к заявкам <AdminIcon name="arrow" :size="18" /></span></RouterLink>
    <AdminContentOverview :categories="content.categories.value" :is-loading="content.isLoading.value" :error="content.error.value" @retry="content.load" />
    <div class="admin-section-heading"><h2>Страницы сайта</h2><span>Выберите раздел для редактирования</span></div>
    <div class="admin-page-cards"><button v-for="group in adminNavigation" :key="group.id" class="admin-page-card" @click="$emit('navigate', group.items[0].id, group.id)"><span class="admin-page-card__icon"><AdminIcon :name="group.icon" :size="22" /></span><AdminIcon class="admin-page-card__arrow" name="arrow" /><strong>{{ group.label }}</strong><span>{{ group.items.map(item => item.label).join(' · ') }}</span><small>{{ group.items.length }} разделов <span>Открыть →</span></small></button></div>
  </section>
</template>
