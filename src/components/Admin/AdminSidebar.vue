<script setup lang="ts">
import AdminLogo from './AdminLogo.vue'

defineProps<{
  activeSection: string
  requestsBadge?: number
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
    <button
      class="admin-sidebar__link"
      :class="{ 'admin-sidebar__link--active': activeSection === 'director-text' }"
      type="button"
      @click="$emit('update:activeSection', 'director-text')"
    >
      DirectorText компонент
    </button>
    <button
      class="admin-sidebar__link"
      :class="{ 'admin-sidebar__link--active': activeSection === 'hystory-company' }"
      type="button"
      @click="$emit('update:activeSection', 'hystory-company')"
    >
      История компании
    </button>
    <button
      class="admin-sidebar__link"
      :class="{ 'admin-sidebar__link--active': activeSection === 'mission-values' }"
      type="button"
      @click="$emit('update:activeSection', 'mission-values')"
    >
      Миссия и ценности
    </button>
    <button
      class="admin-sidebar__link"
      :class="{ 'admin-sidebar__link--active': activeSection === 'clients' }"
      type="button"
      @click="$emit('update:activeSection', 'clients')"
    >
      Клиенты
    </button>
    <button
      class="admin-sidebar__link admin-sidebar__link--with-badge"
      :class="{ 'admin-sidebar__link--active': activeSection === 'project-requests' }"
      type="button"
      @click="$emit('update:activeSection', 'project-requests')"
    >
      <span>Заявки</span>
      <span v-if="requestsBadge" class="admin-sidebar__badge">{{ requestsBadge }}</span>
    </button>
    <button
      class="admin-sidebar__link"
      :class="{ 'admin-sidebar__link--active': activeSection === 'privacy' }"
      type="button"
      @click="$emit('update:activeSection', 'privacy')"
    >
      Политика
    </button>
    <button
      class="admin-sidebar__link"
      :class="{ 'admin-sidebar__link--active': activeSection === 'seo' }"
      type="button"
      @click="$emit('update:activeSection', 'seo')"
    >
      SEO
    </button>
    <button class="admin-sidebar__logout" type="button" @click="$emit('logout')">Выйти</button>
  </aside>
</template>
