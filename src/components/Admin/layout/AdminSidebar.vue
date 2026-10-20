<script setup lang="ts">
import { adminNavigation } from '../../../config/adminNavigation'
import AdminIcon from '../shared/AdminIcon.vue'
import AdminLogo from './AdminLogo.vue'
defineProps<{ activeSection: string; activePage: string; requestsBadge?: number; open: boolean }>()
defineEmits<{ logout: []; navigate: [section: string, page: string]; close: [] }>()
</script>
<template>
  <button v-if="open" class="admin-sidebar-backdrop" aria-label="Закрыть меню" @click="$emit('close')" />
  <aside class="admin-sidebar" :class="{ 'admin-sidebar--open': open }" aria-label="Навигация админки">
    <RouterLink to="/admin" class="admin-brand"><span class="admin-brand__mark">М</span><span>Магнат <small>/ admin</small></span></RouterLink>
    <RouterLink to="/admin" class="admin-workspace admin-workspace--logo" aria-label="Магнат Профессионал — обзор"><AdminLogo /></RouterLink>
    <nav class="admin-navigation">
      <button class="admin-sidebar__link" :class="{ 'admin-sidebar__link--active': activeSection === 'dashboard' }" @click="$emit('navigate', 'dashboard', 'home')"><AdminIcon name="grid" />Обзор</button>
      <p class="admin-nav-caption">Страницы и разделы</p>
      <details v-for="group in adminNavigation" :key="group.id" :open="activePage === group.id || group.id === 'home'">
        <summary><AdminIcon :name="group.icon" /><span>{{ group.label }}</span><AdminIcon name="chevron" :size="14" /></summary>
        <div class="admin-nav-children">
          <button v-for="item in group.items" :key="item.id" class="admin-sidebar__link" :class="{ 'admin-sidebar__link--active': activeSection === item.id && activePage === group.id }" :aria-current="activeSection === item.id && activePage === group.id ? 'page' : undefined" @click="$emit('navigate', item.id, group.id)"><span>{{ item.label }}</span><span v-if="item.id === 'project-requests' && requestsBadge" class="admin-sidebar__badge">{{ requestsBadge }}</span></button>
        </div>
      </details>
    </nav>
    <footer class="admin-sidebar__footer"><span class="admin-user-avatar">A</span><div><strong>Администратор</strong><small>Панель управления</small></div><button class="admin-sidebar__logout" title="Выйти" aria-label="Выйти" @click="$emit('logout')"><AdminIcon name="logout" /></button></footer>
  </aside>
</template>
