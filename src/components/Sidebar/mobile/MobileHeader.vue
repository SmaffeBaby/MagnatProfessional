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
  <header class="relative z-10 flex items-start justify-between gap-2">
    <a href="/public" :aria-label="t('sidebar.logo')" @click="isMenuOpen && emit('close-menu')">
      <img class="h-auto w-[150px] max-w-[34vw]" src="/ico/MagnatProfessionalLogo.svg" :alt="t('sidebar.logo')" />
    </a>

    <div class="flex shrink-0 items-center gap-1.5 min-[375px]:gap-2.5">
      <button
        class="relative h-9 w-9 transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95 min-[375px]:h-11 min-[375px]:w-11"
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
          class="absolute inset-0 h-9 w-9 transition-opacity duration-300 ease-out min-[375px]:h-11 min-[375px]:w-11"
          :class="isThemeButtonHovered ? 'opacity-0' : 'opacity-100'"
          :src="inactiveThemeIcon"
          alt=""
        />
        <img
          class="absolute inset-0 h-9 w-9 transition-opacity duration-300 ease-out min-[375px]:h-11 min-[375px]:w-11"
          :class="isThemeButtonHovered ? 'opacity-100' : 'opacity-0'"
          :src="activeThemeIcon"
          alt=""
        />
      </button>

      <button
        v-if="!isMenuOpen"
        class="h-9 min-w-11 rounded-full border-2 border-white px-2 text-xs font-semibold uppercase leading-none text-white transition duration-300 ease-out hover:bg-white hover:text-magnat-red focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95 min-[375px]:h-11 min-[375px]:min-w-14 min-[375px]:px-3 min-[375px]:text-sm"
        :class="isDarkTheme ? 'focus-visible:ring-offset-[#222222]' : 'focus-visible:ring-offset-magnat-red'"
        type="button"
        :aria-label="t('sidebarMobile.actions.switchLanguage')"
        @click="languageStore.toggleLocale"
      >
        {{ languageStore.nextLocaleLabel }}
      </button>

      <button
        class="grid h-9 w-9 place-items-center rounded-full transition duration-300 ease-out hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95 min-[375px]:h-11 min-[375px]:w-11"
        :class="isDarkTheme ? 'focus-visible:ring-offset-[#222222]' : 'focus-visible:ring-offset-magnat-red'"
        type="button"
        :aria-label="isMenuOpen ? t('sidebarMobile.actions.closeMenu') : t('sidebarMobile.actions.openMenu')"
        @click="emit(isMenuOpen ? 'close-menu' : 'open-menu')"
      >
        <img
          class="h-9 w-9 min-[375px]:h-11 min-[375px]:w-11"
          :src="isMenuOpen ? '/ico/cancel.svg' : '/ico/burger/burger_inactive.svg'"
          alt=""
        />
      </button>
    </div>
  </header>
</template>
