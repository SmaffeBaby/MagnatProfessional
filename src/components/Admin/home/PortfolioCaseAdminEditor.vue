<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { PortfolioArticleBlockLayout } from '../../../composables/useHomePanels'
import type { PortfolioCaseForm } from '../../../composables/Admin/useAdminHomePanels'
const props = defineProps<{ caseForm: PortfolioCaseForm; isSaving: boolean; uploadField: string; error: string }>()
const emit = defineEmits<{
  saveCase: []; resetCase: []; close: [];
  uploadCaseHero: [file: File]; deleteCaseHero: [];
  uploadArticleImage: [file: File, blockId: string, groupId: string];
  deleteArticleImage: [blockId: string, groupId: string, imageId: string];
  addArticleBlock: [layout?: PortfolioArticleBlockLayout];
  addArticleImageGroup: [blockId: string, layout?: PortfolioArticleBlockLayout];
  removeArticleImageGroup: [blockId: string, groupId: string];
  removeArticleBlock: [blockId: string]; moveArticleBlock: [blockId: string, direction: -1 | 1];
}>()
const route = useRoute()
const router = useRouter()
const activeTab = computed(() => route.query.caseTab === 'cover' ? 'cover' : 'content')
const saved = ref(false)
const imageCount = computed(() => props.caseForm.articleBlocks.reduce((count, block) => count + (block.imageGroups || []).reduce((sum, group) => sum + group.images.length, 0), 0))
function setTab(tab: string) { router.replace({ query: { ...route.query, caseTab: tab } }) }
watch(() => props.isSaving, (saving, previous) => { if (previous && !saving && !props.error) saved.value = true })
watch(() => props.caseForm, () => { saved.value = false }, { deep: true })
function uploadCaseHero(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) emit('uploadCaseHero', input.files[0])
  input.value = ''
}
function uploadArticleImage(event: Event, blockId: string, groupId: string) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) emit('uploadArticleImage', input.files[0], blockId, groupId)
  input.value = ''
}
</script>
<template>
  <section class="admin-case-editor">
    <header class="admin-content__header">
      <div><p>Редактор кейса</p><h1>{{ caseForm.title }}</h1><p class="admin-overview__intro">Обложка, история проекта и изображения на странице кейса.</p></div>
      <div class="admin-content__header-actions"><button type="button" class="button-secondary" @click="$emit('close')">← К карточкам</button><a :href="caseForm.linkPath" target="_blank" rel="noopener" class="admin-site-link">Открыть на сайте ↗</a><button form="portfolio-case-form" type="submit" :disabled="isSaving || Boolean(uploadField)">{{ isSaving ? 'Сохраняем…' : 'Сохранить кейс' }}</button></div>
    </header>
    <p v-if="saved" class="admin-message admin-message--success" role="status">Кейс сохранён</p>
    <div class="admin-case-layout">
      <aside class="admin-case-outline">
        <h2>Структура кейса</h2>
        <button type="button" :class="{ 'admin-case-outline__active': activeTab === 'cover' }" @click="setTab('cover')"><span>01</span>Обложка<small>{{ caseForm.caseHeroUrl ? 'Добавлена' : 'Нет фото' }}</small></button>
        <button type="button" :class="{ 'admin-case-outline__active': activeTab === 'content' }" @click="setTab('content')"><span>02</span>Содержание<small>{{ caseForm.articleBlocks.length }}</small></button>
        <div v-if="activeTab === 'content'" class="admin-case-outline__blocks"><a v-for="(block, index) in caseForm.articleBlocks" :key="block.id" :href="`#case-block-${block.id}`">{{ String(index + 1).padStart(2, '0') }} · {{ block.title || 'Без заголовка' }}</a></div>
        <div class="admin-case-outline__summary"><span>{{ caseForm.articleBlocks.length }} текстовых блоков</span><span>{{ imageCount }} изображений в статье</span></div>
      </aside>
      <form id="portfolio-case-form" class="panel-form portfolio-case-admin__form" @submit.prevent="$emit('saveCase')">
        <fieldset v-show="activeTab === 'cover'" :disabled="isSaving" class="portfolio-article-admin portfolio-article-admin--hero">
          <legend>Обложка кейса</legend><p class="admin-case-help">Широкое изображение в начале страницы проекта.</p>

          <label>
            <span>Загрузить широкое изображение кейса</span>
            <input type="file" accept="image/*" @change="uploadCaseHero">
            <small v-if="caseForm.caseHeroUrl">Файл загружен</small>
          </label>

          <div v-if="caseForm.caseHeroUrl" class="panel-form__preview panel-form__preview--wide">
            <img :src="caseForm.caseHeroUrl" alt="">
          </div>

          <button v-if="caseForm.caseHeroPath" type="button" class="button-secondary" @click="$emit('deleteCaseHero')">Удалить начальное изображение</button>
        </fieldset>

        <fieldset v-show="activeTab === 'content'" :disabled="isSaving" class="portfolio-article-admin">
          <legend>Содержание кейса</legend><p class="admin-case-help">Соберите историю проекта из текстовых блоков и групп изображений.</p><div v-if="!caseForm.articleBlocks.length" class="admin-case-placeholder">Пока нет блоков. Выберите макет ниже, чтобы добавить первый.</div>

          <div class="portfolio-article-admin__actions">
            <button type="button" class="button-secondary" @click="$emit('addArticleBlock', 'single-wide')">+ Блок: одно большое</button>
            <button type="button" class="button-secondary" @click="$emit('addArticleBlock', 'two-medium')">+ Блок: два средних</button>
            <button type="button" class="button-secondary" @click="$emit('addArticleBlock', 'three-vertical')">+ Блок: три вертикальных</button>
          </div>

          <article
            v-for="(block, index) in caseForm.articleBlocks"
            :key="block.id"
            :id="`case-block-${block.id}`"
            class="portfolio-article-admin__block"
          >
            <header class="portfolio-article-admin__block-header">
              <h3>Блок {{ index + 1 }}</h3>
              <div>
                <button type="button" class="button-secondary" :disabled="index === 0" @click="$emit('moveArticleBlock', block.id, -1)">Выше</button>
                <button type="button" class="button-secondary" :disabled="index === caseForm.articleBlocks.length - 1" @click="$emit('moveArticleBlock', block.id, 1)">Ниже</button>
                <button type="button" class="button-danger" @click="$emit('removeArticleBlock', block.id)">Удалить блок</button>
              </div>
            </header>

            <div class="admin-case-fields"><label>
              <span>Заголовок · Русский</span>
              <input v-model="block.title" type="text">
            </label>

            <label>
              <span>Заголовок · English</span>
              <input v-model="block.titleEn" type="text">
            </label>

            <label>
              <span>Текст · Русский</span>
              <textarea v-model="block.text" rows="4"></textarea>
            </label>

            <label>
              <span>Текст · English</span>
              <textarea v-model="block.textEn" rows="4"></textarea>
            </label>

            </div><div class="portfolio-article-admin__groups">
              <article
                v-for="(group, groupIndex) in block.imageGroups"
                :key="group.id"
                class="portfolio-article-admin__group"
              >
                <header class="portfolio-article-admin__group-header">
                  <h4>Группа изображений {{ groupIndex + 1 }}</h4>
                  <button type="button" class="button-secondary" @click="$emit('removeArticleImageGroup', block.id, group.id)">Удалить группу</button>
                </header>

                <div v-if="group.images.length" class="portfolio-article-admin__images">
                  <div
                    v-for="image in group.images"
                    :key="image.id"
                    class="portfolio-article-admin__image"
                  >
                    <img :src="image.url" alt="">
                    <button type="button" class="button-secondary" @click="$emit('deleteArticleImage', block.id, group.id, image.id)">Удалить</button>
                  </div>
                </div>

                <label>
                  <span>Добавить изображение</span>
                  <input type="file" accept="image/*" @change="uploadArticleImage($event, block.id, group.id)">
                </label>

                <div class="portfolio-article-admin__group-controls">
                  <label>
                    <span>Тип блока изображений</span>
                    <select v-model="group.layout">
                      <option value="single-wide">Одно большое</option>
                      <option value="two-medium">Два средних</option>
                      <option value="three-vertical">Три вертикальных</option>
                    </select>
                  </label>
                  <button type="button" class="button-secondary" @click="$emit('addArticleImageGroup', block.id, 'single-wide')">+</button>
                </div>
              </article>

              <button
                v-if="!block.imageGroups?.length"
                type="button"
                class="button-secondary"
                @click="$emit('addArticleImageGroup', block.id, 'single-wide')"
              >
                + Добавить группу изображений
              </button>
            </div>
          </article>
        </fieldset>

        <p v-if="uploadField.startsWith('article-') || uploadField === 'case-hero'" class="admin-message">Загружаем изображение статьи...</p>

        <div class="panel-form__actions">
          <button type="submit" :disabled="isSaving || Boolean(uploadField)">
            {{ isSaving ? 'Сохраняем...' : 'Сохранить кейс' }}
          </button>
          <button type="button" class="button-secondary" :disabled="isSaving || Boolean(uploadField)" @click="$emit('resetCase')">Отменить изменения</button>
        </div>
      </form>
    </div>
  </section>
</template>
