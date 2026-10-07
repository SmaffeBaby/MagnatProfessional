<script setup>
import { onUnmounted, ref, watch } from 'vue'
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
  isAboutActive: {
    type: Boolean,
    default: false,
  },
  isContentPageActive: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:theme', 'open-map', 'menu-open-change'])

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

const isMenuFrameActive = ref(false)
let menuFrameTimer = 0
const MENU_FRAME_RELEASE_DELAY_MS = 360

watch(isMenuOpen, (isOpen) => {
  window.clearTimeout(menuFrameTimer)

  if (isOpen) {
    isMenuFrameActive.value = true
    return
  }

  menuFrameTimer = window.setTimeout(() => {
    isMenuFrameActive.value = false
  }, MENU_FRAME_RELEASE_DELAY_MS)
})

onUnmounted(() => {
  window.clearTimeout(menuFrameTimer)
})

defineExpose({
  openMenu,
})
</script>

<template>
  <aside
    class="mobile-sidebar-shell overflow-hidden text-white"
    :class="[
      isDarkTheme ? 'is-dark-theme' : '',
      isAboutActive && !isDarkTheme && !isMenuFrameActive ? 'is-about-light' : '',
      isMenuFrameActive && !isDarkTheme ? 'is-menu-open' : '',
      isContentPageActive && !isMenuFrameActive ? 'relative' : 'min-h-screen min-h-[100svh]',
      isMenuFrameActive ? 'fixed inset-0 z-[600]' : 'relative',
    ]"
  >
    <Transition name="mobile-sidebar-panel">
      <section
        v-if="!isMenuOpen"
        key="home"
        class="mobile-sidebar-home z-[1] flex flex-col overflow-y-auto px-5 pt-5"
        :class="isContentPageActive ? 'relative pb-5' : 'absolute inset-0 min-h-screen min-h-[100svh] pb-[84px]'"
      >
        <MobileThemeImage v-if="!isContentPageActive" :theme="theme" />
        <MobileHeader
          :is-dark-theme="isDarkTheme"
          :is-about-light="isAboutActive && !isDarkTheme"
          @open-menu="openMenu"
        />
        <MainText v-if="!isContentPageActive" :theme="theme" />
      </section>
    </Transition>

    <Transition name="mobile-sidebar-panel">
      <section
        v-if="isMenuOpen"
        key="menu"
        class="mobile-sidebar-menu absolute inset-0 z-[1] flex min-h-screen min-h-[100svh] flex-col overflow-y-auto px-5 pb-0 pt-5"
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
