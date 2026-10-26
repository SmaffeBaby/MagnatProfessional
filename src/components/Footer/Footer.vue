<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SharedLink from '../SharedLink.vue'
import { useSiteChrome } from '../../composables/useSiteChrome'
const { t } = useI18n()
const { footer, footerLinks, copyright, localize } = useSiteChrome()
</script>
<template>
  <footer class="site-footer" :aria-label="t('footer.label')">
    <div class="site-footer__line" aria-hidden="true" />
    <div class="site-footer__content">
      <p class="site-footer__copyright">{{ copyright }}</p>
      <SharedLink v-for="link in footerLinks" :key="link.id" class="site-footer__privacy" :href="link.href">{{ link.label }}</SharedLink>
      <SharedLink v-if="footer.madeHref" class="site-footer__made site-footer__privacy" :href="footer.madeHref">{{ localize(footer.made, footer.madeEn) }}</SharedLink>
      <p v-else class="site-footer__made">{{ localize(footer.made, footer.madeEn) }}</p>
    </div>
  </footer>
</template>
<style src="./style.css" scoped></style>
