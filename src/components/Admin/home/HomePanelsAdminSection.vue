<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { HomePanel, PortfolioArticleBlockLayout, PortfolioCard } from '../../../composables/useHomePanels'
import type { PanelForm, PanelUploadTarget, PortfolioCardForm, PortfolioCaseForm } from '../../../composables/Admin/useAdminHomePanels'
import HomePanelsAdminForm from './HomePanelsAdminForm.vue'
import HomePanelsAdminList from './HomePanelsAdminList.vue'
import PortfolioCardsAdminSection from './PortfolioCardsAdminSection.vue'

const props = defineProps<{
  error: string
  form: PanelForm
  cardForm: PortfolioCardForm
  caseForm: PortfolioCaseForm
  formTitle: string
  cardFormTitle: string
  caseFormTitle: string
  panels: HomePanel[]
  cards: PortfolioCard[]
  selectedPanel: HomePanel | null
  isLoading: boolean
  isLoadingCards: boolean
  isSaving: boolean
  isSavingCard: boolean
  uploadField: string
}>()

const emit = defineEmits<{
  newPanel: []
  save: []
  reset: []
  newCard: []
  upload: [file: File, target: PanelUploadTarget]
  uploadCard: [file: File, target: Exclude<PanelUploadTarget, 'mascot'>]
  uploadCaseHero: [file: File]
  uploadArticleImage: [file: File, blockId: string, groupId: string]
  deleteFile: [target: PanelUploadTarget]
  deleteCardFile: [target: Exclude<PanelUploadTarget, 'mascot'>]
  deleteCaseHero: []
  deleteArticleImage: [blockId: string, groupId: string, imageId: string]
  addArticleBlock: [layout?: PortfolioArticleBlockLayout]
  addArticleImageGroup: [blockId: string, layout?: PortfolioArticleBlockLayout]
  removeArticleImageGroup: [blockId: string, groupId: string]
  removeArticleBlock: [blockId: string]
  moveArticleBlock: [blockId: string, direction: -1 | 1]
  edit: [panel: HomePanel]
  selectCards: [panel: HomePanel]
  delete: [panel: HomePanel]
  saveCard: []
  saveCase: []
  resetCard: []
  resetCase: []
  editCard: [card: PortfolioCard]
  editCase: [card: PortfolioCard]
  deleteCard: [card: PortfolioCard]
  transferCard: [card: PortfolioCard, targetPanelId: string, mode: 'move' | 'copy']
  exportPanels: []
  importPanels: [file: File]
}>()

const route = useRoute()
const router = useRouter()
const panelId = computed(() => String(route.query.panel || ''))
const currentPanel = computed(() => props.panels.find(panel => panel.id === panelId.value))
const caseId = computed(() => String(route.query.case || ''))
const currentCase = computed(() => props.cards.find(card => card.id === caseId.value))
const tab = computed(() => !caseId.value && route.query.tab === 'settings' ? 'settings' : 'cards')
function openPanel(panel: HomePanel, view = 'cards') {
  router.push({ query: { ...route.query, panel: panel.id, tab: view, case: undefined, caseTab: undefined } })
}
function backToPanels() {
  router.push({ query: { ...route.query, panel: undefined, tab: undefined, case: undefined, caseTab: undefined } })
}
function createPanel() {
  emit('newPanel')
  router.push({ query: { ...route.query, panel: 'new', tab: 'settings', case: undefined, caseTab: undefined } })
}
watch([panelId, () => props.panels], () => {
  if (currentPanel.value) {
    emit('edit', currentPanel.value)
    if (props.selectedPanel?.id !== currentPanel.value.id) emit('selectCards', currentPanel.value)
  } else if (panelId.value === 'new') emit('newPanel')
}, { immediate: true })
watch(() => props.isSaving, (saving, previous) => {
  if (previous && !saving && !props.error) backToPanels()
})

const importInput = ref<HTMLInputElement | null>(null)

function chooseImportFile() {
  importInput.value?.click()
}

function importFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    emit('importPanels', file)
  }

  input.value = ''
}
</script>

