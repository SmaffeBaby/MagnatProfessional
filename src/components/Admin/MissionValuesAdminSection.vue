<script setup lang="ts">
import type {
  MissionValuesCardForm,
  MissionValuesContentForm,
} from '../../composables/Admin/useAdminMissionValues'
import type { MissionValuesCard } from '../../composables/useMissionValues'
import RichTextColorEditor from './RichTextColorEditor.vue'

defineProps<{
  cards: MissionValuesCard[]
  cardForm: MissionValuesCardForm
  cardFormTitle: string
  contentForm: MissionValuesContentForm
  error: string
  isLoading: boolean
  isSavingCard: boolean
  isSavingContent: boolean
  successMessage: string
}>()

defineEmits<{
  saveContent: []
  newCard: []
  saveCard: []
  resetCard: []
  editCard: [card: MissionValuesCard]
  deleteCard: [card: MissionValuesCard]
}>()
</script>

<template>
  <section class="admin-content">
    <header class="admin-content__header">
      <div>
        <p>Раздел</p>
        <h1>Миссия и ценности</h1>
      </div>
      <button type="button" @click="$emit('newCard')">Новая карточка</button>
    </header>

    <p v-if="error" class="admin-message admin-message--error">{{ error }}</p>
    <p v-if="successMessage" class="admin-message admin-message--success">{{ successMessage }}</p>

    <form class="panel-form mission-values-admin-form" @submit.prevent="$emit('saveContent')">
      <h2>Главный текст</h2>
      <p v-if="isLoading" class="admin-message">Загружаем данные...</p>

      <RichTextColorEditor
        v-model="contentForm.mainTextHtml"
        label="Текст главный"
      />

      <RichTextColorEditor
        v-model="contentForm.mainTextHtmlEn"
        label="Текст главный на английском"
      />

      <div class="panel-form__actions">
        <button type="submit" :disabled="isSavingContent || isLoading">
          {{ isSavingContent ? 'Сохраняем...' : 'Сохранить главный текст' }}
        </button>
      </div>
    </form>

    <div class="admin-grid mission-values-admin-form__cards">
      <form class="panel-form" @submit.prevent="$emit('saveCard')">
        <h2>{{ cardFormTitle }}</h2>

        <label>
          <span>Сортировка</span>
          <input v-model.number="cardForm.sortOrder" type="number" step="1">
        </label>

        <label>
          <span>Название</span>
          <input v-model="cardForm.title" type="text" required>
        </label>

        <label>
          <span>Название на английском</span>
          <input v-model="cardForm.titleEn" type="text">
        </label>

        <label>
          <span>Текст</span>
          <textarea v-model="cardForm.text" rows="5" required />
        </label>

        <label>
          <span>Текст на английском</span>
          <textarea v-model="cardForm.textEn" rows="5" />
        </label>

        <div class="panel-form__actions">
          <button type="submit" :disabled="isSavingCard">
            {{ isSavingCard ? 'Сохраняем...' : 'Сохранить карточку' }}
          </button>
          <button type="button" class="button-secondary" @click="$emit('resetCard')">Сбросить</button>
        </div>
      </form>

      <div class="panel-list">
        <h2>Сохранённые карточки</h2>
        <p v-if="isLoading" class="admin-message">Загружаем данные...</p>
        <article v-for="card in cards" :key="card.id" class="panel-list__item">
          <div>
            <h3>{{ card.title }}</h3>
            <p>{{ card.sortOrder }} · {{ card.text }}</p>
          </div>
          <div class="panel-list__actions">
            <button type="button" @click="$emit('editCard', card)">Изменить</button>
            <button type="button" class="button-danger" @click="$emit('deleteCard', card)">Удалить</button>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
