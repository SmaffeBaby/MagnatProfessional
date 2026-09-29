<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLanguageStore } from '../../composables/useLanguageStore'
import AboutContent from '../AboutContent/AboutContent.vue'
import ContactsContent from '../ContactsContent/ContactsContent.vue'
import HomeContent from '../HomeContent/HomeContent.vue'
import PortfolioDetailContent from '../PortfolioDetailContent/PortfolioDetailContent.vue'
import PortfolioContent from '../PortfolioContent/PortfolioContent.vue'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
  isAboutActive: {
    type: Boolean,
    default: false,
  },
  isContactsActive: {
    type: Boolean,
    default: false,
  },
  isPortfolioActive: {
    type: Boolean,
    default: false,
  },
  isPortfolioDetailActive: {
    type: Boolean,
    default: false,
  },
})

const isDarkTheme = computed(() => props.theme === 'dark')
const isLightPage = computed(() => props.isAboutActive || props.isContactsActive)
const isContentPage = computed(() => (
  props.isAboutActive || props.isContactsActive || props.isPortfolioActive || props.isPortfolioDetailActive
))
const isAboutLight = computed(() => isLightPage.value && !isDarkTheme.value)
const { t } = useI18n()
const languageStore = useLanguageStore()
const isHeaderRevealed = ref(true)
const lastContentScrollTop = ref(0)

const navLinks = [
  {
    labelKey: 'desktopHome.navigation.portfolio',
    href: '/portfolio',
  },
  {
    labelKey: 'desktopHome.navigation.about',
    href: '/about',
  },
  {
    labelKey: 'desktopHome.navigation.contacts',
    href: '/contacts',
  },
]

function handleContentScroll(event) {
  const currentScrollTop = event.currentTarget?.scrollTop ?? 0
  const scrollDelta = Math.abs(currentScrollTop - lastContentScrollTop.value)

  if (scrollDelta < 4) {
    return
  }

  isHeaderRevealed.value = currentScrollTop <= 8 || currentScrollTop < lastContentScrollTop.value
  lastContentScrollTop.value = currentScrollTop
}

watch(
  () => [props.isAboutActive, props.isContactsActive, props.isPortfolioActive, props.isPortfolioDetailActive],
  () => {
    isHeaderRevealed.value = true
    lastContentScrollTop.value = 0
  },
)
</script>

<template>
  <section
    class="desktop-home relative h-screen flex-1 overflow-hidden transition-colors duration-500"
    :class="[
      isDarkTheme ? 'bg-[#222222]' : isLightPage ? 'bg-white' : 'bg-magnat-red',
      { 'desktop-home--about-light': isAboutLight },
    ]"
  >
    <div
      class="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
      :class="isContentPage ? 'opacity-0' : 'opacity-100'"
      aria-hidden="true"
    >
      <div
        class="desktop-theme-image desktop-theme-image--light"
        :class="isDarkTheme ? '' : 'desktop-theme-image--visible'"
      />
      <div
        class="desktop-theme-image desktop-theme-image--dark"
        :class="isDarkTheme ? 'desktop-theme-image--visible' : ''"
      />
    </div>

    <header
      class="desktop-home__header relative z-10 flex items-center justify-between gap-8 px-14 py-7 transition-colors duration-500"
      :class="[
        isAboutLight ? 'text-black' : 'text-white',
        { 'desktop-home__header--hidden': !isHeaderRevealed },
      ]"
    >
      <nav class="flex items-center gap-2.5" :aria-label="t('desktopHome.navigationLabel')">
        <RouterLink
          v-for="navLink in navLinks"
          :key="navLink.href"
          class="inline-flex h-11 items-center justify-center rounded-full border-2 px-5 text-base font-normal leading-none transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:border-magnat-light active:bg-magnat-light active:text-white"
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

      <div class="flex shrink-0 items-center gap-3">
        <button
          class="h-11 w-[62px] rounded-full border-2 px-0 text-base font-semibold uppercase leading-none transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 active:border-magnat-light active:bg-magnat-light active:text-white"
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
      </div>
    </header>

    <Transition name="desktop-content" mode="out-in">
      <AboutContent
        v-if="props.isAboutActive"
        key="about-content"
        :theme="theme"
        @scroll.passive="handleContentScroll"
      />
      <ContactsContent
        v-else-if="props.isContactsActive"
        key="contacts-content"
        :theme="theme"
        @scroll.passive="handleContentScroll"
      />
      <PortfolioDetailContent
        v-else-if="props.isPortfolioDetailActive"
        key="portfolio-detail-content"
        :theme="theme"
        @scroll.passive="handleContentScroll"
      />
      <PortfolioContent
        v-else-if="props.isPortfolioActive"
        key="portfolio-content"
        :theme="theme"
        @scroll.passive="handleContentScroll"
      />
      <HomeContent
        v-else
        key="home-content"
        :theme="theme"
        @scroll.passive="handleContentScroll"
      />
    </Transition>
  </section>
</template>

<style scoped>
.desktop-home {
  isolation: isolate;
}

.desktop-home--about-light {
  background: #ffffff;
}

.desktop-home__header {
  min-height: 100px;
  transform: translateY(0);
  transition:
    color 500ms ease,
    opacity 320ms ease,
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform, opacity;
}

.desktop-home__header--hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateY(-112%);
}

.desktop-content-enter-active,
.desktop-content-leave-active {
  transition: opacity 260ms ease;
}

.desktop-content-enter-from,
.desktop-content-leave-to {
  opacity: 0;
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
  .desktop-theme-image,
  .desktop-home__header,
  .desktop-content-enter-active,
  .desktop-content-leave-active {
    transition: none;
  }
}
</style>
