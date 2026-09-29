<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AboutUsAdminSection from '../components/Admin/AboutUsAdminSection.vue'
import AdminLogin from '../components/Admin/AdminLogin.vue'
import AdminSidebar from '../components/Admin/AdminSidebar.vue'
import ClientsAdminSection from '../components/Admin/ClientsAdminSection.vue'
import DescriptionAdminSection from '../components/Admin/DescriptionAdminSection.vue'
import DirectorTextAdminSection from '../components/Admin/DirectorTextAdminSection.vue'
import HomePanelsAdminSection from '../components/Admin/HomePanelsAdminSection.vue'
import HystoryCompanyAdminSection from '../components/Admin/HystoryCompanyAdminSection.vue'
import MissionValuesAdminSection from '../components/Admin/MissionValuesAdminSection.vue'
import StatsAdminSection from '../components/Admin/StatsAdminSection.vue'
import { useAdminAboutUs } from '../composables/Admin/useAdminAboutUs'
import { useAdminClients } from '../composables/Admin/useAdminClients'
import { useAdminDescription } from '../composables/Admin/useAdminDescription'
import { useAdminDirectorText } from '../composables/Admin/useAdminDirectorText'
import { useAdminAuth } from '../composables/Admin/useAdminAuth'
import { useAdminHomePanels } from '../composables/Admin/useAdminHomePanels'
import { useAdminHystoryCompany } from '../composables/Admin/useAdminHystoryCompany'
import { useAdminMissionValues } from '../composables/Admin/useAdminMissionValues'
import { useAdminStats } from '../composables/Admin/useAdminStats'

const activeSection = ref('home-panels')
const auth = useAdminAuth()
const aboutUs = useAdminAboutUs()
const clients = useAdminClients()
const description = useAdminDescription()
const directorText = useAdminDirectorText()
const homePanels = useAdminHomePanels()
const hystoryCompany = useAdminHystoryCompany()
const missionValues = useAdminMissionValues()
const stats = useAdminStats()

onMounted(async () => {
  if (auth.isAuthorized.value && await auth.verifySession()) {
    await Promise.all([
      homePanels.loadPanels(),
      aboutUs.loadContent(),
      clients.loadItems(),
      description.loadContent(),
      directorText.loadContent(),
      hystoryCompany.loadItems(),
      missionValues.loadContent(),
      stats.loadItems(),
    ])
  }
})

async function login() {
  await auth.login(async () => {
    await Promise.all([
      homePanels.loadPanels(),
      aboutUs.loadContent(),
      clients.loadItems(),
      description.loadContent(),
      directorText.loadContent(),
      hystoryCompany.loadItems(),
      missionValues.loadContent(),
      stats.loadItems(),
    ])
  })
}

function logout() {
  auth.logout()
  homePanels.clearPanels()
  aboutUs.clearContent()
  clients.clearItems()
  description.clearContent()
  directorText.clearContent()
  hystoryCompany.clearItems()
  missionValues.clearContent()
  stats.clearItems()
}
</script>

