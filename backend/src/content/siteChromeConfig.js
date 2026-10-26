const navigation = [
  { id: 'portfolio', label: 'Портфолио', labelEn: 'Portfolio', href: '/portfolio' },
  { id: 'about', label: 'О нас', labelEn: 'About us', href: '/about' },
  { id: 'contacts', label: 'Контакты', labelEn: 'Contacts', href: '/contacts' },
]
const defaults = {
  header: { links: navigation },
  sidebar: {
    officeText: 'Мы располагаемся на Васильевском острове и будем рады видеть вас в нашем офисе',
    officeTextEn: 'We are located on Vasilyevsky Island and will be happy to welcome you to our office',
    mapLabel: 'На карте', mapLabelEn: 'On the map',
    phone: '+7 (812) 340-44-78', email: 'office@magnatmedia.com',
    serviceOverrides: [], extraLinks: [],
  },
  footer: {
    copyright: '© {year} MAGNAT PROFESSIONAL | Все права защищены',
    copyrightEn: '© {year} MAGNAT PROFESSIONAL | All rights reserved',
    links: [{ id: 'privacy', label: 'Политика конфиденциальности', labelEn: 'Privacy Policy', href: '/privacy' }],
    made: 'Сделано в MAGNAT PROFESSIONAL', madeEn: 'Made by MAGNAT PROFESSIONAL', madeHref: '',
  },
}
export const SITE_CHROME_SECTIONS = Object.keys(defaults)
export function defaultSiteChrome(section) { return structuredClone(defaults[section]) }
export function localizedChromeText(text, textEn, locale) { return locale === 'en' && textEn ? textEn : text }
export function renderCopyright(template, year = new Date().getFullYear()) { return String(template || '').replaceAll('{year}', String(year)) }
export function isExternalChromeLink(href) { return /^(https?:|mailto:|tel:)/i.test(href) }
export function isSafeChromeLink(href, optional = false) {
  if (typeof href !== 'string') return false
  if (!href) return optional
  if (href.length > 2048 || /[\s\\\u0000-\u001f\u007f]/.test(href)) return false
  if (/^\/(?!\/)/.test(href) || /^#[^#]*$/.test(href)) return true
  if (/^https?:\/\//i.test(href)) {
    try { const url = new URL(href); return Boolean(url.hostname) && !url.username && !url.password } catch { return false }
  }
  return /^(mailto:)[^@]+@[^@]+$/i.test(href) || /^tel:\+?[\d().-]+$/i.test(href)
}
function invalid(message) { throw Object.assign(new Error(message), { status: 400 }) }
function text(value, label, max = 4000) {
  if (typeof value !== 'string' || value.length > max) invalid(`Некорректное поле «${label}» (до ${max} символов)`)
  return value.trim()
}
function bilingual(value, field, max) {
  return { [field]: text(value[field], field, max), [`${field}En`]: text(value[`${field}En`], `${field}En`, max) }
}
function list(value, overrides = false) {
  if (!Array.isArray(value) || value.length > 100) invalid('Список должен содержать не более 100 элементов')
  const ids = new Set()
  return value.map(item => {
    if (!item || typeof item !== 'object') invalid('Некорректный элемент списка')
    const id = text(item.id, 'ID', 100)
    if (!/^[\w-]+$/.test(id) || ids.has(id)) invalid('ID элементов должны быть уникальными')
    ids.add(id)
    const labels = bilingual(item, 'label', 240)
    if (!overrides && !labels.label) invalid('Заполните название ссылки на русском языке')
    if (overrides) return { id, ...labels }
    const href = text(item.href, 'Ссылка', 2048)
    if (!isSafeChromeLink(href)) invalid('Укажите ссылку вида /about, #contacts, https://…, mailto:… или tel:…')
    return { id, ...labels, href }
  })
}
export function validateSiteChrome(section, input) {
  if (!SITE_CHROME_SECTIONS.includes(section)) invalid('Неизвестный раздел')
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid('Некорректные данные раздела')
  if (section === 'header') return { links: list(input.links) }
  if (section === 'sidebar') {
    const phone = text(input.phone, 'Телефон', 80)
    const email = text(input.email, 'Email', 254)
    if (phone && !/^\+?[\d\s().-]+$/.test(phone)) invalid('Некорректный телефон')
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid('Некорректный email')
    return { ...bilingual(input, 'officeText'), ...bilingual(input, 'mapLabel', 240), phone, email,
      serviceOverrides: list(input.serviceOverrides, true), extraLinks: list(input.extraLinks) }
  }
  const madeHref = text(input.madeHref, 'Ссылка подписи', 2048)
  if (!isSafeChromeLink(madeHref, true)) invalid('Некорректная ссылка подписи')
  return { ...bilingual(input, 'copyright', 500), ...bilingual(input, 'made', 500), madeHref, links: list(input.links) }
}
