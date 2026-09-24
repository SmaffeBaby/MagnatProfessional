<script setup lang="ts">
import type { PanelForm, PanelUploadTarget } from '../../composables/Admin/useAdminHomePanels'

defineProps<{
  form: PanelForm
  formTitle: string
  isSaving: boolean
  uploadField: string
}>()

const emit = defineEmits<{
  save: []
  reset: []
  upload: [file: File, target: PanelUploadTarget]
}>()

function uploadFile(event: Event, target: PanelUploadTarget) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    emit('upload', file, target)
  }

  input.value = ''
}
</script>

<template>
  <form class="panel-form" @submit.prevent="$emit('save')">
    <h2>{{ formTitle }}</h2>

    <label>
      <span>Название</span>
      <input v-model="form.title" type="text" required>
    </label>

    <label>
      <span>Название[en]</span>
      <input v-model="form.titleEn" type="text">
    </label>

    <label>
      <span>Сортировка</span>
      <input v-model.number="form.sortOrder" type="number" step="1">
    </label>

    <fieldset class="panel-form__gradient">
      <legend>Цвет и Градиент сверху</legend>

      <div class="panel-form__gradient-row">
        <label>
          <span>Верхний цвет</span>
          <input v-model="form.gradientFromColor" type="color">
        </label>
        <label>
          <span>Прозрачность {{ Math.round(form.gradientFromOpacity * 100) }}%</span>
          <input v-model.number="form.gradientFromOpacity" type="range" min="0" max="1" step="0.05">
        </label>
      </div>

      <div class="panel-form__gradient-row">
        <label>
          <span>Нижний цвет</span>
          <input v-model="form.gradientToColor" type="color">
        </label>
        <label>
          <span>Прозрачность {{ Math.round(form.gradientToOpacity * 100) }}%</span>
          <input v-model.number="form.gradientToOpacity" type="range" min="0" max="1" step="0.05">
        </label>
      </div>

      <label>
        <span>Граница градиента {{ form.gradientToPosition }}%</span>
        <input v-model.number="form.gradientToPosition" type="range" min="0" max="100" step="1">
      </label>

      <div
        class="panel-form__gradient-preview"
        :style="{
          background: `linear-gradient(180deg, ${form.gradientFromColor}${Math.round(form.gradientFromOpacity * 255).toString(16).padStart(2, '0')} 0%, ${form.gradientToColor}${Math.round(form.gradientToOpacity * 255).toString(16).padStart(2, '0')} ${form.gradientToPosition}%)`,
        }"
      />
    </fieldset>

    <label>
      <span>Ссылка при нажатии</span>
      <input v-model="form.linkPath" type="text" placeholder="/portfolio/project">
    </label>

    <fieldset class="panel-form__choice">
      <legend>Плашка</legend>
      <label>
        <input v-model="form.tileType" type="radio" value="wide">
        <span>Широкая 890×586</span>
      </label>
      <label>
        <input v-model="form.tileType" type="radio" value="vertical">
        <span>Вертикальная 440×586</span>
      </label>
    </fieldset>

    <div class="panel-form__uploads">
      <label>
        <span>Изображение</span>
        <input type="file" accept="image/*" @change="uploadFile($event, 'image')">
        <small v-if="form.imageUrl">Файл загружен</small>
      </label>

      <label>
        <span>Видео</span>
        <input type="file" accept="video/mp4,video/webm,video/quicktime" @change="uploadFile($event, 'video')">
        <small v-if="form.videoUrl">Файл загружен</small>
      </label>

      <label>
        <span>Фото-заставка</span>
        <input type="file" accept="image/*" @change="uploadFile($event, 'poster')">
        <small v-if="form.posterUrl">Файл загружен</small>
      </label>
    </div>

    <div class="panel-form__preview" :class="`panel-form__preview--${form.tileType}`">
      <video
        v-if="form.videoUrl"
        :src="form.videoUrl"
        :poster="form.posterUrl || form.imageUrl || undefined"
        muted
        controls
      />
      <img
        v-else-if="form.imageUrl || form.posterUrl"
        :src="form.imageUrl || form.posterUrl || ''"
        alt=""
      >
      <span v-else>Превью появится после загрузки файла</span>
    </div>

    <p v-if="uploadField" class="admin-message">Загружаем файл...</p>

    <div class="panel-form__actions">
      <button type="submit" :disabled="isSaving || Boolean(uploadField)">
        {{ isSaving ? 'Сохраняем...' : 'Сохранить' }}
      </button>
      <button type="button" class="button-secondary" @click="$emit('reset')">Сбросить</button>
    </div>
  </form>
</template>
