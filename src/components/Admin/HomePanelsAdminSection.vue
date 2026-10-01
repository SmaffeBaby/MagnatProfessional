<script setup lang="ts">
import type { HomePanel, PortfolioArticleBlockLayout, PortfolioCard } from '../../composables/useHomePanels'
import type { PanelForm, PanelUploadTarget, PortfolioCardForm, PortfolioCaseForm } from '../../composables/Admin/useAdminHomePanels'
import HomePanelsAdminForm from './HomePanelsAdminForm.vue'
import HomePanelsAdminList from './HomePanelsAdminList.vue'
import PortfolioCardsAdminSection from './PortfolioCardsAdminSection.vue'

defineProps<{
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

defineEmits<{
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
}>()
</script>

<template>
  <section class="admin-content">
    <header class="admin-content__header">
      <div>
        <p>Раздел</p>
        <h1>Панели на главной</h1>
      </div>
      <button type="button" @click="$emit('newPanel')">Новая панель</button>
    </header>

    <p v-if="error" class="admin-message admin-message--error">{{ error }}</p>

    <div class="admin-grid">
      <HomePanelsAdminForm
        :form="form"
        :form-title="formTitle"
        :is-saving="isSaving"
        :upload-field="uploadField"
        @save="$emit('save')"
        @reset="$emit('reset')"
        @upload="(file, target) => $emit('upload', file, target)"
        @delete-file="(target) => $emit('deleteFile', target)"
      />

      <HomePanelsAdminList
        :panels="panels"
        :is-loading="isLoading"
        @edit="(panel) => $emit('edit', panel)"
        @select-cards="(panel) => $emit('selectCards', panel)"
        @delete="(panel) => $emit('delete', panel)"
      />
    </div>

    <PortfolioCardsAdminSection
      class="admin-tree-section"
      :cards="cards"
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
    />
  </section>
</template>
