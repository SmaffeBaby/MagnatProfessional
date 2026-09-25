<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import YandexMapWidget from '../OnTheMap/YandexMapWidget.vue'

const { t } = useI18n()
</script>

<template>
  <section id="contacts" class="map-section" aria-labelledby="map-section-title">
    <div class="map-section__line" aria-hidden="true" />

    <div class="map-section__content">
      <address class="map-section__contacts">
        <h2 id="map-section-title" class="map-section__address">
          {{ t('onTheMap.address') }}
        </h2>

        <a class="map-section__phone" href="tel:+78123404478">
          +7 (812) 340-44-78
        </a>

        <a class="map-section__email" href="mailto:office@magnatmedia.com">
          office@magnatmedia.com
        </a>

        <div class="map-section__socials" aria-label="Социальные ссылки">
          <a class="map-section__social-link" href="#" aria-label="Telegram">TG</a>
          <a class="map-section__social-link" href="#" aria-label="HeadHunter">HH</a>
        </div>
      </address>

      <div class="map-section__map-wrap">
        <img class="map-section__cat" src="/ico/cat.svg" alt="" aria-hidden="true">

        <div class="map-section__map">
          <YandexMapWidget :title="t('onTheMap.mapTitle')" />
        </div>
      </div>
    </div>
  </section>
</template>

<style src="./style.css" scoped></style>
