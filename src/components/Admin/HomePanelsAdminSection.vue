<script setup lang="ts">
import type { HomePanel, PortfolioCard } from '../../composables/useHomePanels'
import type { PanelForm, PanelUploadTarget, PortfolioCardForm } from '../../composables/Admin/useAdminHomePanels'
import HomePanelsAdminForm from './HomePanelsAdminForm.vue'
import HomePanelsAdminList from './HomePanelsAdminList.vue'
import PortfolioCardsAdminSection from './PortfolioCardsAdminSection.vue'

defineProps<{
  error: string
  form: PanelForm
  cardForm: PortfolioCardForm
  formTitle: string
  cardFormTitle: string
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
  deleteFile: [target: PanelUploadTarget]
  deleteCardFile: [target: Exclude<PanelUploadTarget, 'mascot'>]
  edit: [panel: HomePanel]
  selectCards: [panel: HomePanel]
  delete: [panel: HomePanel]
  saveCard: []
  resetCard: []
  editCard: [card: PortfolioCard]
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
      :form-title="cardFormTitle"
      :is-loading="isLoadingCards"
      :is-saving="isSavingCard"
      :selected-panel="selectedPanel"
      :upload-field="uploadField"
      @new-card="$emit('newCard')"
      @save="$emit('saveCard')"
      @reset="$emit('resetCard')"
      @upload="(file, target) => $emit('uploadCard', file, target)"
      @delete-file="(target) => $emit('deleteCardFile', target)"
      @edit="(card) => $emit('editCard', card)"
      @delete="(card) => $emit('deleteCard', card)"
    />
  </section>
</template>
