<script setup lang="ts">
import AdminLogo from './AdminLogo.vue'

defineProps<{
  loginForm: {
    email: string
    password: string
  }
  error: string
  isLoading: boolean
}>()

defineEmits<{
  submit: []
}>()
</script>

<template>
  <section class="admin-login" aria-labelledby="admin-login-title">
    <form class="admin-login__form" @submit.prevent="$emit('submit')">
      <div class="admin-login__logo-wrap">
        <AdminLogo />
      </div>
      <h1 id="admin-login-title">Административная панель</h1>

      <label>
        <span>Email</span>
        <input v-model="loginForm.email" type="email" autocomplete="email" required>
      </label>

      <label>
        <span>Пароль</span>
        <input v-model="loginForm.password" type="password" autocomplete="current-password" required>
      </label>

      <p v-if="error" class="admin-message admin-message--error">{{ error }}</p>

      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Входим...' : 'Войти' }}
      </button>
    </form>
  </section>
</template>
