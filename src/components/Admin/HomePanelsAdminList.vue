<script setup lang="ts">
import type { HomePanel } from '../../composables/useHomePanels'

defineProps<{
  panels: HomePanel[]
  isLoading: boolean
}>()

defineEmits<{
  edit: [panel: HomePanel]
  delete: [panel: HomePanel]
}>()
</script>

<template>
  <div class="panel-list">
    <h2>Сохранённые панели</h2>
    <p v-if="isLoading" class="admin-message">Загружаем данные...</p>
    <article v-for="panel in panels" :key="panel.id" class="panel-list__item">
      <div>
        <h3>{{ panel.title }}</h3>
        <p>{{ panel.sortOrder }} · {{ panel.tileType === 'wide' ? 'Широкая' : 'Вертикальная' }} · {{ panel.linkPath }}</p>
      </div>
      <div class="panel-list__actions">
        <button type="button" @click="$emit('edit', panel)">Изменить</button>
        <button type="button" class="button-danger" @click="$emit('delete', panel)">Удалить</button>
      </div>
    </article>
  </div>
</template>
