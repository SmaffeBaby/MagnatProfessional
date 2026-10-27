<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCookieConsentStore } from '../../composables/useCookieConsentStore'
import { useSiteChrome } from '../../composables/useSiteChrome'
import './style.css'
const cookieConsentStore = useCookieConsentStore()
const { isAccepted } = storeToRefs(cookieConsentStore)
const { banner } = useSiteChrome()
</script>
<template>
  <Transition name="cookie-consent">
    <aside v-if="!isAccepted" class="cookie-consent" aria-label="Cookie">
      <p class="cookie-consent__text">{{ banner.before }}<RouterLink class="cookie-consent__link" to="/cookie-consent">{{ banner.linkText }}</RouterLink>{{ banner.after }}</p>
      <button class="cookie-consent__button" type="button" @click="cookieConsentStore.accept">{{ banner.buttonText }}</button>
    </aside>
  </Transition>
</template>
