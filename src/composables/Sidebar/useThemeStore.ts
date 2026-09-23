import { defineStore } from 'pinia'

export type SidebarTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'magnat-theme'

const themeAssets = [
  '/main_page/TringleLogo_mobile.png',
  '/main_page/TringleLogoBlack_mobile.png',
  '/ico/moon/Moon_inactive.svg',
  '/ico/moon/Moon_active.svg',
  '/ico/sun/Sun_inactive.svg',
  '/ico/sun/Sun_active.svg',
]

const preloadedAssets = new Set<string>()

function getStoredTheme(): SidebarTheme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

  return storedTheme === 'dark' ? 'dark' : 'light'
}

function persistTheme(theme: SidebarTheme) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

function preloadImage(src: string) {
  if (typeof window === 'undefined' || preloadedAssets.has(src)) {
    return
  }

  preloadedAssets.add(src)

  const preloadLink = document.createElement('link')
  preloadLink.rel = 'preload'
  preloadLink.as = 'image'
  preloadLink.href = src
  document.head.append(preloadLink)

  const image = new Image()
  image.decoding = 'async'
  image.src = src

  if (image.decode) {
    image.decode().catch(() => undefined)
  }
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: getStoredTheme() as SidebarTheme,
  }),

  getters: {
    isDarkTheme: (state) => state.theme === 'dark',
  },

  actions: {
    setTheme(theme: SidebarTheme) {
      this.theme = theme
      persistTheme(theme)
    },

    toggleTheme() {
      this.setTheme(this.isDarkTheme ? 'light' : 'dark')
    },

    preloadThemeAssets() {
      themeAssets.forEach(preloadImage)
    },
  },
})