<template>
  <main class="admin-page">
    <AdminLogin
      v-if="!auth.isAuthorized.value"
      :login-form="auth.loginForm"
      :error="auth.error.value"
      :is-loading="auth.isLoading.value"
      @submit="login"
    />

    <section v-else class="admin-shell">
      <AdminSidebar
        v-model:active-section="activeSection"
        @logout="logout"
      />

      <HomePanelsAdminSection
        v-if="activeSection === 'home-panels'"
        :error="homePanels.error.value"
        :form="homePanels.panelForm"
        :card-form="homePanels.cardForm"
        :form-title="homePanels.formTitle.value"
        :card-form-title="homePanels.cardFormTitle.value"
        :panels="homePanels.panels.value"
        :cards="homePanels.cards.value"
        :selected-panel="homePanels.selectedPanel.value"
        :is-loading="homePanels.isLoading.value"
        :is-loading-cards="homePanels.isLoadingCards.value"
        :is-saving="homePanels.isSaving.value"
        :is-saving-card="homePanels.isSavingCard.value"
        :upload-field="homePanels.uploadField.value"
        @new-panel="homePanels.resetForm"
        @new-card="homePanels.resetCardForm"
        @save="homePanels.savePanel"
        @reset="homePanels.resetForm"
        @upload="homePanels.uploadFile"
        @upload-card="homePanels.uploadCardFile"
        @delete-file="homePanels.deletePanelFile"
        @delete-card-file="homePanels.deleteCardFile"
        @edit="homePanels.editPanel"
        @select-cards="homePanels.loadCards"
        @delete="homePanels.deletePanel"
        @save-card="homePanels.saveCard"
        @reset-card="homePanels.resetCardForm"
        @edit-card="homePanels.editCard"
        @delete-card="homePanels.deleteCard"
      />

      <AboutUsAdminSection
        v-if="activeSection === 'about-us'"
        :error="aboutUs.error.value"
        :form="aboutUs.form"
        :is-loading="aboutUs.isLoading.value"
        :is-saving="aboutUs.isSaving.value"
        :success-message="aboutUs.successMessage.value"
        @save="aboutUs.saveContent"
      />

      <DescriptionAdminSection
        v-if="activeSection === 'description'"
        :error="description.error.value"
        :form="description.form"
        :is-loading="description.isLoading.value"
        :is-saving="description.isSaving.value"
        :success-message="description.successMessage.value"
        :upload-field="description.uploadField.value"
        @save="description.saveContent"
        @upload="description.uploadPlaque"
        @delete-file="description.deletePlaque"
      />

      <StatsAdminSection
        v-if="activeSection === 'stats'"
        :error="stats.error.value"
        :form="stats.form"
        :form-title="stats.formTitle.value"
        :items="stats.items.value"
        :is-loading="stats.isLoading.value"
        :is-saving="stats.isSaving.value"
        @new-item="stats.resetForm"
        @save="stats.saveItem"
        @reset="stats.resetForm"
        @edit="stats.editItem"
        @delete="stats.deleteItem"
      />

      <DirectorTextAdminSection
        v-if="activeSection === 'director-text'"
        :error="directorText.error.value"
        :form="directorText.form"
        :is-loading="directorText.isLoading.value"
        :is-saving="directorText.isSaving.value"
        :success-message="directorText.successMessage.value"
        :upload-field="directorText.uploadField.value"
        @save="directorText.saveContent"
        @upload="directorText.uploadPhoto"
        @delete-file="directorText.deletePhoto"
      />

      <HystoryCompanyAdminSection
        v-if="activeSection === 'hystory-company'"
        :error="hystoryCompany.error.value"
        :form="hystoryCompany.form"
        :form-title="hystoryCompany.formTitle.value"
        :items="hystoryCompany.items.value"
        :is-loading="hystoryCompany.isLoading.value"
        :is-saving="hystoryCompany.isSaving.value"
        @new-item="hystoryCompany.resetForm"
        @save="hystoryCompany.saveItem"
        @reset="hystoryCompany.resetForm"
        @edit="hystoryCompany.editItem"
        @delete="hystoryCompany.deleteItem"
      />

      <MissionValuesAdminSection
        v-if="activeSection === 'mission-values'"
        :cards="missionValues.cards.value"
        :card-form="missionValues.cardForm"
        :card-form-title="missionValues.cardFormTitle.value"
        :content-form="missionValues.contentForm"
        :error="missionValues.error.value"
        :is-loading="missionValues.isLoading.value"
        :is-saving-card="missionValues.isSavingCard.value"
        :is-saving-content="missionValues.isSavingContent.value"
        :success-message="missionValues.successMessage.value"
        @save-content="missionValues.saveContent"
        @new-card="missionValues.resetCardForm"
        @save-card="missionValues.saveCard"
        @reset-card="missionValues.resetCardForm"
        @edit-card="missionValues.editCard"
        @delete-card="missionValues.deleteCard"
      />

      <ClientsAdminSection
        v-if="activeSection === 'clients'"
        :error="clients.error.value"
        :form="clients.form"
        :form-title="clients.formTitle.value"
        :items="clients.items.value"
        :is-loading="clients.isLoading.value"
        :is-saving="clients.isSaving.value"
        :upload-field="clients.uploadField.value"
        @new-item="clients.resetForm"
        @save="clients.saveItem"
        @reset="clients.resetForm"
        @upload="clients.uploadImage"
        @delete-file="clients.deleteImage"
        @edit="clients.editItem"
        @delete="clients.deleteItem"
      />
    </section>
  </main>
</template>

<style src="./admin.css"></style>
