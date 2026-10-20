<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AdminPagination from '../shared/AdminPagination.vue'
import PortfolioCaseAdminEditor from './PortfolioCaseAdminEditor.vue'
import { useRoute, useRouter } from 'vue-router'
import type { HomePanel, PortfolioArticleBlockLayout, PortfolioCard } from '../../../composables/useHomePanels'
import type { PanelUploadTarget, PortfolioCardForm, PortfolioCaseForm } from '../../../composables/Admin/useAdminHomePanels'

const props = defineProps<{
  cards: PortfolioCard[]
  panels: HomePanel[]
  form: PortfolioCardForm
  caseForm: PortfolioCaseForm
  formTitle: string
  caseFormTitle: string
  isLoading: boolean
  isSaving: boolean
  selectedPanel: HomePanel | null
  uploadField: string
  error: string
}>()

const emit = defineEmits<{
  newCard: []
  save: []
  saveCase: []
  reset: []
  resetCase: []
  upload: [file: File, target: Exclude<PanelUploadTarget, 'mascot'>]
  uploadCaseHero: [file: File]
  uploadArticleImage: [file: File, blockId: string, groupId: string]
  deleteFile: [target: Exclude<PanelUploadTarget, 'mascot'>]
  deleteCaseHero: []
  deleteArticleImage: [blockId: string, groupId: string, imageId: string]
  addArticleBlock: [layout?: PortfolioArticleBlockLayout]
  addArticleImageGroup: [blockId: string, layout?: PortfolioArticleBlockLayout]
  removeArticleImageGroup: [blockId: string, groupId: string]
  removeArticleBlock: [blockId: string]
  moveArticleBlock: [blockId: string, direction: -1 | 1]
  edit: [card: PortfolioCard]
  editCase: [card: PortfolioCard]
  delete: [card: PortfolioCard]
  transfer: [card: PortfolioCard, targetPanelId: string, mode: 'move' | 'copy']
}>()

const route = useRoute()
const router = useRouter()
const caseId = computed(() => String(route.query.case || ''))
const currentCase = computed(() => props.cards.find(card => card.id === caseId.value))
function openCase(card: PortfolioCard) {
  router.push({ query: { ...route.query, case: card.id, caseTab: 'content' } })
}
function closeCase() {
  router.push({ query: { ...route.query, case: undefined, caseTab: undefined }, hash: '' })
}
function restoreCase() {
  if (currentCase.value && !props.isLoading) emit('editCase', currentCase.value)
}
watch([caseId, () => props.cards, () => props.isLoading], restoreCase, { immediate: true })
const page = ref(1)
const pageSize = 6
const visibleCards = computed(() => props.cards.slice((page.value - 1) * pageSize, page.value * pageSize))
watch(() => props.selectedPanel?.id, () => { page.value = 1 })
watch(() => props.cards.length, length => { page.value = Math.min(page.value, Math.max(1, Math.ceil(length / pageSize))) })
const transferPanelIds = ref<Record<string, string>>({})

function availablePanels(card: PortfolioCard) {
  return props.panels.filter((panel) => panel.id !== card.panelId)
}

function transferCard(card: PortfolioCard, mode: 'move' | 'copy') {
  const targetPanelId = transferPanelIds.value[card.id]

  if (!targetPanelId) {
    window.alert('Выберите панель для переноса или копирования карточки.')
    return
  }

  emit('transfer', card, targetPanelId, mode)
}

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
  <section v-if="!caseId" class="panel-list portfolio-cards-admin">
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
        <h2>Карточки</h2><AdminPagination v-model="page" :total="cards.length" :page-size="pageSize" />
        <p v-if="isLoading" class="admin-message">Загружаем данные...</p>
        <article v-for="card in visibleCards" :key="card.id" class="panel-list__item">
          <div>
            <h3>{{ card.title }}</h3>
            <p>{{ card.sortOrder }} · {{ card.tileType === 'wide' ? 'Широкая' : 'Вертикальная' }} · {{ card.linkPath }}</p>
          </div>
          <div class="panel-list__actions">
            <button type="button" @click="$emit('edit', card)">Изменить</button>
            <button type="button" @click="openCase(card)">Открыть кейс →</button>
            <label class="portfolio-card-transfer">
              <span>В другую панель</span>
              <select v-model="transferPanelIds[card.id]" :disabled="isSaving || availablePanels(card).length === 0">
                <option value="">Выбрать панель</option>
                <option v-for="panel in availablePanels(card)" :key="panel.id" :value="panel.id">
                  {{ panel.title }}
                </option>
              </select>
            </label>
            <button type="button" class="button-secondary" :disabled="isSaving || !transferPanelIds[card.id]" @click="transferCard(card, 'copy')">Копировать</button>
            <button type="button" class="button-secondary" :disabled="isSaving || !transferPanelIds[card.id]" @click="transferCard(card, 'move')">Переместить</button>
            <button type="button" class="button-danger" @click="$emit('delete', card)">Удалить</button>
          </div>
        </article>
      </div>
    </div>


  </section>
  <div v-else-if="isLoading" class="admin-message" role="status">Загружаем кейс…</div>
  <div v-else-if="!currentCase" class="admin-empty"><h2>Кейс не найден</h2><button @click="closeCase">Вернуться к карточкам</button></div>
  <PortfolioCaseAdminEditor v-else-if="caseForm.cardId === caseId" :case-form="caseForm" :is-saving="isSaving" :upload-field="uploadField" :error="error"
    @close="closeCase" @save-case="$emit('saveCase')" @reset-case="restoreCase"
    @upload-case-hero="file => $emit('uploadCaseHero', file)" @delete-case-hero="$emit('deleteCaseHero')"
    @upload-article-image="(file, blockId, groupId) => $emit('uploadArticleImage', file, blockId, groupId)"
    @delete-article-image="(blockId, groupId, imageId) => $emit('deleteArticleImage', blockId, groupId, imageId)"
    @add-article-block="layout => $emit('addArticleBlock', layout)"
    @add-article-image-group="(blockId, layout) => $emit('addArticleImageGroup', blockId, layout)"
    @remove-article-image-group="(blockId, groupId) => $emit('removeArticleImageGroup', blockId, groupId)"
    @remove-article-block="blockId => $emit('removeArticleBlock', blockId)"
    @move-article-block="(blockId, direction) => $emit('moveArticleBlock', blockId, direction)" />
</template>
