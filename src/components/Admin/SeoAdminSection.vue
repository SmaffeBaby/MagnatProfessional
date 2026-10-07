<script setup lang="ts">
import type { SeoEntryForm } from '../../composables/Admin/useAdminSeo'
import type { SeoEntry } from '../../composables/useSeo'

defineProps<{
  error: string
  successMessage: string
  form: SeoEntryForm
  formTitle: string
  entries: SeoEntry[]
  isLoading: boolean
  isSaving: boolean
}>()

defineEmits<{
  newEntry: []
  save: []
  reset: []
  edit: [entry: SeoEntry]
  delete: [entry: SeoEntry]
}>()
</script>

<template>
  <section class="admin-content">
    <header class="admin-content__header">
      <div>
        <p>Раздел</p>
        <h1>SEO</h1>
      </div>
      <button type="button" @click="$emit('newEntry')">Новая запись</button>
    </header>

    <p v-if="error" class="admin-message admin-message--error">{{ error }}</p>
    <p v-if="successMessage" class="admin-message admin-message--success">{{ successMessage }}</p>

    <div class="admin-grid">
      <form class="panel-form" @submit.prevent="$emit('save')">
        <h2>{{ formTitle }}</h2>

        <label>
          <span>Тип</span>
          <select v-model="form.scope">
            <option value="page">Страница</option>
            <option value="group">Группа / направление</option>
            <option value="case">Кейс</option>
            <option value="element">Элемент страницы</option>
            <option value="custom">Произвольная ссылка</option>
          </select>
        </label>

        <label>
          <span>Ссылка</span>
          <input v-model="form.path" type="text" placeholder="/portfolio/brending-i-aydentika/case/" required>
        </label>

        <label>
          <span>Название</span>
          <input v-model="form.title" type="text" required>
        </label>

        <label>
          <span>Название на английском</span>
          <input v-model="form.titleEn" type="text">
        </label>

        <label>
          <span>Description</span>
          <textarea v-model="form.description" rows="4" />
        </label>

        <label>
          <span>Description на английском</span>
          <textarea v-model="form.descriptionEn" rows="4" />
        </label>

        <label>
          <span>Ключевые слова</span>
          <textarea v-model="form.keywords" rows="3" placeholder="брендинг, айдентика, дизайн" />
        </label>

        <label>
          <span>Ключевые слова на английском</span>
          <textarea v-model="form.keywordsEn" rows="3" />
        </label>

        <label>
          <span>Хештеги</span>
          <textarea v-model="form.hashtags" rows="3" placeholder="#брендинг #дизайн" />
        </label>

        <label>
          <span>Хештеги на английском</span>
          <textarea v-model="form.hashtagsEn" rows="3" />
        </label>

        <label>
          <span>Open Graph title</span>
          <input v-model="form.ogTitle" type="text">
        </label>

        <label>
          <span>Open Graph title на английском</span>
          <input v-model="form.ogTitleEn" type="text">
        </label>

        <label>
          <span>Open Graph description</span>
          <textarea v-model="form.ogDescription" rows="3" />
        </label>

        <label>
          <span>Open Graph description на английском</span>
          <textarea v-model="form.ogDescriptionEn" rows="3" />
        </label>

        <label>
          <span>Open Graph image URL</span>
          <input v-model="form.ogImageUrl" type="url">
        </label>

        <label>
          <span>Canonical path</span>
          <input v-model="form.canonicalPath" type="text" placeholder="/portfolio/">
        </label>

        <label>
          <span>Robots</span>
          <input v-model="form.robots" type="text" placeholder="index,follow">
        </label>

        <label>
          <span>Приоритет sitemap</span>
          <input v-model.number="form.priority" type="number" min="0" max="1" step="0.1">
        </label>

        <label>
          <span>Частота обновления</span>
          <select v-model="form.changeFrequency">
            <option value="always">always</option>
            <option value="hourly">hourly</option>
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
            <option value="yearly">yearly</option>
            <option value="never">never</option>
          </select>
        </label>

        <label>
          <span>Structured data JSON-LD</span>
          <textarea v-model="form.structuredData" rows="6" placeholder="{ &quot;@context&quot;: &quot;https://schema.org&quot; }" />
        </label>

        <label>
          <span>Метрики / служебные SEO данные JSON</span>
          <textarea v-model="form.metrics" rows="5" placeholder="{ &quot;searchIntent&quot;: &quot;commercial&quot; }" />
        </label>

        <div class="panel-form__actions">
          <button type="submit" :disabled="isSaving">
            {{ isSaving ? 'Сохраняем...' : 'Сохранить' }}
          </button>
          <button type="button" class="button-secondary" @click="$emit('reset')">Сбросить</button>
        </div>
      </form>

      <div class="panel-list">
        <h2>SEO записи</h2>
        <p v-if="isLoading" class="admin-message">Загружаем данные...</p>
        <article v-for="entry in entries" :key="entry.id" class="panel-list__item">
          <div>
            <h3>{{ entry.path }}</h3>
            <p>{{ entry.title }}<span v-if="entry.titleEn"> / {{ entry.titleEn }}</span></p>
            <p>{{ entry.scope }} · robots: {{ entry.robots || 'index,follow' }}</p>
          </div>
          <div class="panel-list__actions">
            <button type="button" @click="$emit('edit', entry)">Изменить</button>
            <button type="button" class="button-danger" @click="$emit('delete', entry)">Удалить</button>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
