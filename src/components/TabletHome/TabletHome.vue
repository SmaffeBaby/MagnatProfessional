<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSidebar } from '../../composables/Sidebar/useSidebar'
import { homeNavLinks } from '../../composables/useHomeNavigation'
import { useLanguageStore } from '../../composables/useLanguageStore'
import MainText from '../MainText/MainText.vue'
import './style.css'

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
const isAboutLight = computed(() => props.isAboutActive && !isDarkTheme.value)
</script>

<template>
  <section
    class="tablet-home relative overflow-visible transition-colors duration-500"
    :class="isDarkTheme ? 'bg-[#222222]' : isAboutActive ? 'bg-white' : 'bg-magnat-red'"
  >
    <div
      v-if="!isContentPageActive"
      class="pointer-events-none absolute inset-0 z-0"
      aria-hidden="true"
    >
      <div
        class="tablet-theme-image tablet-theme-image--light"
        :class="isDarkTheme ? '' : 'tablet-theme-image--visible'"
      />
      <div
        class="tablet-theme-image tablet-theme-image--dark"
        :class="isDarkTheme ? 'tablet-theme-image--visible' : ''"
      />
    </div>

    <header
      class="relative z-10 flex items-center gap-8 px-[55px] pt-[30px] transition-colors duration-500"
      :class="isAboutLight ? 'text-black' : 'text-white'"
    >
      <a class="shrink-0" href="/" :aria-label="t('sidebar.logo')">
        <img
          class="h-auto w-[244px]"
          :src="isAboutLight ? '/ico/MagnatProfessionalLogo_color.svg' : '/ico/MagnatProfessionalLogo.svg'"
          :alt="t('sidebar.logo')"
        />
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
          :class="[
            isThemeButtonHovered ? 'opacity-0' : 'opacity-100',
            { 'brightness-0': isAboutLight },
          ]"
          :src="inactiveThemeIcon"
          alt=""
        />
        <img
          class="absolute inset-0 h-11 w-11 transition-opacity duration-300 ease-out"
          :class="[
            isThemeButtonHovered ? 'opacity-100' : 'opacity-0',
            { 'tablet-theme-icon--about-hover': isAboutLight },
          ]"
          :src="isAboutLight ? inactiveThemeIcon : activeThemeIcon"
          alt=""
        />
      </button>

      <nav class="flex min-w-0 items-center gap-2.5" :aria-label="t('desktopHome.navigationLabel')">
        <RouterLink
          v-for="navLink in homeNavLinks"
          :key="navLink.href"
          class="rounded-full border-2 px-5 py-2.5 text-lg font-normal leading-none transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:border-magnat-light active:bg-magnat-light active:text-white"
          :class="isAboutLight
            ? 'border-black text-black hover:border-magnat-light hover:bg-magnat-light hover:text-white focus-visible:ring-magnat-light focus-visible:ring-offset-white'
            : isDarkTheme
              ? 'border-white text-white hover:bg-white hover:text-black focus-visible:ring-white focus-visible:ring-offset-[#222222]'
              : 'border-white text-white hover:bg-white hover:text-magnat-red focus-visible:ring-white focus-visible:ring-offset-magnat-red'"
          :to="navLink.href"
        >
          {{ t(navLink.labelKey) }}
        </RouterLink>
      </nav>

      <button
        class="ml-auto h-11 min-w-16 shrink-0 rounded-full border-2 px-4 text-lg font-normal uppercase leading-none transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 active:border-magnat-light active:bg-magnat-light active:text-white"
        :class="isAboutLight
          ? 'border-black text-black hover:border-magnat-light hover:bg-magnat-light hover:text-white focus-visible:ring-magnat-light focus-visible:ring-offset-white'
          : isDarkTheme
            ? 'border-white text-white hover:bg-white hover:text-black focus-visible:ring-white focus-visible:ring-offset-[#222222]'
            : 'border-white text-white hover:bg-white hover:text-magnat-red focus-visible:ring-white focus-visible:ring-offset-magnat-red'"
        type="button"
        :aria-label="t('desktopHome.actions.switchLanguage')"
        @click="languageStore.toggleLocale"
      >
        {{ languageStore.nextLocaleLabel }}
      </button>
    </header>

    <MainText v-if="!isContentPageActive" :theme="theme" />
  </section>
</template>

<style scoped>
.tablet-theme-icon--about-hover {
  filter: brightness(0) saturate(100%) invert(24%) sepia(86%) saturate(3292%) hue-rotate(344deg) brightness(93%) contrast(96%);
}
</style>
