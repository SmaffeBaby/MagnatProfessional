<script setup lang="ts">
import type { ChromeLink } from '../../../types/siteChrome'
import AdminBilingualField from './AdminBilingualField.vue'
const props = defineProps<{ links: ChromeLink[]; title: string }>()
function add() { props.links.push({ id: crypto.randomUUID(), label: 'Новая ссылка', labelEn: 'New link', href: '/' }) }
function move(index: number, direction: number) {
  const next = index + direction
  if (next < 0 || next >= props.links.length) return
  const [item] = props.links.splice(index, 1)
  props.links.splice(next, 0, item)
}
</script>
<template>
  <section class="admin-links-editor">
    <div class="admin-section-heading"><h2>{{ title }}</h2><button type="button" class="button-secondary" :disabled="links.length >= 100" @click="add">+ Добавить ссылку</button></div>
    <p class="admin-message">Порядок элементов здесь соответствует порядку на сайте. Если перевод не заполнен, используется русский текст.</p>
    <p v-if="!links.length" class="admin-case-placeholder">Ссылок пока нет. Добавьте первый пункт.</p>
    <article v-for="(link, index) in links" :key="link.id" class="admin-link-fields">
      <div class="admin-link-fields__header"><strong>Пункт {{ index + 1 }}</strong><div><button type="button" class="button-secondary" :disabled="index === 0" :aria-label="`Поднять пункт ${index + 1}`" @click="move(index, -1)">↑</button><button type="button" class="button-secondary" :disabled="index === links.length - 1" :aria-label="`Опустить пункт ${index + 1}`" @click="move(index, 1)">↓</button><button type="button" class="button-danger" @click="links.splice(index, 1)">Удалить</button></div></div>
      <AdminBilingualField v-model="link.label" v-model:model-en="link.labelEn" label="Название" />
      <label><span>Ссылка</span><input v-model="link.href" type="text" required placeholder="/about или https://example.com"></label>
    </article>
  </section>
</template>
