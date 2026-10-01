<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import './style.css'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
  },
  closable: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const isProjectVariant = computed(() => props.variant === 'project')
const title = computed(() => t(isProjectVariant.value ? 'questionsForm.project.title' : 'questionsForm.title'))

function close() {
  emit('close')
}
</script>

<template>
  <section
    class="questions-form"
    :class="{ 'questions-form--project': isProjectVariant }"
    aria-labelledby="questions-form-title"
  >
    <form class="questions-form__panel" @submit.prevent>
      <button
        v-if="closable"
        class="questions-form__close"
        type="button"
        :aria-label="t('questionsForm.project.close')"
        @click="close"
      >
        <span aria-hidden="true"></span>
      </button>

      <div class="questions-form__header">
        <div class="questions-form__intro">
          <h2 id="questions-form-title" class="questions-form__title">{{ title }}</h2>

          <p class="questions-form__lead">
            {{ t('questionsForm.lead') }}
          </p>
        </div>

        <div v-if="!isProjectVariant" class="questions-form__cat-frame" aria-hidden="true">
          <img
            class="questions-form__cat"
            src="/about_page/Questions_cat.png"
            alt=""
          >
        </div>
      </div>

      <div class="questions-form__fields">
        <input
          class="questions-form__input"
          name="name"
          type="text"
          autocomplete="name"
          :aria-label="t('questionsForm.fields.name')"
          :placeholder="t('questionsForm.fields.name')"
        >

        <input
          class="questions-form__input"
          name="phone"
          type="tel"
          autocomplete="tel"
          :aria-label="t('questionsForm.fields.phone')"
          :placeholder="t('questionsForm.fields.phone')"
        >

        <input
          class="questions-form__input"
          name="email"
          type="email"
          autocomplete="email"
          :aria-label="t('questionsForm.fields.email')"
          :placeholder="t('questionsForm.fields.email')"
        >

        <div class="questions-form__textarea-wrap">
          <textarea
            class="questions-form__textarea"
            name="message"
            rows="4"
            :aria-label="t('questionsForm.fields.message')"
            :placeholder="t('questionsForm.fields.message')"
          ></textarea>
        </div>
      </div>

      <p class="questions-form__agreement">
        {{ t('questionsForm.agreement') }}
      </p>

      <button class="questions-form__button" type="submit">{{ t('questionsForm.submit') }}</button>
    </form>
  </section>
</template>
