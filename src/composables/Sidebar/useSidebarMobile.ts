import { ref } from 'vue'
import { useSidebar } from './useSidebar'
import type { SidebarTheme } from './useThemeStore'

type SidebarMobileProps = {
  theme: SidebarTheme
}

type SidebarMobileEmit = (event: 'update:theme', value: SidebarTheme) => void

const menuLinks = [
  {
    labelKey: 'sidebarMobile.navigation.portfolio',
    href: '#portfolio',
  },
  {
    labelKey: 'sidebarMobile.navigation.about',
    href: '#about',
  },
  {
    labelKey: 'sidebarMobile.navigation.contacts',
    href: '#contacts',
  },
]

export function useSidebarMobile(props: SidebarMobileProps, emit: SidebarMobileEmit) {
  const isMenuOpen = ref(false)

  const sidebar = useSidebar(props, emit)

  function openMenu() {
    isMenuOpen.value = true
  }

  function closeMenu() {
    isMenuOpen.value = false
  }

  return {
    ...sidebar,
    closeMenu,
    isMenuOpen,
    menuLinks,
    openMenu,
  }
}
