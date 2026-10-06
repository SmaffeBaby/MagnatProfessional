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
  isAboutLight: {
    type: Boolean,
    default: false,
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
    class="mobile-header flex items-center justify-between gap-2 transition-[background-color] duration-300 ease-out"
    :class="[
      isFixed ? 'fixed left-0 right-0 top-0 z-[220] px-5 pb-4 pt-5' : 'relative z-10',
      showBacking && !isMenuOpen ? 'mobile-header--backed bg-white' : 'bg-transparent',
    ]"
  >
    <RouterLink to="/" :aria-label="t('sidebar.logo')" @click="isMenuOpen && emit('close-menu')">
      <img
        class="mobile-header__logo h-11 w-[178.98px] max-w-[44vw] transition duration-300 ease-out"
        :src="(showBacking || isAboutLight) && !isMenuOpen ? '/ico/MagnatProfessionalLogo_color.svg' : '/ico/MagnatProfessionalLogo.svg'"
        :alt="t('sidebar.logo')"
      />
    </RouterLink>

    <div class="mobile-header__actions flex shrink-0 items-center gap-1.5 mobile:gap-2.5">
      <button
        class="mobile-header__theme-button relative h-9 w-9 transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95 mobile:h-11 mobile:w-11"
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
          class="mobile-header__theme-icon absolute inset-0 h-9 w-9 transition-opacity duration-300 ease-out mobile:h-11 mobile:w-11"
          :class="isThemeButtonHovered ? 'opacity-0' : 'opacity-100'"
          :src="inactiveThemeIcon"
          alt=""
        />
        <img
          class="mobile-header__theme-icon absolute inset-0 h-9 w-9 transition-opacity duration-300 ease-out mobile:h-11 mobile:w-11"
          :class="isThemeButtonHovered ? 'opacity-100' : 'opacity-0'"
          :src="activeThemeIcon"
          alt=""
        />
      </button>

      <button
        v-if="!isMenuOpen"
        class="mobile-header__language-button h-9 min-w-11 rounded-full border-2 px-2 text-xs font-semibold uppercase leading-none transition duration-300 ease-out hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95 mobile:h-11 mobile:min-w-14 mobile:px-3 mobile:text-sm"
        :class="[
          showBacking || isAboutLight ? 'border-black text-black hover:border-magnat-light hover:bg-magnat-light hover:text-white active:border-magnat-light active:bg-white active:text-magnat-light focus-visible:ring-offset-white' : 'border-white text-white active:border-white active:bg-white active:text-magnat-red',
          isDarkTheme && !showBacking && !isAboutLight ? 'hover:text-black focus-visible:ring-offset-[#222222]' : '',
          !isDarkTheme && !showBacking && !isAboutLight ? 'hover:text-magnat-red focus-visible:ring-offset-magnat-red' : '',
        ]"
        type="button"
        :aria-label="t('sidebarMobile.actions.switchLanguage')"
        @click="languageStore.toggleLocale"
      >
        {{ languageStore.nextLocaleLabel }}
      </button>

      <button
        class="mobile-header__menu-button grid h-9 w-9 place-items-center rounded-full transition duration-300 ease-out hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95 mobile:h-11 mobile:w-11"
        :class="isDarkTheme ? 'focus-visible:ring-offset-[#222222]' : 'focus-visible:ring-offset-magnat-red'"
        type="button"
        :aria-label="isMenuOpen ? t('sidebarMobile.actions.closeMenu') : t('sidebarMobile.actions.openMenu')"
        @click="emit(isMenuOpen ? 'close-menu' : 'open-menu')"
      >
        <img
          class="mobile-header__menu-icon h-9 w-9 transition duration-300 ease-out mobile:h-11 mobile:w-11"
          :class="[
            (showBacking || isAboutLight) && !isMenuOpen ? 'brightness-0' : '',
            isAboutLight && !isMenuOpen ? 'mobile-header__menu-icon--about' : '',
          ]"
          :src="isMenuOpen ? '/ico/cancel.svg' : '/ico/burger/burger_inactive.svg'"
          alt=""
        />
      </button>
    </div>
  </header>
</template>

<style scoped>
.mobile-header--backed .mobile-header__language-button {
  color: #000000;
}

.mobile-header__menu-icon--about:hover,
button:hover .mobile-header__menu-icon--about,
button:active .mobile-header__menu-icon--about {
  filter: brightness(0) saturate(100%) invert(24%) sepia(86%) saturate(3292%) hue-rotate(344deg) brightness(93%) contrast(96%);
}

@media (min-width: 768px) and (max-width: 1040px) {
  .mobile-header {
    gap: 32px;
  }

  .mobile-header.fixed {
    min-height: 84px;
    padding: 12px 55px;
  }

  .mobile-header__logo {
    width: 244px;
    height: auto;
    max-width: 36vw;
  }

  .mobile-header__actions {
    gap: 10px;
  }

  .mobile-header__theme-button,
  .mobile-header__menu-button,
  .mobile-header__theme-icon,
  .mobile-header__menu-icon {
    width: 44px;
    height: 44px;
  }

  .mobile-header__language-button {
    min-width: 64px;
    height: 44px;
    padding-right: 16px;
    padding-left: 16px;
    font-size: 18px;
    font-weight: 400;
  }
}
</style>
