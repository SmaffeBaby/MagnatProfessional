<script setup lang="ts">
withDefaults(defineProps<{ label: string; modelValue: string; modelEn: string; multiline?: boolean; placeholder?: string; placeholderEn?: string }>(), { multiline: false })
defineEmits<{ 'update:modelValue': [value: string]; 'update:modelEn': [value: string] }>()
</script>
<template>
  <div class="admin-bilingual-field">
    <label><span>{{ label }} · Русский</span><textarea v-if="multiline" :value="modelValue" :placeholder="placeholder" rows="4" @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)" /><input v-else type="text" :value="modelValue" :placeholder="placeholder" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"></label>
    <label><span>{{ label }} · English</span><textarea v-if="multiline" :value="modelEn" :placeholder="placeholderEn" rows="4" @input="$emit('update:modelEn', ($event.target as HTMLTextAreaElement).value)" /><input v-else type="text" :value="modelEn" :placeholder="placeholderEn" @input="$emit('update:modelEn', ($event.target as HTMLInputElement).value)"></label>
  </div>
</template>
