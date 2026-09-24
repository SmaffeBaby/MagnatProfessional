<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLanguageStore } from '../../composables/useLanguageStore'
import SwipeContentMain from '../SwipeContentMain/SwipeContentMain.vue'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const isDarkTheme = computed(() => props.theme === 'dark')
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
    class="desktop-home relative h-screen flex-1 overflow-hidden transition-colors duration-500"
    :class="isDarkTheme ? 'bg-[#222222]' : 'bg-magnat-red'"
  >
    <div class="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      <div
        class="desktop-theme-image desktop-theme-image--light"
        :class="isDarkTheme ? '' : 'desktop-theme-image--visible'"
      />
      <div
        class="desktop-theme-image desktop-theme-image--dark"
        :class="isDarkTheme ? 'desktop-theme-image--visible' : ''"
      />
    </div>

    <header class="desktop-home__header relative z-10 flex items-center justify-between gap-8 px-14 py-7 text-white">
      <nav class="flex items-center gap-2.5" :aria-label="t('desktopHome.navigationLabel')">
        <a
          v-for="navLink in navLinks"
          :key="navLink.href"
          class="inline-flex h-11 items-center justify-center rounded-full border-2 border-white px-5 text-base font-normal leading-none text-white transition duration-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          :class="isDarkTheme ? 'hover:text-black focus-visible:ring-offset-[#222222]' : 'hover:text-magnat-red focus-visible:ring-offset-magnat-red'"
          :href="navLink.href"
        >
          {{ t(navLink.labelKey) }}
        </a>
      </nav>

      <div class="flex shrink-0 items-center gap-3">
        <button
          class="h-11 w-[62px] rounded-full border-2 border-white px-0 text-base font-semibold uppercase leading-none text-white transition duration-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95"
          :class="isDarkTheme ? 'hover:text-black focus-visible:ring-offset-[#222222]' : 'hover:text-magnat-red focus-visible:ring-offset-magnat-red'"
          type="button"
          :aria-label="t('desktopHome.actions.switchLanguage')"
          @click="languageStore.toggleLocale"
        >
          {{ languageStore.nextLocaleLabel }}
        </button>
      </div>
    </header>

    <SwipeContentMain :theme="theme" />
  </section>
</template>

<style scoped>
.desktop-home {
  isolation: isolate;
}

.desktop-home__header {
  min-height: 100px;
}

.desktop-theme-image {
  position: absolute;
  inset: 0;
  background-position: clamp(22rem, 33vw, 45rem) -38.5rem;
  background-repeat: no-repeat;
  background-size: clamp(58rem, 82vw, 85rem) auto;
  opacity: 0;
  transform: translateZ(0);
  transition: opacity 500ms ease-out;
  will-change: opacity;
}

.desktop-theme-image--light {
  background-image: url('/main_page/TringleLogo_mobile.png');
}

.desktop-theme-image--dark {
  background-image: url('/main_page/TringleLogoBlack_mobile.png');
}

.desktop-theme-image--visible {
  opacity: 0.62;
}

@media (max-width: 1023px) {
  .desktop-theme-image {
    background-position: 15rem -14rem;
    background-size: 70rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .desktop-theme-image {
    transition: none;
  }
}
</style>
