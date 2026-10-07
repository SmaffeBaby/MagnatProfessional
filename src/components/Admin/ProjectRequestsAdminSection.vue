<script setup lang="ts">
import type { ProjectRequest, ProjectRequestStatus } from '../../composables/Admin/useAdminProjectRequests'

defineProps<{
  error: string
  requests: ProjectRequest[]
  statusFilter: 'all' | ProjectRequestStatus
  searchQuery: string
  isLoading: boolean
  hasActiveFilters: boolean
}>()

const emit = defineEmits<{
  'update:statusFilter': [value: 'all' | ProjectRequestStatus]
  'update:searchQuery': [value: string]
  refresh: []
  resetFilters: []
  updateStatus: [request: ProjectRequest, status: ProjectRequestStatus]
  delete: [request: ProjectRequest]
}>()

const statusLabels: Record<ProjectRequestStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  closed: 'Закрыта',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
</script>

<template>
  <section class="admin-content">
    <header class="admin-content__header">
      <div>
        <p>Раздел</p>
        <h1>Заявки</h1>
      </div>
      <button type="button" @click="$emit('refresh')">Обновить</button>
    </header>

    <p v-if="error" class="admin-message admin-message--error">{{ error }}</p>

    <div class="project-requests-admin">
      <form class="panel-form project-requests-admin__filters" @submit.prevent="$emit('refresh')">
        <h2>Фильтры</h2>

        <label>
          <span>Статус</span>
          <select
            :value="statusFilter"
            @change="$emit('update:statusFilter', ($event.target as HTMLSelectElement).value as 'all' | ProjectRequestStatus)"
          >
            <option value="all">Все заявки</option>
            <option value="new">Новые</option>
            <option value="in_progress">В работе</option>
            <option value="closed">Закрытые</option>
          </select>
        </label>

        <label>
          <span>Поиск</span>
          <input
            :value="searchQuery"
            type="search"
            placeholder="Имя, телефон, email или сообщение"
            @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          >
        </label>

        <div class="panel-form__actions">
          <button type="submit" :disabled="isLoading">{{ isLoading ? 'Загружаем...' : 'Применить' }}</button>
          <button
            v-if="hasActiveFilters"
            type="button"
            class="button-secondary"
            @click="$emit('resetFilters')"
          >
            Сбросить
          </button>
        </div>
      </form>

      <div class="panel-list project-requests-admin__list">
        <h2>Список заявок</h2>
        <p v-if="isLoading" class="admin-message">Загружаем данные...</p>
        <p v-else-if="requests.length === 0" class="admin-message">Заявок пока нет</p>

        <article
          v-for="request in requests"
          :key="request.id"
          class="project-request-card"
          :class="{ 'project-request-card--new': request.status === 'new' }"
        >
          <div class="project-request-card__header">
            <div>
              <h3>{{ request.name }}</h3>
              <p>{{ formatDate(request.createdAt) }}</p>
            </div>
            <span class="project-request-card__status">{{ statusLabels[request.status] }}</span>
          </div>

          <dl class="project-request-card__details">
            <div>
              <dt>Телефон</dt>
              <dd>{{ request.phone || 'Не указан' }}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{{ request.email || 'Не указан' }}</dd>
            </div>
            <div>
              <dt>Источник</dt>
              <dd>{{ request.source || 'project-form' }}</dd>
            </div>
          </dl>

          <p v-if="request.message" class="project-request-card__message">{{ request.message }}</p>

          <div class="panel-list__actions">
            <button
              v-if="request.status !== 'new'"
              type="button"
              class="button-secondary"
              @click="$emit('updateStatus', request, 'new')"
            >
              Новая
            </button>
            <button
              v-if="request.status !== 'in_progress'"
              type="button"
              @click="$emit('updateStatus', request, 'in_progress')"
            >
              В работе
            </button>
            <button
              v-if="request.status !== 'closed'"
              type="button"
              class="button-secondary"
              @click="$emit('updateStatus', request, 'closed')"
            >
              Закрыть
            </button>
            <button type="button" class="button-danger" @click="$emit('delete', request)">Удалить</button>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
