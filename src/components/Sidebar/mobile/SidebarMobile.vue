<script setup>
import { useSidebarMobile } from '../../../composables/Sidebar/useSidebarMobile'
import MobileContactCards from './MobileContactCards.vue'
import MobileHeader from './MobileHeader.vue'
import MobileMenuNav from './MobileMenuNav.vue'
import './sidebar-mobile.css'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const emit = defineEmits(['update:theme'])

const {
  activeThemeIcon,
  closeMenu,
  inactiveThemeIcon,
  isDarkBackgroundImage,
  isDarkTheme,
  isMenuOpen,
  isThemeButtonHovered,
  menuLinks,
  openMenu,
  themeLabel,
  toggleTheme,
} = useSidebarMobile(props, emit)
</script>

<template>
  <aside
    class="relative min-h-screen min-h-[100svh] overflow-hidden text-white transition-colors duration-500 ease-out"
    :class="isDarkTheme ? 'bg-[#222222]' : 'bg-magnat-red'"
  >
    <Transition name="mobile-sidebar-panel">
      <section
        v-if="!isMenuOpen"
        key="home"
        class="mobile-sidebar-home absolute inset-0 flex min-h-screen min-h-[100svh] flex-col px-9 pb-[84px] pt-5 transition-colors duration-500 ease-out"
        :class="[
          isDarkTheme ? 'bg-[#222222]' : 'bg-magnat-red',
          isDarkBackgroundImage ? 'is-dark-image' : '',
        ]"
      >
        <MobileHeader @open-menu="openMenu" />
      </section>
    </Transition>

    <Transition name="mobile-sidebar-panel">
      <section
        v-if="isMenuOpen"
        key="menu"
        class="absolute inset-0 flex min-h-screen min-h-[100svh] flex-col overflow-y-auto px-[30px] pb-0 pt-5 transition-colors duration-500 ease-out"
        :class="isDarkTheme ? 'bg-[#222222]' : 'bg-magnat-red'"
      >
        <MobileHeader
          is-menu-open
          :active-theme-icon="activeThemeIcon"
          :inactive-theme-icon="inactiveThemeIcon"
          :is-dark-theme="isDarkTheme"
          :is-theme-button-hovered="isThemeButtonHovered"
          :theme-label="themeLabel"
          @close-menu="closeMenu"
          @theme-hover-change="isThemeButtonHovered = $event"
          @toggle-theme="toggleTheme"
        />

        <MobileMenuNav :links="menuLinks" @navigate="closeMenu" />
        <MobileContactCards />
      </section>
    </Transition>
  </aside>
</template>
