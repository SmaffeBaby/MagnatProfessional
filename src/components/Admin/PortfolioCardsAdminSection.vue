<script setup lang="ts">
import type { HomePanel, PortfolioCard } from '../../composables/useHomePanels'
import type { PanelUploadTarget, PortfolioCardForm } from '../../composables/Admin/useAdminHomePanels'

defineProps<{
  cards: PortfolioCard[]
  form: PortfolioCardForm
  formTitle: string
  isLoading: boolean
  isSaving: boolean
  selectedPanel: HomePanel | null
  uploadField: string
}>()

const emit = defineEmits<{
  newCard: []
  save: []
  reset: []
  upload: [file: File, target: Exclude<PanelUploadTarget, 'mascot'>]
  deleteFile: [target: Exclude<PanelUploadTarget, 'mascot'>]
  edit: [card: PortfolioCard]
  delete: [card: PortfolioCard]
}>()

function uploadFile(event: Event, target: Exclude<PanelUploadTarget, 'mascot'>) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    emit('upload', file, target)
  }

  input.value = ''
}
</script>

<template>
  <section class="panel-list portfolio-cards-admin">
    <header class="portfolio-cards-admin__header">
      <div>
        <p>Вложенный раздел</p>
        <h2>Карточки детальной страницы</h2>
        <small v-if="selectedPanel">Панель: {{ selectedPanel.title }}</small>
        <small v-else>Выберите панель через кнопку “Карточки”.</small>
      </div>
      <button type="button" :disabled="!selectedPanel" @click="$emit('newCard')">Новая карточка</button>
    </header>

    <div v-if="selectedPanel" class="admin-grid">
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

        <p class="admin-message">Ссылка формируется автоматически: {{ form.linkPath }}</p>

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
        </fieldset>

        <fieldset class="panel-form__choice">
          <legend>Плашка</legend>
          <label>
            <input v-model="form.tileType" type="radio" value="vertical">
            <span>Вертикальная</span>
          </label>
          <label>
            <input v-model="form.tileType" type="radio" value="wide">
            <span>Широкая</span>
          </label>
        </fieldset>

        <div class="panel-form__uploads">
          <label>
            <span>Изображение</span>
            <input type="file" accept="image/*" @change="uploadFile($event, 'image')">
            <small v-if="form.imageUrl">Файл загружен</small>
            <button v-if="form.imagePath" type="button" class="button-secondary" @click="$emit('deleteFile', 'image')">Удалить файл</button>
          </label>

          <label>
            <span>Видео</span>
            <input type="file" accept="video/mp4,video/webm,video/quicktime" @change="uploadFile($event, 'video')">
            <small v-if="form.videoUrl">Файл загружен</small>
            <button v-if="form.videoPath" type="button" class="button-secondary" @click="$emit('deleteFile', 'video')">Удалить файл</button>
          </label>

          <label>
            <span>Фото-заставка</span>
            <input type="file" accept="image/*" @change="uploadFile($event, 'poster')">
            <small v-if="form.posterUrl">Файл загружен</small>
            <button v-if="form.posterPath" type="button" class="button-secondary" @click="$emit('deleteFile', 'poster')">Удалить файл</button>
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

        <p v-if="uploadField.startsWith('card-')" class="admin-message">Загружаем файл...</p>

        <div class="panel-form__actions">
          <button type="submit" :disabled="isSaving || uploadField.startsWith('card-')">
            {{ isSaving ? 'Сохраняем...' : 'Сохранить карточку' }}
          </button>
          <button type="button" class="button-secondary" @click="$emit('reset')">Сбросить</button>
        </div>
      </form>

      <div class="panel-list">
        <h2>Карточки</h2>
        <p v-if="isLoading" class="admin-message">Загружаем данные...</p>
        <article v-for="card in cards" :key="card.id" class="panel-list__item">
          <div>
            <h3>{{ card.title }}</h3>
            <p>{{ card.sortOrder }} · {{ card.tileType === 'wide' ? 'Широкая' : 'Вертикальная' }} · {{ card.linkPath }}</p>
          </div>
          <div class="panel-list__actions">
            <button type="button" @click="$emit('edit', card)">Изменить</button>
            <button type="button" class="button-danger" @click="$emit('delete', card)">Удалить</button>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
