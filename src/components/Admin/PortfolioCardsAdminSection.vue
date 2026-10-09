<script setup lang="ts">
import { ref } from 'vue'
import type { HomePanel, PortfolioArticleBlockLayout, PortfolioCard } from '../../composables/useHomePanels'
import type { PanelUploadTarget, PortfolioCardForm, PortfolioCaseForm } from '../../composables/Admin/useAdminHomePanels'

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

function uploadArticleImage(event: Event, blockId: string, groupId: string) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    emit('uploadArticleImage', file, blockId, groupId)
  }

  input.value = ''
}

function uploadCaseHero(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    emit('uploadCaseHero', file)
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
            <button type="button" @click="$emit('editCase', card)">Кейсы</button>
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

    <section v-if="selectedPanel" class="portfolio-case-admin">
      <header class="portfolio-case-admin__header">
        <div>
          <p>Кейс</p>
          <h2>{{ caseFormTitle }}</h2>
          <small v-if="caseForm.cardId">{{ caseForm.linkPath }}</small>
          <small v-else>Выберите карточку через кнопку “Кейсы”.</small>
        </div>
        <button type="button" class="button-secondary" :disabled="!caseForm.cardId" @click="$emit('resetCase')">Закрыть кейс</button>
      </header>

      <form v-if="caseForm.cardId" class="panel-form portfolio-case-admin__form" @submit.prevent="$emit('saveCase')">
        <fieldset class="portfolio-article-admin portfolio-article-admin--hero">
          <legend>Начальное большое изображение</legend>

          <label>
            <span>Загрузить широкое изображение кейса</span>
            <input type="file" accept="image/*" @change="uploadCaseHero">
            <small v-if="caseForm.caseHeroUrl">Файл загружен</small>
          </label>

          <div v-if="caseForm.caseHeroUrl" class="panel-form__preview panel-form__preview--wide">
            <img :src="caseForm.caseHeroUrl" alt="">
          </div>

          <button v-if="caseForm.caseHeroPath" type="button" class="button-secondary" @click="$emit('deleteCaseHero')">Удалить начальное изображение</button>
        </fieldset>

        <fieldset class="portfolio-article-admin">
          <legend>Конструктор статьи</legend>

          <div class="portfolio-article-admin__actions">
            <button type="button" class="button-secondary" @click="$emit('addArticleBlock', 'single-wide')">+ Блок: одно большое</button>
            <button type="button" class="button-secondary" @click="$emit('addArticleBlock', 'two-medium')">+ Блок: два средних</button>
            <button type="button" class="button-secondary" @click="$emit('addArticleBlock', 'three-vertical')">+ Блок: три вертикальных</button>
          </div>

          <article
            v-for="(block, index) in caseForm.articleBlocks"
            :key="block.id"
            class="portfolio-article-admin__block"
          >
            <header class="portfolio-article-admin__block-header">
              <h3>Блок {{ index + 1 }}</h3>
              <div>
                <button type="button" class="button-secondary" :disabled="index === 0" @click="$emit('moveArticleBlock', block.id, -1)">Выше</button>
                <button type="button" class="button-secondary" :disabled="index === caseForm.articleBlocks.length - 1" @click="$emit('moveArticleBlock', block.id, 1)">Ниже</button>
                <button type="button" class="button-danger" @click="$emit('removeArticleBlock', block.id)">Удалить блок</button>
              </div>
            </header>

            <label>
              <span>Заголовок блока</span>
              <input v-model="block.title" type="text">
            </label>

            <label>
              <span>Заголовок блока[en]</span>
              <input v-model="block.titleEn" type="text">
            </label>

            <label>
              <span>Текст блока</span>
              <textarea v-model="block.text" rows="4"></textarea>
            </label>

            <label>
              <span>Текст блока[en]</span>
              <textarea v-model="block.textEn" rows="4"></textarea>
            </label>

            <div class="portfolio-article-admin__groups">
              <article
                v-for="(group, groupIndex) in block.imageGroups"
                :key="group.id"
                class="portfolio-article-admin__group"
              >
                <header class="portfolio-article-admin__group-header">
                  <h4>Группа изображений {{ groupIndex + 1 }}</h4>
                  <button type="button" class="button-secondary" @click="$emit('removeArticleImageGroup', block.id, group.id)">Удалить группу</button>
                </header>

                <div v-if="group.images.length" class="portfolio-article-admin__images">
                  <div
                    v-for="image in group.images"
                    :key="image.id"
                    class="portfolio-article-admin__image"
                  >
                    <img :src="image.url" alt="">
                    <button type="button" class="button-secondary" @click="$emit('deleteArticleImage', block.id, group.id, image.id)">Удалить</button>
                  </div>
                </div>

                <label>
                  <span>Добавить изображение</span>
                  <input type="file" accept="image/*" @change="uploadArticleImage($event, block.id, group.id)">
                </label>

                <div class="portfolio-article-admin__group-controls">
                  <label>
                    <span>Тип блока изображений</span>
                    <select v-model="group.layout">
                      <option value="single-wide">Одно большое</option>
                      <option value="two-medium">Два средних</option>
                      <option value="three-vertical">Три вертикальных</option>
                    </select>
                  </label>
                  <button type="button" class="button-secondary" @click="$emit('addArticleImageGroup', block.id, 'single-wide')">+</button>
                </div>
              </article>

              <button
                v-if="!block.imageGroups?.length"
                type="button"
                class="button-secondary"
                @click="$emit('addArticleImageGroup', block.id, 'single-wide')"
              >
                + Добавить группу изображений
              </button>
            </div>
          </article>
        </fieldset>

        <p v-if="uploadField.startsWith('article-')" class="admin-message">Загружаем изображение статьи...</p>

        <div class="panel-form__actions">
          <button type="submit" :disabled="isSaving || uploadField.startsWith('article-')">
            {{ isSaving ? 'Сохраняем...' : 'Сохранить кейс' }}
          </button>
          <button type="button" class="button-secondary" @click="$emit('resetCase')">Сбросить</button>
        </div>
      </form>
    </section>
  </section>
</template>
