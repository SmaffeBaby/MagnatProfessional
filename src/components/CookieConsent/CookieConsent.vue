<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCookieConsentStore } from '../../composables/useCookieConsentStore'
import { useLanguageStore } from '../../composables/useLanguageStore'
import './style.css'

const cookieConsentStore = useCookieConsentStore()
const { isAccepted } = storeToRefs(cookieConsentStore)
const languageStore = useLanguageStore()
const { locale } = storeToRefs(languageStore)

const content = computed(() => {
  if (locale.value === 'en') {
    return {
      textBeforeAgreement: 'We use cookies to make the website more convenient for you. And analytics systems to understand who visits us. Details are available in the',
      agreement: 'User agreement',
      textBetweenLinks: 'and',
      policy: 'Policy',
      button: 'Accept',
    }
  }

  return {
    textBeforeAgreement: 'Мы используем файлы cookie, чтобы вам было удобнее. И метрические системы, чтобы знать, кто к нам приходит. Подробности — в',
    agreement: 'Пользовательском соглашении',
    textBetweenLinks: 'и',
    policy: 'Политике',
    button: 'Согласен',
  }
})
</script>

<template>
  <Transition name="cookie-consent">
    <aside
      v-if="!isAccepted"
      class="cookie-consent"
      aria-label="Cookie"
    >
      <p class="cookie-consent__text">
        {{ content.textBeforeAgreement }}
        <RouterLink class="cookie-consent__link" to="/user-agreement">
          {{ content.agreement }}
        </RouterLink>
        {{ content.textBetweenLinks }}
        <RouterLink class="cookie-consent__link" to="/policy">
          {{ content.policy }}
        </RouterLink>.
      </p>

      <button class="cookie-consent__button" type="button" @click="cookieConsentStore.accept">
        {{ content.button }}
      </button>
    </aside>
  </Transition>
</template>
