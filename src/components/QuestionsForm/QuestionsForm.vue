<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import './style.css'

const { t } = useI18n()
</script>

<template>
  <section class="questions-form" aria-labelledby="questions-form-title">
    <form class="questions-form__panel" @submit.prevent>
      <div class="questions-form__header">
        <div class="questions-form__intro">
          <h2 id="questions-form-title" class="questions-form__title">{{ t('questionsForm.title') }}</h2>

          <p class="questions-form__lead">
            {{ t('questionsForm.lead') }}
          </p>
        </div>

        <div class="questions-form__cat-frame" aria-hidden="true">
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
