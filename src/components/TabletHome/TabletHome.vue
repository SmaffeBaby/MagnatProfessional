<script setup>
import { useI18n } from 'vue-i18n'
import { useSidebar } from '../../composables/Sidebar/useSidebar'
import { useLanguageStore } from '../../composables/useLanguageStore'
import MainText from '../MainText/MainText.vue'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const emit = defineEmits(['update:theme'])

const {
  activeThemeIcon,
  inactiveThemeIcon,
  isDarkTheme,
  isThemeButtonHovered,
  toggleTheme,
} = useSidebar(props, emit)

const { t } = useI18n()
const languageStore = useLanguageStore()

const navLinks = [
  {
    labelKey: 'desktopHome.navigation.portfolio',
    href: '#portfolio',
  },
  {
    labelKey: 'desktopHome.navigation.about',
    href: '#about',
  },
  {
    labelKey: 'desktopHome.navigation.contacts',
    href: '#contacts',
  },
]
</script>

<template>
  <section
    class="tablet-home relative min-h-screen overflow-hidden transition-colors duration-500"
    :class="isDarkTheme ? 'bg-[#222222]' : 'bg-magnat-red'"
  >
    <div class="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      <div
        class="tablet-theme-image tablet-theme-image--light"
        :class="isDarkTheme ? '' : 'tablet-theme-image--visible'"
      />
      <div
        class="tablet-theme-image tablet-theme-image--dark"
        :class="isDarkTheme ? 'tablet-theme-image--visible' : ''"
      />
    </div>

    <header class="relative z-10 flex items-center gap-8 px-[55px] pt-[30px] text-white">
      <a class="shrink-0" href="/public" :aria-label="t('sidebar.logo')">
        <img class="h-auto w-[244px]" src="/ico/MagnatProfessionalLogo.svg" :alt="t('sidebar.logo')" />
      </a>

      <button
        class="relative h-11 w-11 shrink-0 transition duration-300 ease-out hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95"
        :class="isDarkTheme ? 'focus-visible:ring-offset-[#222222]' : 'focus-visible:ring-offset-magnat-red'"
        type="button"
        :aria-label="isDarkTheme ? t('sidebar.actions.enableLightTheme') : t('sidebar.actions.enableDarkTheme')"
        @click="toggleTheme"
        @mouseenter="isThemeButtonHovered = true"
        @mouseleave="isThemeButtonHovered = false"
      >
        <img
          class="absolute inset-0 h-11 w-11 transition-opacity duration-300 ease-out"
          :class="isThemeButtonHovered ? 'opacity-0' : 'opacity-100'"
          :src="inactiveThemeIcon"
          alt=""
        />
        <img
          class="absolute inset-0 h-11 w-11 transition-opacity duration-300 ease-out"
          :class="isThemeButtonHovered ? 'opacity-100' : 'opacity-0'"
          :src="activeThemeIcon"
          alt=""
        />
      </button>

      <nav class="flex min-w-0 items-center gap-2.5" :aria-label="t('desktopHome.navigationLabel')">
        <a
          v-for="navLink in navLinks"
          :key="navLink.href"
          class="rounded-full border-2 border-white px-5 py-2.5 text-lg font-normal leading-none text-white transition duration-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          :class="isDarkTheme ? 'hover:text-black focus-visible:ring-offset-[#222222]' : 'hover:text-magnat-red focus-visible:ring-offset-magnat-red'"
          :href="navLink.href"
        >
          {{ t(navLink.labelKey) }}
        </a>
      </nav>

      <button
        class="ml-auto h-11 min-w-16 shrink-0 rounded-full border-2 border-white px-4 text-lg font-normal uppercase leading-none text-white transition duration-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95"
        :class="isDarkTheme ? 'hover:text-black focus-visible:ring-offset-[#222222]' : 'hover:text-magnat-red focus-visible:ring-offset-magnat-red'"
        type="button"
        :aria-label="t('desktopHome.actions.switchLanguage')"
        @click="languageStore.toggleLocale"
      >
        {{ languageStore.nextLocaleLabel }}
      </button>
    </header>

    <MainText :theme="theme" />
  </section>
</template>

<style scoped>
.tablet-home {
  isolation: isolate;
}

.tablet-theme-image {
  position: absolute;
  inset: 0;
  background-position: clamp(18rem, 38vw, 34rem) -19rem;
  background-repeat: no-repeat;
  background-size: clamp(72rem, 124vw, 92rem) auto;
  opacity: 0;
  transform: translateZ(0);
  transition: opacity 500ms ease-out;
  will-change: opacity;
}

.tablet-theme-image--light {
  background-image: url('/main_page/TringleLogo_mobile.png');
}

.tablet-theme-image--dark {
  background-image: url('/main_page/TringleLogoBlack_mobile.png');
}

.tablet-theme-image--visible {
  opacity: 0.62;
}

@media (prefers-reduced-motion: reduce) {
  .tablet-theme-image {
    transition: none;
  }
}
</style>
