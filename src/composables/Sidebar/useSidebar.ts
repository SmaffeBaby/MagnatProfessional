import { computed, ref } from 'vue'

type SidebarTheme = 'light' | 'dark'

type SidebarProps = {
  theme: SidebarTheme
}

type SidebarEmit = (event: 'update:theme', value: SidebarTheme) => void

export function useSidebar(props: SidebarProps, emit: SidebarEmit) {
  const isThemeButtonHovered = ref(false)
  const isDarkTheme = computed(() => props.theme === 'dark')

  const inactiveThemeIcon = computed(() => (
    isDarkTheme.value ? '/ico/sun/Sun_inactive.svg' : '/ico/moon/Moon_inactive.svg'
  ))

  const activeThemeIcon = computed(() => (
    isDarkTheme.value ? '/ico/sun/Sun_active.svg' : '/ico/moon/Moon_active.svg'
  ))

  function toggleTheme() {
    emit('update:theme', isDarkTheme.value ? 'light' : 'dark')
  }

  return {
    activeThemeIcon,
    inactiveThemeIcon,
    isDarkTheme,
    isThemeButtonHovered,
    toggleTheme,
  }
}
