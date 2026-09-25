<script setup>
import { useI18n } from 'vue-i18n'
import { useLanguageStore } from '../../../composables/useLanguageStore'

defineProps({
  activeThemeIcon: {
    type: String,
    default: '',
  },
  inactiveThemeIcon: {
    type: String,
    default: '',
  },
  isDarkTheme: {
    type: Boolean,
    default: false,
  },
  isMenuOpen: {
    type: Boolean,
    default: false,
  },
  showBacking: {
    type: Boolean,
    default: false,
  },
  isFixed: {
    type: Boolean,
    default: false,
  },
  isThemeButtonHovered: {
    type: Boolean,
    default: false,
  },
  themeLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'close-menu',
  'open-menu',
  'theme-hover-change',
  'toggle-theme',
])

const { t } = useI18n()
const languageStore = useLanguageStore()
</script>

<template>
  <header
    class="mobile-header flex items-center justify-between gap-2 transition-[background-color,box-shadow] duration-300 ease-out"
    :class="[
      isFixed ? 'fixed left-0 right-0 top-0 z-[220] px-5 pb-4 pt-5' : 'relative z-10',
      showBacking && !isMenuOpen ? 'mobile-header--backed bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]' : 'bg-transparent',
    ]"
  >
    <a href="/public" :aria-label="t('sidebar.logo')" @click="isMenuOpen && emit('close-menu')">
      <img
        class="h-11 w-[178.98px] max-w-[44vw] transition duration-300 ease-out"
        :src="showBacking && !isMenuOpen ? '/ico/MagnatProfessionalLogo_color.svg' : '/ico/MagnatProfessionalLogo.svg'"
        :alt="t('sidebar.logo')"
      />
    </a>

    <div class="flex shrink-0 items-center gap-1.5 mobile:gap-2.5">
      <button
        class="relative h-9 w-9 transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95 mobile:h-11 mobile:w-11"
        :class="[
          isMenuOpen ? 'opacity-100 hover:scale-[1.04]' : 'pointer-events-none opacity-0',
          isDarkTheme ? 'focus-visible:ring-offset-[#222222]' : 'focus-visible:ring-offset-magnat-red',
        ]"
        type="button"
        :aria-label="themeLabel"
        :aria-hidden="!isMenuOpen"
        :tabindex="isMenuOpen ? 0 : -1"
        @click="emit('toggle-theme')"
        @mouseenter="emit('theme-hover-change', true)"
        @mouseleave="emit('theme-hover-change', false)"
      >
        <img
          class="absolute inset-0 h-9 w-9 transition-opacity duration-300 ease-out mobile:h-11 mobile:w-11"
          :class="isThemeButtonHovered ? 'opacity-0' : 'opacity-100'"
          :src="inactiveThemeIcon"
          alt=""
        />
        <img
          class="absolute inset-0 h-9 w-9 transition-opacity duration-300 ease-out mobile:h-11 mobile:w-11"
          :class="isThemeButtonHovered ? 'opacity-100' : 'opacity-0'"
          :src="activeThemeIcon"
          alt=""
        />
      </button>

      <button
        v-if="!isMenuOpen"
        class="h-9 min-w-11 rounded-full border-2 px-2 text-xs font-semibold uppercase leading-none transition duration-300 ease-out hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95 mobile:h-11 mobile:min-w-14 mobile:px-3 mobile:text-sm"
        :class="[
          showBacking ? 'border-black text-black hover:text-black focus-visible:ring-offset-white' : 'border-white text-white',
          isDarkTheme && !showBacking ? 'hover:text-black focus-visible:ring-offset-[#222222]' : '',
          !isDarkTheme && !showBacking ? 'hover:text-magnat-red focus-visible:ring-offset-magnat-red' : '',
        ]"
        type="button"
        :aria-label="t('sidebarMobile.actions.switchLanguage')"
        @click="languageStore.toggleLocale"
      >
        {{ languageStore.nextLocaleLabel }}
      </button>

      <button
        class="grid h-9 w-9 place-items-center rounded-full transition duration-300 ease-out hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95 mobile:h-11 mobile:w-11"
        :class="isDarkTheme ? 'focus-visible:ring-offset-[#222222]' : 'focus-visible:ring-offset-magnat-red'"
        type="button"
        :aria-label="isMenuOpen ? t('sidebarMobile.actions.closeMenu') : t('sidebarMobile.actions.openMenu')"
        @click="emit(isMenuOpen ? 'close-menu' : 'open-menu')"
      >
        <img
          class="h-9 w-9 transition duration-300 ease-out mobile:h-11 mobile:w-11"
          :class="showBacking && !isMenuOpen ? 'brightness-0' : ''"
          :src="isMenuOpen ? '/ico/cancel.svg' : '/ico/burger/burger_inactive.svg'"
          alt=""
        />
      </button>
    </div>
  </header>
</template>
