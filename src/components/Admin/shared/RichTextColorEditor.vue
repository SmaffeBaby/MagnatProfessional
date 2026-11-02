<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { isSafeChromeLink } from '../../../../backend/src/content/siteChromeConfig.js'

const props = defineProps<{
  label: string
  modelValue: string
  linksOnly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = ref<HTMLElement | null>(null)
const isFocused = ref(false)
const linkEditorOpen = ref(false)
const linkUrl = ref('')
const linkError = ref('')
const linkInput = ref<HTMLInputElement | null>(null)
let savedRange: Range | null = null

function saveSelection() {
  const selection = window.getSelection()
  if (!selection?.rangeCount || !editor.value) return
  const range = selection.getRangeAt(0)
  if (editor.value.contains(range.startContainer) && editor.value.contains(range.endContainer)) {
    savedRange = range.cloneRange()
  }
}

function restoreSelection() {
  if (!savedRange || !editor.value?.contains(savedRange.startContainer) || !editor.value.contains(savedRange.endContainer)) return false
  const range = savedRange.cloneRange()
  editor.value.focus()
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  savedRange = range
  return true
}

async function openLinkEditor() {
  saveSelection()
  if (!savedRange || savedRange.collapsed) {
    linkError.value = 'Сначала выделите слова, на которые нужно добавить ссылку.'
    return
  }
  const node = savedRange.startContainer
  const anchor = (node instanceof Element ? node : node.parentElement)?.closest('a')
  linkUrl.value = anchor?.getAttribute('href') || '/privacy'
  linkError.value = ''
  linkEditorOpen.value = true
  await nextTick()
  linkInput.value?.focus()
}

function applyLink() {
  const href = linkUrl.value.trim()
  if (!isSafeChromeLink(href)) {
    linkError.value = 'Укажите адрес вида /privacy, https://example.com, mailto:… или tel:…'
    return
  }
  if (!restoreSelection()) {
    linkError.value = 'Выделите текст заново.'
    return
  }
  document.execCommand('createLink', false, href)
  linkEditorOpen.value = false
  linkError.value = ''
  updateValue()
  saveSelection()
}

function removeLink() {
  if (!restoreSelection()) return
  document.execCommand('unlink')
  linkEditorOpen.value = false
  linkError.value = ''
  updateValue()
  saveSelection()
}

function syncEditorHtml() {
  if (editor.value && document.activeElement !== editor.value && editor.value.innerHTML !== props.modelValue) {
    editor.value.innerHTML = props.modelValue
    savedRange = null
  }
}

function updateValue() {
  emit('update:modelValue', editor.value?.innerHTML || '')
}

function applyColor(color: string) {
  saveSelection()
  if (!restoreSelection()) return
  document.execCommand('foreColor', false, color)
  updateValue()
}

watch(() => props.modelValue, () => {
  nextTick(syncEditorHtml)
}, { immediate: true })
</script>

<template>
  <div class="rich-text-editor">
    <span class="rich-text-editor__label">{{ label }}</span>
    <div class="rich-text-editor__toolbar">
      <button v-if="!linksOnly" type="button" class="button-secondary" @mousedown.prevent @click="applyColor('#000000')">Чёрный</button>
      <button v-if="!linksOnly" type="button" @mousedown.prevent @click="applyColor('#E3222A')">Красный</button>
      <button type="button" class="button-secondary" @mousedown.prevent @click="openLinkEditor">Ссылка</button>
      <button type="button" class="button-secondary" @mousedown.prevent @click="removeLink">Удалить ссылку</button>
    </div>
    <div v-if="linkEditorOpen" class="rich-text-editor__link" role="group" aria-label="Настройка ссылки">
      <label><span>Адрес ссылки</span><input ref="linkInput" v-model="linkUrl" type="text" placeholder="/privacy или https://example.com" @keydown.enter.prevent="applyLink" @keydown.esc.prevent="linkEditorOpen = false; restoreSelection()"></label>
      <button type="button" @click="applyLink">Применить ссылку</button>
      <button type="button" class="button-secondary" @click="linkEditorOpen = false; restoreSelection()">Отмена</button>
    </div>
    <p v-if="linkError" class="admin-message admin-message--error" role="alert">{{ linkError }}</p>
    <div
      ref="editor"
      class="rich-text-editor__surface"
      :class="{ 'rich-text-editor__surface--focused': isFocused }"
      contenteditable="true"
      role="textbox"
      :aria-label="label"
      aria-multiline="true"
      @focus="isFocused = true; saveSelection()"
      @blur="saveSelection(); isFocused = false; updateValue()"
      @mouseup="saveSelection"
      @keyup="saveSelection"
      @input="updateValue(); saveSelection()"
      @click.prevent
    />
  </div>
</template>
