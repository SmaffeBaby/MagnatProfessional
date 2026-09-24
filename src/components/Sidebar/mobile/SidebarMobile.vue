<script setup>
import { useSidebarMobile } from '../../../composables/Sidebar/useSidebarMobile'
import MainText from '../../MainText/MainText.vue'
import MobileContactCards from './MobileContactCards.vue'
import MobileHeader from './MobileHeader.vue'
import MobileMenuNav from './MobileMenuNav.vue'
import MobileThemeImage from './MobileThemeImage.vue'
import './sidebar-mobile.css'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const emit = defineEmits(['update:theme', 'open-map'])

const {
  activeThemeIcon,
  closeMenu,
  inactiveThemeIcon,
  isDarkTheme,
  isMenuOpen,
  isThemeButtonHovered,
  menuLinks,
  openMenu,
  toggleTheme,
} = useSidebarMobile(props, emit)
</script>

<template>
  <aside
    class="mobile-sidebar-shell relative min-h-screen min-h-[100svh] overflow-hidden text-white"
    :class="isDarkTheme ? 'is-dark-theme' : ''"
  >
    <Transition name="mobile-sidebar-panel">
      <section
        v-if="!isMenuOpen"
        key="home"
        class="mobile-sidebar-home absolute inset-0 z-[1] flex min-h-screen min-h-[100svh] flex-col overflow-y-auto px-5 pb-[84px] pt-5"
      >
        <MobileThemeImage :theme="theme" />
        <MobileHeader :is-dark-theme="isDarkTheme" @open-menu="openMenu" />
        <MainText :theme="theme" />
      </section>
    </Transition>

    <Transition name="mobile-sidebar-panel">
      <section
        v-if="isMenuOpen"
        key="menu"
        class="absolute inset-0 z-[1] flex min-h-screen min-h-[100svh] flex-col overflow-y-auto px-5 pb-0 pt-5"
      >
        <MobileHeader
          is-menu-open
          :active-theme-icon="activeThemeIcon"
          :inactive-theme-icon="inactiveThemeIcon"
          :is-dark-theme="isDarkTheme"
          :is-theme-button-hovered="isThemeButtonHovered"
          :theme-label="isDarkTheme ? $t('sidebarMobile.actions.enableLightTheme') : $t('sidebarMobile.actions.enableDarkTheme')"
          @close-menu="closeMenu"
          @theme-hover-change="isThemeButtonHovered = $event"
          @toggle-theme="toggleTheme"
        />

        <MobileMenuNav :links="menuLinks" @navigate="closeMenu" />
        <MobileContactCards @open-map="emit('open-map')" />
      </section>
    </Transition>
  </aside>
</template>
