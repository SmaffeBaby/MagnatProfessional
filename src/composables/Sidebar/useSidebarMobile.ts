import { onUnmounted, ref, watch } from 'vue'
import { useSidebar } from './useSidebar'
import type { SidebarTheme } from './useThemeStore'

type SidebarMobileProps = {
  theme: SidebarTheme
}

type SidebarMobileEmit = {
  (event: 'update:theme', value: SidebarTheme): void
  (event: 'menu-open-change', value: boolean): void
}

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
  let previousBodyOverflow = ''

  function openMenu() {
    isMenuOpen.value = true
  }

  function closeMenu() {
    isMenuOpen.value = false
  }

  function unlockBodyScroll() {
    document.body.style.overflow = previousBodyOverflow
  }

  watch(isMenuOpen, (isOpen) => {
    emit('menu-open-change', isOpen)

    if (isOpen) {
      previousBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return
    }

    unlockBodyScroll()
  })

  onUnmounted(() => {
    unlockBodyScroll()
  })

  return {
    ...sidebar,
    closeMenu,
    isMenuOpen,
    menuLinks,
    openMenu,
  }
}
