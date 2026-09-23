import { defineStore } from 'pinia'
import { DEFAULT_LOCALE, isSupportedLocale, setI18nLocale } from '../i18n'
import type { AppLocale } from '../i18n'

const LANGUAGE_STORAGE_KEY = 'magnat-language'

function getStoredLocale(): AppLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE
  }

  const storedLocale = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)

  return isSupportedLocale(storedLocale) ? storedLocale : DEFAULT_LOCALE
}

function persistLocale(locale: AppLocale) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, locale)
}

export const useLanguageStore = defineStore('language', {
  state: () => ({
    locale: getStoredLocale(),
  }),

  getters: {
    nextLocale: (state) => (state.locale === 'ru' ? 'en' : 'ru'),
    nextLocaleLabel: (state) => (state.locale === 'ru' ? 'EN' : 'RU'),
  },

  actions: {
    initLocale() {
      setI18nLocale(this.locale)
    },

    setLocale(locale: AppLocale) {
      const nextLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE

      this.locale = nextLocale
      persistLocale(nextLocale)
      setI18nLocale(nextLocale)
    },

    toggleLocale() {
      this.setLocale(this.nextLocale)
    },
  },
})
