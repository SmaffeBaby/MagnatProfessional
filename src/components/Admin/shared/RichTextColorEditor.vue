<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{
  label: string
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = ref<HTMLElement | null>(null)
const isFocused = ref(false)

function syncEditorHtml() {
  if (editor.value && document.activeElement !== editor.value && editor.value.innerHTML !== props.modelValue) {
    editor.value.innerHTML = props.modelValue
  }
}

function updateValue() {
  emit('update:modelValue', editor.value?.innerHTML || '')
}

function applyColor(color: string) {
  editor.value?.focus()
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
      <button type="button" class="button-secondary" @click="applyColor('#000000')">Чёрный</button>
      <button type="button" @click="applyColor('#E3222A')">Красный</button>
    </div>
    <div
      ref="editor"
      class="rich-text-editor__surface"
      :class="{ 'rich-text-editor__surface--focused': isFocused }"
      contenteditable="true"
      @focus="isFocused = true"
      @blur="isFocused = false; updateValue()"
      @input="updateValue"
    />
  </div>
</template>
