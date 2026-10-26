export type ChromeSection = 'header' | 'sidebar' | 'footer'
export type ChromeLink = { id: string; label: string; labelEn: string; href: string }
export type SiteChromeContent = {
  header: { links: ChromeLink[] }
  sidebar: {
    officeText: string; officeTextEn: string; mapLabel: string; mapLabelEn: string
    phone: string; email: string
    serviceOverrides: Omit<ChromeLink, 'href'>[]; extraLinks: ChromeLink[]
  }
  footer: { copyright: string; copyrightEn: string; made: string; madeEn: string; madeHref: string; links: ChromeLink[] }
}
