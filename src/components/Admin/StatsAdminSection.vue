<script setup lang="ts">
import type { StatsForm } from '../../composables/Admin/useAdminStats'
import type { StatsItem } from '../../composables/useStats'

defineProps<{
  error: string
  form: StatsForm
  formTitle: string
  items: StatsItem[]
  isLoading: boolean
  isSaving: boolean
}>()

defineEmits<{
  newItem: []
  save: []
  reset: []
  edit: [item: StatsItem]
  delete: [item: StatsItem]
}>()
</script>

<template>
  <section class="admin-content">
    <header class="admin-content__header">
      <div>
        <p>Раздел</p>
        <h1>Stats компонент</h1>
      </div>
      <button type="button" @click="$emit('newItem')">Новый показатель</button>
    </header>

    <p v-if="error" class="admin-message admin-message--error">{{ error }}</p>

    <div class="admin-grid">
      <form class="panel-form" @submit.prevent="$emit('save')">
        <h2>{{ formTitle }}</h2>

        <label>
          <span>Ввод числа</span>
          <input v-model="form.numberText" type="text" required>
        </label>

        <label>
          <span>Сортировка</span>
          <input v-model.number="form.sortOrder" type="number" step="1">
        </label>

        <label>
          <span>Текст</span>
          <textarea v-model="form.text" rows="4" required />
        </label>

        <label>
          <span>Текст на английском</span>
          <textarea v-model="form.textEn" rows="4" />
        </label>

        <div class="panel-form__actions">
          <button type="submit" :disabled="isSaving">
            {{ isSaving ? 'Сохраняем...' : 'Сохранить' }}
          </button>
          <button type="button" class="button-secondary" @click="$emit('reset')">Сбросить</button>
        </div>
      </form>

      <div class="panel-list">
        <h2>Сохранённые показатели</h2>
        <p v-if="isLoading" class="admin-message">Загружаем данные...</p>
        <article v-for="item in items" :key="item.id" class="panel-list__item">
          <div>
            <h3>{{ item.numberText }}</h3>
            <p>{{ item.sortOrder }} · {{ item.text }}</p>
          </div>
          <div class="panel-list__actions">
            <button type="button" @click="$emit('edit', item)">Изменить</button>
            <button type="button" class="button-danger" @click="$emit('delete', item)">Удалить</button>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
