<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const currentYear = new Date().getFullYear()
const { t } = useI18n()
</script>

<template>
  <footer class="site-footer" :aria-label="t('footer.label')">
    <div class="site-footer__line" aria-hidden="true" />

    <div class="site-footer__content">
      <p class="site-footer__copyright">
        {{ t('footer.copyright', { year: currentYear }) }}
      </p>

      <a class="site-footer__privacy" href="/privacy">
        {{ t('footer.privacy') }}
      </a>

      <p class="site-footer__made">
        {{ t('footer.made') }}
      </p>
    </div>
  </footer>
</template>

<style src="./style.css" scoped></style>
