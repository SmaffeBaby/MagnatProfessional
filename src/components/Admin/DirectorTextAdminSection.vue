<script setup lang="ts">
import type {
  DirectorTextForm,
  DirectorTextPhotoTarget,
} from '../../composables/Admin/useAdminDirectorText'

defineProps<{
  error: string
  form: DirectorTextForm
  isLoading: boolean
  isSaving: boolean
  successMessage: string
  uploadField: string
}>()

const emit = defineEmits<{
  save: []
  upload: [file: File, target: DirectorTextPhotoTarget]
  deleteFile: [target: DirectorTextPhotoTarget]
}>()

function uploadFile(event: Event, target: DirectorTextPhotoTarget) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    emit('upload', file, target)
  }

  input.value = ''
}
</script>

<template>
  <section class="admin-content">
    <header class="admin-content__header">
      <div>
        <p>Раздел</p>
        <h1>DirectorText компонент</h1>
      </div>
    </header>

    <p v-if="error" class="admin-message admin-message--error">{{ error }}</p>
    <p v-if="successMessage" class="admin-message admin-message--success">{{ successMessage }}</p>

    <form class="panel-form director-text-admin-form" @submit.prevent="$emit('save')">
      <h2>Контент компонента</h2>
      <p v-if="isLoading" class="admin-message">Загружаем данные...</p>

      <label>
        <span>Текст</span>
        <textarea v-model="form.text" rows="7" />
      </label>

      <label>
        <span>Текст на английском</span>
        <textarea v-model="form.textEn" rows="7" />
      </label>

      <div class="panel-form__uploads">
        <label>
          <span>Фото</span>
          <input type="file" accept="image/*" @change="uploadFile($event, 'photo')">
          <small v-if="form.photoUrl">Файл загружен</small>
          <button v-if="form.photoPath" type="button" class="button-secondary" @click="$emit('deleteFile', 'photo')">Удалить файл</button>
        </label>

        <label>
          <span>Миниатюра круглая</span>
          <input type="file" accept="image/*" @change="uploadFile($event, 'thumbnail')">
          <small v-if="form.thumbnailUrl">Файл загружен</small>
          <button v-if="form.thumbnailPath" type="button" class="button-secondary" @click="$emit('deleteFile', 'thumbnail')">Удалить файл</button>
        </label>
      </div>

      <p v-if="uploadField" class="admin-message">Загружаем файл...</p>

      <div class="director-text-admin-form__previews">
        <img
          v-if="form.photoUrl"
          :src="form.photoUrl"
          alt="Превью фото"
        >
        <img
          v-if="form.thumbnailUrl"
          class="director-text-admin-form__preview--round"
          :src="form.thumbnailUrl"
          alt="Превью круглой миниатюры"
        >
      </div>

      <label>
        <span>Имя и Фамилия</span>
        <input v-model="form.name" type="text">
      </label>

      <label>
        <span>Имя и Фамилия на английском</span>
        <input v-model="form.nameEn" type="text">
      </label>

      <label>
        <span>Должность</span>
        <input v-model="form.position" type="text">
      </label>

      <label>
        <span>Должность на английском</span>
        <input v-model="form.positionEn" type="text">
      </label>

      <div class="panel-form__actions">
        <button type="submit" :disabled="isSaving || isLoading || Boolean(uploadField)">
          {{ isSaving ? 'Сохраняем...' : 'Сохранить' }}
        </button>
      </div>
    </form>
  </section>
</template>
