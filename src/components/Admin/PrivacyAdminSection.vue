<script setup lang="ts">
import type { PrivacyBlockForm } from '../../composables/Admin/useAdminPrivacy'
import type { PrivacyBlock } from '../../composables/usePrivacy'

defineProps<{
  error: string
  form: PrivacyBlockForm
  formTitle: string
  blocks: PrivacyBlock[]
  isLoading: boolean
  isSaving: boolean
}>()

defineEmits<{
  newBlock: []
  save: []
  reset: []
  edit: [block: PrivacyBlock]
  delete: [block: PrivacyBlock]
  addTableRow: [language: 'ru' | 'en']
  removeTableRow: [language: 'ru' | 'en', index: number]
}>()
</script>

<template>
  <section class="admin-content">
    <header class="admin-content__header">
      <div>
        <p>Раздел</p>
        <h1>Политика обработки персональных данных</h1>
      </div>
      <button type="button" @click="$emit('newBlock')">Новый блок</button>
    </header>

    <p v-if="error" class="admin-message admin-message--error">{{ error }}</p>

    <div class="admin-grid">
      <form class="panel-form" @submit.prevent="$emit('save')">
        <h2>{{ formTitle }}</h2>

        <label>
          <span>Тип блока</span>
          <select v-model="form.type">
            <option value="text">Текст</option>
            <option value="table">Таблица</option>
          </select>
        </label>

        <label>
          <span>Сортировка</span>
          <input v-model.number="form.sortOrder" type="number" step="1">
        </label>

        <label>
          <span>Заголовок</span>
          <input v-model="form.title" type="text" required>
        </label>

        <label>
          <span>Заголовок на английском</span>
          <input v-model="form.titleEn" type="text">
        </label>

        <label>
          <span>Текст</span>
          <textarea v-model="form.text" :required="form.type === 'text'" rows="8" />
        </label>

        <label>
          <span>Текст на английском</span>
          <textarea v-model="form.textEn" rows="8" />
        </label>

        <fieldset v-if="form.type === 'table'" class="panel-form__rows">
          <legend>Таблица на русском</legend>

          <div
            v-for="(row, index) in form.tableRows"
            :key="`ru-${index}`"
            class="panel-form__row"
          >
            <input v-model="row.left" type="text" placeholder="Левая колонка">
            <input v-model="row.right" type="text" placeholder="Правая колонка">
            <button
              type="button"
              class="button-secondary"
              @click="$emit('removeTableRow', 'ru', index)"
            >
              Убрать
            </button>
          </div>

          <button type="button" class="button-secondary" @click="$emit('addTableRow', 'ru')">
            Добавить строку
          </button>
        </fieldset>

        <fieldset v-if="form.type === 'table'" class="panel-form__rows">
          <legend>Таблица на английском</legend>

          <div
            v-for="(row, index) in form.tableRowsEn"
            :key="`en-${index}`"
            class="panel-form__row"
          >
            <input v-model="row.left" type="text" placeholder="Левая колонка">
            <input v-model="row.right" type="text" placeholder="Правая колонка">
            <button
              type="button"
              class="button-secondary"
              @click="$emit('removeTableRow', 'en', index)"
            >
              Убрать
            </button>
          </div>

          <button type="button" class="button-secondary" @click="$emit('addTableRow', 'en')">
            Добавить строку
          </button>
        </fieldset>

        <div class="panel-form__actions">
          <button type="submit" :disabled="isSaving">
            {{ isSaving ? 'Сохраняем...' : 'Сохранить' }}
          </button>
          <button type="button" class="button-secondary" @click="$emit('reset')">Сбросить</button>
        </div>
      </form>

      <div class="panel-list">
        <h2>Сохранённые блоки</h2>
        <p v-if="isLoading" class="admin-message">Загружаем данные...</p>
        <article v-for="block in blocks" :key="block.id" class="panel-list__item">
          <div>
            <h3>{{ block.sortOrder }} · {{ block.title }}</h3>
            <p>{{ block.type === 'table' ? 'Таблица' : 'Текст' }}</p>
          </div>
          <div class="panel-list__actions">
            <button type="button" @click="$emit('edit', block)">Изменить</button>
            <button type="button" class="button-danger" @click="$emit('delete', block)">Удалить</button>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
