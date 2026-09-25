<script setup lang="ts">
import type { AboutUsForm } from '../../composables/Admin/useAdminAboutUs'

defineProps<{
  error: string
  form: AboutUsForm
  isLoading: boolean
  isSaving: boolean
  successMessage: string
}>()

defineEmits<{
  save: []
}>()
</script>

<template>
  <section class="admin-content">
    <header class="admin-content__header">
      <div>
        <p>Раздел</p>
        <h1>О нас компонент</h1>
      </div>
    </header>

    <p v-if="error" class="admin-message admin-message--error">{{ error }}</p>
    <p v-if="successMessage" class="admin-message admin-message--success">{{ successMessage }}</p>

    <form class="panel-form about-us-admin-form" @submit.prevent="$emit('save')">
      <h2>Контент компонента</h2>
      <p v-if="isLoading" class="admin-message">Загружаем данные...</p>

      <label>
        <span>Текст</span>
        <textarea v-model="form.text" rows="5" />
      </label>

      <label>
        <span>Текст на английском</span>
        <textarea v-model="form.textEn" rows="5" />
      </label>

      <label>
        <span>Текст кнопки</span>
        <input v-model="form.buttonText" type="text">
      </label>

      <label>
        <span>Текст кнопки на английском</span>
        <input v-model="form.buttonTextEn" type="text">
      </label>

      <div class="panel-form__actions">
        <button type="submit" :disabled="isSaving || isLoading">
          {{ isSaving ? 'Сохраняем...' : 'Сохранить' }}
        </button>
      </div>
    </form>
  </section>
</template>
