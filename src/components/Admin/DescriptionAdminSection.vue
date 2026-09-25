<script setup lang="ts">
import type {
  DescriptionForm,
  DescriptionPlaqueTarget,
} from '../../composables/Admin/useAdminDescription'

defineProps<{
  error: string
  form: DescriptionForm
  isLoading: boolean
  isSaving: boolean
  successMessage: string
  uploadField: string
}>()

const emit = defineEmits<{
  save: []
  upload: [file: File, target: DescriptionPlaqueTarget]
}>()

function uploadFile(event: Event, target: DescriptionPlaqueTarget) {
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
        <h1>Описание компонент</h1>
      </div>
    </header>

    <p v-if="error" class="admin-message admin-message--error">{{ error }}</p>
    <p v-if="successMessage" class="admin-message admin-message--success">{{ successMessage }}</p>

    <form class="panel-form description-admin-form" @submit.prevent="$emit('save')">
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
        <span>Текст в плашке</span>
        <textarea v-model="form.cardText" rows="5" />
      </label>

      <label>
        <span>Текст в плашке на английском</span>
        <textarea v-model="form.cardTextEn" rows="5" />
      </label>

      <div class="panel-form__uploads">
        <label>
          <span>Плашка для ПК 664×440</span>
          <input type="file" accept="image/*" @change="uploadFile($event, 'desktopPlaque')">
          <small v-if="form.desktopPlaqueUrl">Файл загружен</small>
        </label>

        <label>
          <span>Плашка для tablet 452×440</span>
          <input type="file" accept="image/*" @change="uploadFile($event, 'tabletPlaque')">
          <small v-if="form.tabletPlaqueUrl">Файл загружен</small>
        </label>

        <label>
          <span>Плашка для телефона 335×440</span>
          <input type="file" accept="image/*" @change="uploadFile($event, 'mobilePlaque')">
          <small v-if="form.mobilePlaqueUrl">Файл загружен</small>
        </label>
      </div>

      <p v-if="uploadField" class="admin-message">Загружаем файл...</p>

      <div class="description-admin-form__previews">
        <img
          v-if="form.desktopPlaqueUrl"
          :src="form.desktopPlaqueUrl"
          alt="Превью плашки для ПК"
        >
        <img
          v-if="form.tabletPlaqueUrl"
          :src="form.tabletPlaqueUrl"
          alt="Превью плашки для tablet"
        >
        <img
          v-if="form.mobilePlaqueUrl"
          :src="form.mobilePlaqueUrl"
          alt="Превью плашки для телефона"
        >
      </div>

      <div class="panel-form__actions">
        <button type="submit" :disabled="isSaving || isLoading || Boolean(uploadField)">
          {{ isSaving ? 'Сохраняем...' : 'Сохранить' }}
        </button>
      </div>
    </form>
  </section>
</template>
