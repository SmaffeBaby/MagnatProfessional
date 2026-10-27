<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useAdminSiteChrome } from '../../../composables/Admin/useAdminSiteChrome'
import { renderCopyright, cookieBannerParts } from '../../../../backend/src/content/siteChromeConfig.js'
import type { ChromeSection } from '../../../types/siteChrome'
import AdminBilingualField from './AdminBilingualField.vue'
import AdminLinksEditor from './AdminLinksEditor.vue'
const props = defineProps<{ section: ChromeSection }>()
const sectionRef = toRef(props, 'section')
const { form, panels, isLoading, isSaving, loaded, error, notice, load, save, discard } = useAdminSiteChrome(sectionRef)
const previewRu = computed(() => cookieBannerParts(form.cookie, 'ru'))
const previewEn = computed(() => cookieBannerParts(form.cookie, 'en'))
const title = computed(() => ({ sidebar: 'Сайдбар', header: 'Хедер и меню', footer: 'Футер', cookie: 'Cookie-баннер' })[props.section])
function insertYear(field: 'copyright' | 'copyrightEn') {
  if (!form.footer[field].includes('{year}')) form.footer[field] = form.footer[field].replace(/©\s*(?:\d{4}\s*)?/, '© {year} ')
  if (!form.footer[field].includes('{year}')) form.footer[field] = `{year} ${form.footer[field]}`
}
</script>
<template>
  <section class="admin-content admin-chrome-editor">
    <nav class="admin-breadcrumbs" aria-label="Навигационная цепочка"><RouterLink to="/admin">Обзор</RouterLink><span>/</span><span>Общие элементы сайта</span><span>/</span><strong aria-current="page">{{ title }}</strong></nav>
    <header class="admin-content__header"><div><p>Общие элементы сайта</p><h1>{{ title }}</h1><p class="admin-overview__intro">Контент на русском и английском для всех страниц и размеров экрана.</p></div><div class="admin-content__header-actions"><button type="button" class="button-secondary" :disabled="!loaded || isSaving" @click="discard">Отменить изменения</button><button type="submit" form="site-chrome-form" :disabled="!loaded || isSaving">{{ isSaving ? 'Сохраняем…' : 'Сохранить' }}</button></div></header>
    <p v-if="error" class="admin-message admin-message--error" role="alert">{{ error }} <button v-if="!loaded" class="button-secondary" type="button" @click="load">Повторить</button></p>
    <p v-if="notice" class="admin-message admin-message--success" role="status">{{ notice }}</p>
    <p v-if="isLoading" class="admin-message" role="status">Загружаем контент…</p>
    <form v-if="loaded" id="site-chrome-form" class="panel-form" @submit.prevent="save">
      <fieldset class="admin-chrome-fieldset" :disabled="isSaving">
        <template v-if="section === 'header'">
          <AdminLinksEditor :links="form.header.links" title="Пункты навигации" />
          <p class="admin-message">Это меню используется в хедере на компьютере и планшете, а также в раскрывающемся меню на телефоне.</p>
        </template>
        <template v-else-if="section === 'sidebar'">
          <h2>Контактные карточки</h2>
          <AdminBilingualField v-model="form.sidebar.officeText" v-model:model-en="form.sidebar.officeTextEn" label="Текст об офисе" multiline />
          <AdminBilingualField v-model="form.sidebar.mapLabel" v-model:model-en="form.sidebar.mapLabelEn" label="Кнопка карты" />
          <div class="admin-bilingual-field"><label><span>Телефон</span><input v-model="form.sidebar.phone" type="tel"></label><label><span>Email</span><input v-model="form.sidebar.email" type="email"></label></div>
          <section class="admin-chrome-part"><h2>Названия направлений в сайдбаре</h2><p class="admin-message">Ссылки остаются связанными с категориями портфолио. Пустое поле использует название категории; новые категории появляются автоматически.</p>
            <article v-for="panel in panels" :key="panel.id" class="admin-link-fields"><h3>{{ panel.title }}</h3><AdminBilingualField v-if="form.sidebar.serviceOverrides.find(item => item.id === panel.id)" v-model="form.sidebar.serviceOverrides.find(item => item.id === panel.id)!.label" v-model:model-en="form.sidebar.serviceOverrides.find(item => item.id === panel.id)!.labelEn" label="Название в сайдбаре" :placeholder="panel.title" :placeholder-en="panel.titleEn || panel.title" /></article>
          </section>
          <section class="admin-chrome-part"><AdminLinksEditor :links="form.sidebar.extraLinks" title="Дополнительные ссылки сайдбара" /></section>
        </template>
        <template v-else-if="section === 'cookie'">
          <h2>Текст уведомления</h2><p class="admin-message">Метка {cookies} заменяется кликабельной ссылкой на согласие. Она должна встречаться ровно один раз. Переход по ссылке не означает принятие cookie — согласие сохраняется только после нажатия кнопки.</p>
          <AdminBilingualField v-model="form.cookie.text" v-model:model-en="form.cookie.textEn" label="Текст баннера" multiline />
          <AdminBilingualField v-model="form.cookie.linkText" v-model:model-en="form.cookie.linkTextEn" label="Текст ссылки на согласие" />
          <AdminBilingualField v-model="form.cookie.buttonText" v-model:model-en="form.cookie.buttonTextEn" label="Текст кнопки согласия" />
          <p class="admin-message"><RouterLink :to="{ path: '/admin', query: { section: 'cookie-consent', page: 'legal' } }">Редактировать документ «Согласие на использование cookie-файлов» →</RouterLink></p>
          <div class="admin-chrome-preview"><span>Предпросмотр · Русский</span><p>{{ previewRu.before }}<RouterLink to="/cookie-consent">{{ previewRu.linkText }}</RouterLink>{{ previewRu.after }}</p><strong>{{ previewRu.buttonText }}</strong></div>
          <div class="admin-chrome-preview"><span>Предпросмотр · English</span><p>{{ previewEn.before }}<RouterLink to="/cookie-consent">{{ previewEn.linkText }}</RouterLink>{{ previewEn.after }}</p><strong>{{ previewEn.buttonText }}</strong></div>
        </template>
        <template v-else>
          <h2>Копирайт</h2><p class="admin-message">Вставьте {year} в любом месте текста — сайт автоматически покажет текущий год.</p>
          <AdminBilingualField v-model="form.footer.copyright" v-model:model-en="form.footer.copyrightEn" label="Текст копирайта" />
          <div class="admin-chrome-year-actions"><button type="button" class="button-secondary" @click="insertYear('copyright')">Вставить текущий год · RU</button><button type="button" class="button-secondary" @click="insertYear('copyrightEn')">Вставить текущий год · EN</button></div>
          <div class="admin-chrome-preview"><span>Предпросмотр · Русский</span><p>{{ renderCopyright(form.footer.copyright) }}</p><span>Предпросмотр · English</span><p>{{ renderCopyright(form.footer.copyrightEn || form.footer.copyright) }}</p></div>
          <section class="admin-chrome-part"><AdminLinksEditor :links="form.footer.links" title="Ссылки футера" /></section>
          <section class="admin-chrome-part"><h2>Подпись справа</h2><AdminBilingualField v-model="form.footer.made" v-model:model-en="form.footer.madeEn" label="Текст подписи" /><label><span>Ссылка подписи (необязательно)</span><input v-model="form.footer.madeHref" type="text" placeholder="https://example.com"></label></section>
        </template>
        <div class="panel-form__actions"><button type="submit">{{ isSaving ? 'Сохраняем…' : 'Сохранить изменения' }}</button></div>
      </fieldset>
    </form>
  </section>
</template>
