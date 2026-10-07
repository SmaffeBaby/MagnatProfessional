import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useApiQuery } from './useApiQuery'
import { useLanguageStore } from './useLanguageStore'

export type SeoEntryScope = 'page' | 'group' | 'case' | 'element' | 'custom'

export type SeoEntry = {
  id: string
  scope: SeoEntryScope
  path: string
  title: string
  titleEn?: string | null
  description?: string | null
  descriptionEn?: string | null
  keywords?: string | null
  keywordsEn?: string | null
  hashtags?: string | null
  hashtagsEn?: string | null
  ogTitle?: string | null
  ogTitleEn?: string | null
  ogDescription?: string | null
  ogDescriptionEn?: string | null
  ogImageUrl?: string | null
  canonicalPath?: string | null
  robots?: string | null
  priority?: number | null
  changeFrequency?: string | null
  structuredData?: string | null
  metrics?: string | null
  createdAt?: string
  updatedAt?: string
}

export type SeoPayload = {
  entry: SeoEntry
  fallback: boolean
}

const DEFAULT_SEO: SeoEntry = {
  id: 'default',
  scope: 'page',
  path: '/',
  title: 'Magnat Professional',
  titleEn: 'Magnat Professional',
  description: '',
  descriptionEn: '',
  keywords: '',
  keywordsEn: '',
  hashtags: '',
  hashtagsEn: '',
  ogTitle: '',
  ogTitleEn: '',
  ogDescription: '',
  ogDescriptionEn: '',
  ogImageUrl: '',
  canonicalPath: '/',
  robots: 'index,follow',
  priority: 1,
  changeFrequency: 'weekly',
  structuredData: '',
  metrics: '',
}

export function useSeo() {
  const route = useRoute()
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)
  const path = computed(() => normalizePath(route.path || '/'))
  const query = useApiQuery<SeoPayload>(
    computed(() => ['seo', path.value]),
    computed(() => `/api/seo?path=${encodeURIComponent(path.value)}`),
  )
  const entry = computed(() => query.data.value?.entry || DEFAULT_SEO)

  watch([entry, locale, path], ([currentEntry]) => {
    applySeoEntry(currentEntry, locale.value)
  }, { immediate: true })
}

function applySeoEntry(entry: SeoEntry, locale: string) {
  const isEnglish = locale === 'en'
  const title = selectLocalized(entry.title, entry.titleEn, isEnglish) || DEFAULT_SEO.title
  const description = selectLocalized(entry.description, entry.descriptionEn, isEnglish)
  const keywords = selectLocalized(entry.keywords, entry.keywordsEn, isEnglish)
  const hashtags = selectLocalized(entry.hashtags, entry.hashtagsEn, isEnglish)
  const ogTitle = selectLocalized(entry.ogTitle, entry.ogTitleEn, isEnglish) || title
  const ogDescription = selectLocalized(entry.ogDescription, entry.ogDescriptionEn, isEnglish) || description

  document.title = title
  document.documentElement.lang = isEnglish ? 'en' : 'ru'

  setMeta('description', description)
  setMeta('keywords', mergeKeywords(keywords, hashtags))
  setMeta('robots', entry.robots || DEFAULT_SEO.robots || 'index,follow')
  setMetaProperty('og:title', ogTitle)
  setMetaProperty('og:description', ogDescription)
  setMetaProperty('og:type', entry.scope === 'case' ? 'article' : 'website')
  setMetaProperty('og:image', entry.ogImageUrl || '')
  setMetaProperty('og:url', absoluteUrl(entry.canonicalPath || entry.path || '/'))
  setCanonical(entry.canonicalPath || entry.path || '/')
  setStructuredData(entry.structuredData || '')
}

function selectLocalized(value: string | null | undefined, valueEn: string | null | undefined, isEnglish: boolean) {
  return (isEnglish && valueEn ? valueEn : value || '').trim()
}

function mergeKeywords(keywords: string, hashtags: string) {
  return [keywords, hashtags.replace(/#/g, '')]
    .filter(Boolean)
    .join(', ')
}

function setMeta(name: string, content: string) {
  setMetaAttribute('name', name, content)
}

function setMetaProperty(property: string, content: string) {
  setMetaAttribute('property', property, content)
}

function setMetaAttribute(attribute: 'name' | 'property', value: string, content: string) {
  const selector = `meta[${attribute}="${value}"]`
  let meta = document.head.querySelector<HTMLMetaElement>(selector)

  if (!content) {
    meta?.remove()
    return
  }

  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attribute, value)
    document.head.appendChild(meta)
  }

  meta.setAttribute('content', content)
}

function setCanonical(path: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!path) {
    link?.remove()
    return
  }

  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }

  link.setAttribute('href', absoluteUrl(path))
}

function setStructuredData(value: string) {
  const id = 'seo-structured-data'
  let script = document.head.querySelector<HTMLScriptElement>(`script#${id}`)
  const normalized = value.trim()

  if (!normalized) {
    script?.remove()
    return
  }

  if (!script) {
    script = document.createElement('script')
    script.id = id
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }

  script.textContent = normalized
}

function absoluteUrl(path: string) {
  return new URL(normalizePath(path), window.location.origin).toString()
}

function normalizePath(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : '/'
}
