import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { homeNavLinks } from './useHomeNavigation'
import { useLanguageStore } from './useLanguageStore'

type Theme = 'light' | 'dark'

type MobileSidebarExpose = {
  openMenu: () => void
}

export function useResponsiveHeaderBacking(theme: Ref<Theme>) {
  const isHeaderBackingVisible = ref(false)
  const isMobileMenuOpen = ref(false)
  const mobileSidebar = ref<MobileSidebarExpose | null>(null)
  const languageStore = useLanguageStore()
  const { t } = useI18n()

  const isDarkTheme = computed(() => theme.value === 'dark')
  const inactiveThemeIcon = computed(() => (
    isDarkTheme.value ? '/ico/sun/Sun_inactive.svg' : '/ico/moon/Moon_inactive.svg'
  ))

  let lastScrollY = 0

  function handleWindowScroll() {
    const currentScrollY = window.scrollY
    const scrollDelta = Math.abs(currentScrollY - lastScrollY)

    if (scrollDelta < 4) {
      return
    }

    if (currentScrollY <= 24) {
      isHeaderBackingVisible.value = false
    }
    else {
      isHeaderBackingVisible.value = currentScrollY < lastScrollY
    }

    lastScrollY = currentScrollY
  }

  function openMobileMenu() {
    isMobileMenuOpen.value = true
    mobileSidebar.value?.openMenu()
  }

  function toggleTheme() {
    theme.value = isDarkTheme.value ? 'light' : 'dark'
  }

  onMounted(() => {
    lastScrollY = window.scrollY
    window.addEventListener('scroll', handleWindowScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleWindowScroll)
  })

  return {
    inactiveThemeIcon,
    isDarkTheme,
    isHeaderBackingVisible,
    isMobileMenuOpen,
    languageStore,
    mobileSidebar,
    navLinks: homeNavLinks,
    openMobileMenu,
    t,
    toggleTheme,
  }
}
