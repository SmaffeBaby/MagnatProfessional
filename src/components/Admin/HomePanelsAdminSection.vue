<script setup lang="ts">
import type { HomePanel } from '../../composables/useHomePanels'
import type { PanelForm, PanelUploadTarget } from '../../composables/Admin/useAdminHomePanels'
import HomePanelsAdminForm from './HomePanelsAdminForm.vue'
import HomePanelsAdminList from './HomePanelsAdminList.vue'

defineProps<{
  error: string
  form: PanelForm
  formTitle: string
  panels: HomePanel[]
  isLoading: boolean
  isSaving: boolean
  uploadField: string
}>()

defineEmits<{
  newPanel: []
  save: []
  reset: []
  upload: [file: File, target: PanelUploadTarget]
  edit: [panel: HomePanel]
  delete: [panel: HomePanel]
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
      />

      <HomePanelsAdminList
        :panels="panels"
        :is-loading="isLoading"
        @edit="(panel) => $emit('edit', panel)"
        @delete="(panel) => $emit('delete', panel)"
      />
    </div>
  </section>
</template>
