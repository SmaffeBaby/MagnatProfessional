import { defineStore } from 'pinia'

const COOKIE_CONSENT_STORAGE_KEY = 'magnat-cookie-consent'

function getInitialConsent() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) === 'accepted'
}

export const useCookieConsentStore = defineStore('cookieConsent', {
  state: () => ({
    isAccepted: getInitialConsent(),
  }),

  actions: {
    accept() {
      this.isAccepted = true

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, 'accepted')
      }
    },
  },
})