<template>
  <section class="admin-content">
    <nav class="admin-breadcrumbs" aria-label="Навигационная цепочка">
      <RouterLink to="/admin">Обзор</RouterLink><span>/</span>
      <RouterLink :to="{ path: '/admin', query: { section: 'home-panels', page: 'home' } }">Главная</RouterLink><span>/</span>
      <button class="admin-text-button" @click="backToPanels">Панели на главной</button>
      <template v-if="panelId"><span>/</span><button v-if="caseId && currentPanel" class="admin-text-button" @click="openPanel(currentPanel)">{{ currentPanel.title }}</button><strong v-else aria-current="page">{{ panelId === 'new' ? 'Новая панель' : currentPanel?.title || 'Панель' }}</strong></template>
      <template v-if="caseId && currentPanel"><span>/</span><button class="admin-text-button" @click="openPanel(currentPanel)">Карточки и кейсы</button><span>/</span><strong aria-current="page">{{ currentCase?.title || 'Кейс' }}</strong></template>
    </nav>
    <header v-if="!caseId" class="admin-content__header">
      <div>
        <p>{{ panelId ? 'Редактирование панели' : 'Главная страница' }}</p>
        <h1>{{ panelId === 'new' ? 'Новая панель' : currentPanel?.title || 'Панели на главной' }}</h1>
        <p class="admin-overview__intro">{{ panelId ? 'Управляйте содержимым и оформлением выбранной панели.' : 'Визуальные разделы главной страницы. Откройте панель, чтобы перейти к карточкам.' }}</p>
      </div>
      <div class="admin-content__header-actions">
        <button type="button" class="button-secondary" @click="$emit('exportPanels')">Экспорт ZIP</button>
        <button type="button" class="button-secondary" @click="chooseImportFile">Импорт ZIP</button>
        <input ref="importInput" class="admin-file-input" type="file" accept=".zip,application/zip" @change="importFile">
        <button v-if="!panelId" type="button" @click="createPanel">+ Новая панель</button><button v-else type="button" class="button-secondary" @click="backToPanels">← Все панели</button>
      </div>
    </header>

    <p v-if="error" class="admin-message admin-message--error">{{ error }}</p>

    <HomePanelsAdminList v-if="!panelId" :panels="panels" :is-loading="isLoading" @edit="panel => openPanel(panel, 'settings')" @select-cards="panel => openPanel(panel)" @delete="panel => $emit('delete', panel)" />
    <div v-else-if="panelId !== 'new' && !currentPanel && !isLoading" class="admin-empty"><h2>Панель не найдена</h2><button @click="backToPanels">Вернуться к списку</button></div>
    <nav v-if="currentPanel && !caseId" class="admin-tabs" aria-label="Разделы панели"><button :class="{ 'admin-tabs__active': tab === 'cards' }" @click="openPanel(currentPanel, 'cards')">Карточки и кейсы <span>{{ selectedPanel?.id === currentPanel.id ? cards.length : '…' }}</span></button><button :class="{ 'admin-tabs__active': tab === 'settings' }" @click="openPanel(currentPanel, 'settings')">Настройки панели</button></nav>
    <HomePanelsAdminForm
      v-if="panelId === 'new' || (currentPanel && tab === 'settings')"
      :form="form" :form-title="formTitle" :is-saving="isSaving" :upload-field="uploadField"
      @save="$emit('save')" @reset="currentPanel ? $emit('edit', currentPanel) : $emit('reset')"
      @upload="(file, target) => $emit('upload', file, target)" @delete-file="target => $emit('deleteFile', target)"
    />

    <PortfolioCardsAdminSection
      v-if="currentPanel && selectedPanel?.id === currentPanel.id && tab === 'cards'"
      :error="error"
      :cards="cards"
      :panels="panels"
      :form="cardForm"
      :case-form="caseForm"
      :form-title="cardFormTitle"
      :case-form-title="caseFormTitle"
      :is-loading="isLoadingCards"
      :is-saving="isSavingCard"
      :selected-panel="selectedPanel"
      :upload-field="uploadField"
      @new-card="$emit('newCard')"
      @save="$emit('saveCard')"
      @save-case="$emit('saveCase')"
      @reset="$emit('resetCard')"
      @reset-case="$emit('resetCase')"
      @upload="(file, target) => $emit('uploadCard', file, target)"
      @upload-case-hero="(file) => $emit('uploadCaseHero', file)"
      @upload-article-image="(file, blockId, groupId) => $emit('uploadArticleImage', file, blockId, groupId)"
      @delete-file="(target) => $emit('deleteCardFile', target)"
      @delete-case-hero="$emit('deleteCaseHero')"
      @delete-article-image="(blockId, groupId, imageId) => $emit('deleteArticleImage', blockId, groupId, imageId)"
      @add-article-block="(layout) => $emit('addArticleBlock', layout)"
      @add-article-image-group="(blockId, layout) => $emit('addArticleImageGroup', blockId, layout)"
      @remove-article-image-group="(blockId, groupId) => $emit('removeArticleImageGroup', blockId, groupId)"
      @remove-article-block="(blockId) => $emit('removeArticleBlock', blockId)"
      @move-article-block="(blockId, direction) => $emit('moveArticleBlock', blockId, direction)"
      @edit="(card) => $emit('editCard', card)"
      @edit-case="(card) => $emit('editCase', card)"
      @delete="(card) => $emit('deleteCard', card)"
      @transfer="(card, targetPanelId, mode) => $emit('transferCard', card, targetPanelId, mode)"
    />
  </section>
</template>
