import { computed, ref, watch } from 'vue'
import { useSidebar } from './useSidebar'
import type { SidebarTheme } from './useThemeStore'

type SidebarMobileProps = {
  theme: SidebarTheme
}

type SidebarMobileEmit = (event: 'update:theme', value: SidebarTheme) => void

const menuLinks = [
  {
    label: 'Портфолио',
    href: '#portfolio',
  },
  {
    label: 'О нас',
    href: '#about',
  },
  {
    label: 'Контакты',
    href: '#contacts',
  },
]

export function useSidebarMobile(props: SidebarMobileProps, emit: SidebarMobileEmit) {
  const isMenuOpen = ref(false)
  const displayedImageTheme = ref<SidebarTheme>(props.theme)
  let imageFrame = 0

  const sidebar = useSidebar(props, emit)

  const isDarkBackgroundImage = computed(() => displayedImageTheme.value === 'dark')

  watch(
    () => props.theme,
    (theme) => {
      if (typeof window === 'undefined') {
        displayedImageTheme.value = theme
        return
      }

      if (imageFrame) {
        window.cancelAnimationFrame(imageFrame)
      }

      imageFrame = window.requestAnimationFrame(() => {
        displayedImageTheme.value = theme
        imageFrame = 0
      })
    },
    { flush: 'post' },
  )

  function openMenu() {
    isMenuOpen.value = true
  }

  function closeMenu() {
    isMenuOpen.value = false
  }

  return {
    ...sidebar,
    closeMenu,
    isDarkBackgroundImage,
    isMenuOpen,
    menuLinks,
    openMenu,
  }
}
