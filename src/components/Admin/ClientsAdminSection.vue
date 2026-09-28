<script setup lang="ts">
import type { ClientForm } from '../../composables/Admin/useAdminClients'
import type { ClientItem } from '../../composables/useClients'

defineProps<{
  error: string
  form: ClientForm
  formTitle: string
  items: ClientItem[]
  isLoading: boolean
  isSaving: boolean
  uploadField: string
}>()

const emit = defineEmits<{
  newItem: []
  save: []
  reset: []
  upload: [file: File]
  edit: [item: ClientItem]
  delete: [item: ClientItem]
}>()

function uploadFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    emit('upload', file)
  }

  input.value = ''
}
</script>

<template>
  <section class="admin-content">
    <header class="admin-content__header">
      <div>
        <p>Раздел</p>
        <h1>Клиенты</h1>
      </div>
      <button type="button" @click="$emit('newItem')">Новый клиент</button>
    </header>

    <p v-if="error" class="admin-message admin-message--error">{{ error }}</p>

    <div class="admin-grid">
      <form class="panel-form" @submit.prevent="$emit('save')">
        <h2>{{ formTitle }}</h2>

        <label>
          <span>Сортировка</span>
          <input v-model.number="form.sortOrder" type="number" step="1">
        </label>

        <label>
          <span>Изображение 200×200</span>
          <input type="file" accept="image/*" @change="uploadFile">
          <small v-if="form.imageUrl">Файл загружен</small>
        </label>

        <p v-if="uploadField" class="admin-message">Загружаем файл...</p>

        <div v-if="form.imageUrl" class="clients-admin-preview">
          <img :src="form.imageUrl" alt="Превью клиента">
        </div>

        <label>
          <span>Ссылка</span>
          <input v-model="form.linkUrl" type="text" placeholder="https://example.com">
        </label>

        <div class="panel-form__actions">
          <button type="submit" :disabled="isSaving || Boolean(uploadField)">
            {{ isSaving ? 'Сохраняем...' : 'Сохранить' }}
          </button>
          <button type="button" class="button-secondary" @click="$emit('reset')">Сбросить</button>
        </div>
      </form>

      <div class="panel-list">
        <h2>Сохранённые клиенты</h2>
        <p v-if="isLoading" class="admin-message">Загружаем данные...</p>
        <article v-for="item in items" :key="item.id" class="panel-list__item">
          <div class="clients-admin-list-item">
            <img :src="item.imageUrl" alt="">
            <div>
              <h3>Клиент #{{ item.sortOrder }}</h3>
              <p>{{ item.linkUrl || 'Без ссылки' }}</p>
            </div>
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
