<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AboutUsAdminSection from '../components/Admin/AboutUsAdminSection.vue'
import AdminLogin from '../components/Admin/AdminLogin.vue'
import AdminSidebar from '../components/Admin/AdminSidebar.vue'
import HomePanelsAdminSection from '../components/Admin/HomePanelsAdminSection.vue'
import { useAdminAboutUs } from '../composables/Admin/useAdminAboutUs'
import { useAdminAuth } from '../composables/Admin/useAdminAuth'
import { useAdminHomePanels } from '../composables/Admin/useAdminHomePanels'

const activeSection = ref('home-panels')
const auth = useAdminAuth()
const aboutUs = useAdminAboutUs()
const homePanels = useAdminHomePanels()

onMounted(async () => {
  if (auth.isAuthorized.value && await auth.verifySession()) {
    await Promise.all([
      homePanels.loadPanels(),
      aboutUs.loadContent(),
    ])
  }
})

async function login() {
  await auth.login(async () => {
    await Promise.all([
      homePanels.loadPanels(),
      aboutUs.loadContent(),
    ])
  })
}

function logout() {
  auth.logout()
  homePanels.clearPanels()
  aboutUs.clearContent()
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
        :form-title="homePanels.formTitle.value"
        :panels="homePanels.panels.value"
        :is-loading="homePanels.isLoading.value"
        :is-saving="homePanels.isSaving.value"
        :upload-field="homePanels.uploadField.value"
        @new-panel="homePanels.resetForm"
        @save="homePanels.savePanel"
        @reset="homePanels.resetForm"
        @upload="homePanels.uploadFile"
        @edit="homePanels.editPanel"
        @delete="homePanels.deletePanel"
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
    </section>
  </main>
</template>

<style src="./admin.css"></style>
