<script setup lang="ts">
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import Footer from '../Footer/Footer.vue'
import YandexMapWidget from '../OnTheMap/YandexMapWidget.vue'
import './style.css'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const { t } = useI18n()
const isDarkTheme = computed(() => props.theme === 'dark')
const openProjectForm = inject<(() => void) | null>('openProjectForm', null)

function handleProjectClick() {
  openProjectForm?.()
}
</script>

<template>
  <div
    class="contacts-content"
    :class="{ 'contacts-content--dark': isDarkTheme }"
  >
    <section class="contacts-content__main" aria-labelledby="contacts-content-title">
      <address class="contacts-content__address-block">
        <h1 id="contacts-content-title" class="contacts-content__address">
          {{ t('contactsContent.address') }}
        </h1>

        <a class="contacts-content__phone" href="tel:+78123404478">
          +7 (812) 340-44-78
        </a>

        <a class="contacts-content__email" href="mailto:office@magnatmedia.com">
          office@magnatmedia.com
        </a>
      </address>

      <div class="contacts-content__actions">
        <button class="contacts-content__project-button" type="button" @click="handleProjectClick">
          {{ t('contactsContent.project') }}
        </button>

        <div class="contacts-content__socials" :aria-label="t('contactsContent.socialsLabel')">
          <a class="contacts-content__social-link" href="#" aria-label="Telegram">TG</a>
          <a class="contacts-content__social-link" href="#" aria-label="HeadHunter">HH</a>
        </div>
      </div>

      <div class="contacts-content__map" :aria-label="t('contactsContent.mapTitle')">
        <YandexMapWidget :title="t('contactsContent.mapTitle')" />
      </div>
    </section>

    <Footer />
  </div>
</template>
