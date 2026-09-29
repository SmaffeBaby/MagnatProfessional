<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AboutContent from '../components/AboutContent/AboutContent.vue'
import AboutUs from '../components/AboutUs/AboutUs.vue'
import Description from '../components/Description/Description.vue'
import DesktopHome from '../components/DesktopHome/DesktopHome.vue'
import DottedSeparator from '../components/DottedSeparator/DottedSeparator.vue'
import Footer from '../components/Footer/Footer.vue'
import HomePanels from '../components/HomePanels/HomePanels.vue'
import Map from '../components/Map/Map.vue'
import OnTheMapPanel from '../components/OnTheMap/OnTheMapPanel.vue'
import Sidebar from '../components/Sidebar/Sidebar.vue'
import MobileHeader from '../components/Sidebar/mobile/MobileHeader.vue'
import SidebarMobile from '../components/Sidebar/mobile/SidebarMobile.vue'
import Stats from '../components/Stats/Stats.vue'
import TabletHome from '../components/TabletHome/TabletHome.vue'
import { useThemeStore } from '../composables/Sidebar/useThemeStore'
import { useResponsiveHeaderBacking } from '../composables/useResponsiveHeaderBacking'
import './home.css'

const themeStore = useThemeStore()
themeStore.preloadThemeAssets()
const route = useRoute()

const theme = computed({
  get: () => themeStore.theme,
  set: (value) => themeStore.setTheme(value),
})

const isMapOpen = ref(false)
const isAboutActive = computed(() => route.name === 'about')
const {
  inactiveThemeIcon,
  isDarkTheme,
  isHeaderBackingVisible,
  isMobileMenuOpen,
  languageStore,
  mobileSidebar,
  navLinks,
  openMobileMenu,
  t,
  toggleTheme,
} = useResponsiveHeaderBacking(theme)
</script>

<template>
  <main
    class="home-main min-h-screen text-white transition-colors duration-500"
    :class="theme === 'dark' ? 'bg-[#222222]' : isAboutActive ? 'bg-white' : 'bg-magnat-red'"
  >
    <div class="tablet:hidden desktop:hidden">
      <SidebarMobile
        ref="mobileSidebar"
        v-model:theme="theme"
        :is-about-active="isAboutActive"
        @menu-open-change="isMobileMenuOpen = $event"
        @open-map="isMapOpen = true"
      />
      <AboutContent v-if="isAboutActive" :key="route.fullPath" :theme="theme" />
      <template v-else>
        <HomePanels :theme="theme" />
        <AboutUs :theme="theme" />
        <Description :theme="theme" />
        <DottedSeparator />
        <Stats />
        <Map />
        <Footer />
      </template>
    </div>

    <div class="home-tablet-page hidden tablet:block desktop:hidden">
      <TabletHome v-model:theme="theme" :is-about-active="isAboutActive" />
      <AboutContent v-if="isAboutActive" :key="route.fullPath" :theme="theme" />
      <template v-else>
        <HomePanels :theme="theme" />
        <AboutUs :theme="theme" />
        <Description :theme="theme" />
        <DottedSeparator />
        <Stats />
        <Map />
        <Footer />
      </template>
    </div>

    <Transition name="header-backing">
      <MobileHeader
        v-if="isHeaderBackingVisible && !isMobileMenuOpen"
        class="tablet:hidden desktop:hidden"
        is-fixed
        show-backing
        :is-dark-theme="isDarkTheme"
        :is-about-light="isAboutActive && !isDarkTheme"
        @open-menu="openMobileMenu"
      />
    </Transition>

    <Transition name="header-backing">
      <header
        v-if="isHeaderBackingVisible"
        class="responsive-header-backing responsive-header-backing--tablet"
        :class="isDarkTheme ? 'responsive-header-backing--dark' : 'responsive-header-backing--light'"
      >
        <a class="responsive-header-backing__logo-link" href="/" :aria-label="t('sidebar.logo')">
          <img
            class="responsive-header-backing__logo"
            :src="isDarkTheme ? '/ico/MagnatProfessionalLogo.svg' : '/ico/MagnatProfessionalLogo_color.svg'"
            :alt="t('sidebar.logo')"
          />
        </a>

        <button
          class="responsive-header-backing__theme-button"
          type="button"
          :aria-label="isDarkTheme ? t('sidebar.actions.enableLightTheme') : t('sidebar.actions.enableDarkTheme')"
          @click="toggleTheme"
        >
          <img
            class="responsive-header-backing__theme-icon"
            :src="inactiveThemeIcon"
            alt=""
          />
        </button>

        <nav class="responsive-header-backing__nav" :aria-label="t('desktopHome.navigationLabel')">
          <RouterLink
            v-for="navLink in navLinks"
            :key="navLink.href"
            class="responsive-header-backing__nav-link"
            :to="navLink.href"
          >
            {{ t(navLink.labelKey) }}
          </RouterLink>
        </nav>

        <button
          class="responsive-header-backing__language-button"
          type="button"
          :aria-label="t('desktopHome.actions.switchLanguage')"
          @click="languageStore.toggleLocale"
        >
          {{ languageStore.nextLocaleLabel }}
        </button>
      </header>
    </Transition>

    <div class="hidden min-h-screen desktop:flex">
      <div class="desktop-sidebar-frame shrink-0">
        <Sidebar
          v-model:theme="theme"
          :is-about-active="isAboutActive"
          @open-map="isMapOpen = true"
        />
      </div>

      <DesktopHome :theme="theme" :is-about-active="isAboutActive" />
    </div>

    <OnTheMapPanel :is-open="isMapOpen" @close="isMapOpen = false" />
  </main>
</template>
