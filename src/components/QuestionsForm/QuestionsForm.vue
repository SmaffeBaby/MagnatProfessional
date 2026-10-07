<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
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
const form = reactive({
  name: '',
  phone: '',
  email: '',
  message: '',
})
const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref('')

function close() {
  emit('close')
}

function resetForm() {
  form.name = ''
  form.phone = ''
  form.email = ''
  form.message = ''
}

async function submitForm() {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  submitError.value = ''
  submitSuccess.value = ''

  try {
    const response = await fetch('/api/project-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...form,
        source: isProjectVariant.value ? 'project-drawer' : 'questions-form',
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload.error || t('questionsForm.messages.error'))
    }

    resetForm()
    submitSuccess.value = t('questionsForm.messages.success')
  } catch (error) {
    submitError.value = (error as Error).message || t('questionsForm.messages.error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section
    class="questions-form"
    :class="{ 'questions-form--project': isProjectVariant }"
    aria-labelledby="questions-form-title"
  >
    <form class="questions-form__panel" @submit.prevent="submitForm">
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
          v-model="form.name"
          class="questions-form__input"
          name="name"
          type="text"
          autocomplete="name"
          required
          :aria-label="t('questionsForm.fields.name')"
          :placeholder="t('questionsForm.fields.name')"
        >

        <input
          v-model="form.phone"
          class="questions-form__input"
          name="phone"
          type="tel"
          autocomplete="tel"
          :aria-label="t('questionsForm.fields.phone')"
          :placeholder="t('questionsForm.fields.phone')"
        >

        <input
          v-model="form.email"
          class="questions-form__input"
          name="email"
          type="email"
          autocomplete="email"
          :aria-label="t('questionsForm.fields.email')"
          :placeholder="t('questionsForm.fields.email')"
        >

        <div class="questions-form__textarea-wrap">
          <textarea
            v-model="form.message"
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

      <p
        v-if="submitError || submitSuccess"
        class="questions-form__message"
        :class="{ 'questions-form__message--error': submitError }"
        aria-live="polite"
      >
        {{ submitError || submitSuccess }}
      </p>

      <button class="questions-form__button" type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? t('questionsForm.sending') : t('questionsForm.submit') }}
      </button>
    </form>
  </section>
</template>
