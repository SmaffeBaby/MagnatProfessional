import { computed } from 'vue'
import { useLanguageStore } from './useLanguageStore'
import { useApiQuery } from './useApiQuery'
import { useHomePanels } from './useHomePanels'
import type { SiteChromeContent } from '../types/siteChrome'
import { defaultSiteChrome, localizedChromeText, renderCopyright, cookieBannerParts } from '../../backend/src/content/siteChromeConfig.js'
export { isExternalChromeLink } from '../../backend/src/content/siteChromeConfig.js'

export function useSiteChrome() {
  const query = useApiQuery<{ content: SiteChromeContent }>(['site-chrome'], '/api/site-chrome')
  const language = useLanguageStore()
  const header = computed(() => query.data.value?.content.header || defaultSiteChrome('header') as SiteChromeContent['header'])
  const sidebar = computed(() => query.data.value?.content.sidebar || defaultSiteChrome('sidebar') as SiteChromeContent['sidebar'])
  const cookie = computed(() => query.data.value?.content.cookie || defaultSiteChrome('cookie') as SiteChromeContent['cookie'])
  const banner = computed(() => cookieBannerParts(cookie.value, language.locale))
  const footer = computed(() => query.data.value?.content.footer || defaultSiteChrome('footer') as SiteChromeContent['footer'])
  const localize = (text: string, textEn?: string) => localizedChromeText(text, textEn, language.locale)
  const headerLinks = computed(() => header.value.links.map(link => ({ ...link, label: localize(link.label, link.labelEn) })))
  const footerLinks = computed(() => footer.value.links.map(link => ({ ...link, label: localize(link.label, link.labelEn) })))
  const copyright = computed(() => renderCopyright(localize(footer.value.copyright, footer.value.copyrightEn)))
  return { header, sidebar, footer, cookie, banner, headerLinks, footerLinks, copyright, localize }
}
export function useSidebarContent() {
  const chrome = useSiteChrome()
  const { panels } = useHomePanels()
  const serviceLinks = computed(() => [
    ...panels.value.map(panel => {
      const override = chrome.sidebar.value.serviceOverrides.find(item => item.id === panel.id)
      return { id: panel.id, href: panel.linkPath || '/portfolio', label: chrome.localize(override?.label || panel.title, override?.labelEn || panel.titleEn || '') }
    }),
    ...chrome.sidebar.value.extraLinks.map(link => ({ ...link, label: chrome.localize(link.label, link.labelEn) })),
  ])
  const officeText = computed(() => chrome.localize(chrome.sidebar.value.officeText, chrome.sidebar.value.officeTextEn))
  const mapLabel = computed(() => chrome.localize(chrome.sidebar.value.mapLabel, chrome.sidebar.value.mapLabelEn))
  const phoneHref = computed(() => `tel:${chrome.sidebar.value.phone.replace(/[^+\d]/g, '')}`)
  return { ...chrome, serviceLinks, officeText, mapLabel, phoneHref }
}
