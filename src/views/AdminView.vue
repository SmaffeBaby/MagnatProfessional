<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AdminLogin from '../components/Admin/AdminLogin.vue'
import AdminSidebar from '../components/Admin/AdminSidebar.vue'
import HomePanelsAdminSection from '../components/Admin/HomePanelsAdminSection.vue'
import { useAdminAuth } from '../composables/Admin/useAdminAuth'
import { useAdminHomePanels } from '../composables/Admin/useAdminHomePanels'

const activeSection = ref('home-panels')
const auth = useAdminAuth()
const homePanels = useAdminHomePanels()

onMounted(async () => {
  if (auth.isAuthorized.value && await auth.verifySession()) {
    await homePanels.loadPanels()
  }
})

async function login() {
  await auth.login(homePanels.loadPanels)
}

function logout() {
  auth.logout()
  homePanels.clearPanels()
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
    </section>
  </main>
</template>

<style src="./admin.css"></style>
