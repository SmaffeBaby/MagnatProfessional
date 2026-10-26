import { useSiteChrome } from '../useSiteChrome'
import { ref, watch } from 'vue'
import { useSidebar } from './useSidebar'
import type { SidebarTheme } from './useThemeStore'

type SidebarMobileProps = {
  theme: SidebarTheme
}

type SidebarMobileEmit = {
  (event: 'update:theme', value: SidebarTheme): void
  (event: 'menu-open-change', value: boolean): void
}

export function useSidebarMobile(props: SidebarMobileProps, emit: SidebarMobileEmit) {
  const isMenuOpen = ref(false)
  const { headerLinks: menuLinks } = useSiteChrome()

  const sidebar = useSidebar(props, emit)

  function openMenu() {
    isMenuOpen.value = true
  }

  function closeMenu() {
    isMenuOpen.value = false
  }

  watch(isMenuOpen, (isOpen) => {
    emit('menu-open-change', isOpen)
  })

  return {
    ...sidebar,
    closeMenu,
    isMenuOpen,
    menuLinks,
    openMenu,
  }
}
