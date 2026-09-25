<script setup lang="ts">
import AdminLogo from './AdminLogo.vue'

defineProps<{
  activeSection: string
}>()

defineEmits<{
  logout: []
  'update:activeSection': [value: string]
}>()
</script>

<template>
  <aside class="admin-sidebar">
    <AdminLogo />
    <button
      class="admin-sidebar__link"
      :class="{ 'admin-sidebar__link--active': activeSection === 'home-panels' }"
      type="button"
      @click="$emit('update:activeSection', 'home-panels')"
    >
      Панели на главной
    </button>
    <button
      class="admin-sidebar__link"
      :class="{ 'admin-sidebar__link--active': activeSection === 'about-us' }"
      type="button"
      @click="$emit('update:activeSection', 'about-us')"
    >
      О нас компонент
    </button>
    <button
      class="admin-sidebar__link"
      :class="{ 'admin-sidebar__link--active': activeSection === 'description' }"
      type="button"
      @click="$emit('update:activeSection', 'description')"
    >
      Описание компонент
    </button>
    <button
      class="admin-sidebar__link"
      :class="{ 'admin-sidebar__link--active': activeSection === 'stats' }"
      type="button"
      @click="$emit('update:activeSection', 'stats')"
    >
      Stats компонент
    </button>
    <button class="admin-sidebar__logout" type="button" @click="$emit('logout')">Выйти</button>
  </aside>
</template>
