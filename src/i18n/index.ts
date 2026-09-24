import { createI18n } from 'vue-i18n'
import desktopHomeEn from '../components/DesktopHome/eng.json'
import desktopHomeRu from '../components/DesktopHome/ru.json'
import onTheMapEn from '../components/OnTheMap/eng.json'
import onTheMapRu from '../components/OnTheMap/ru.json'
import sidebarEn from '../components/Sidebar/eng.json'
import sidebarMobileEn from '../components/Sidebar/mobile/eng.json'
import sidebarMobileRu from '../components/Sidebar/mobile/ru.json'
import sidebarRu from '../components/Sidebar/ru.json'

export const DEFAULT_LOCALE = 'ru'
export const SUPPORTED_LOCALES = ['ru', 'en'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    ru: {
      desktopHome: desktopHomeRu,
      onTheMap: onTheMapRu,
      sidebar: sidebarRu,
      sidebarMobile: sidebarMobileRu,
    },
    en: {
      desktopHome: desktopHomeEn,
      onTheMap: onTheMapEn,
      sidebar: sidebarEn,
      sidebarMobile: sidebarMobileEn,
    },
  },
})

export function isSupportedLocale(locale: unknown): locale is AppLocale {
  return typeof locale === 'string' && SUPPORTED_LOCALES.includes(locale as AppLocale)
}

export function setI18nLocale(locale: AppLocale) {
  i18n.global.locale.value = locale

  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}
