<script setup>
import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AboutContent from '../components/AboutContent/AboutContent.vue'
import AboutUs from '../components/AboutUs/AboutUs.vue'
import ContactsContent from '../components/ContactsContent/ContactsContent.vue'
import Description from '../components/Description/Description.vue'
import DesktopHome from '../components/DesktopHome/DesktopHome.vue'
import DottedSeparator from '../components/DottedSeparator/DottedSeparator.vue'
import Footer from '../components/Footer/Footer.vue'
import HomePanels from '../components/HomePanels/HomePanels.vue'
import Map from '../components/Map/Map.vue'
import OnTheMapPanel from '../components/OnTheMap/OnTheMapPanel.vue'
import PortfolioCaseContent from '../components/PortfolioCaseContent/PortfolioCaseContent.vue'
import PortfolioDetailContent from '../components/PortfolioDetailContent/PortfolioDetailContent.vue'
import PortfolioContent from '../components/PortfolioContent/PortfolioContent.vue'
import PrivacyContent from '../components/PrivacyContent/PrivacyContent.vue'
import ProjectFormDrawer from '../components/ProjectFormDrawer/ProjectFormDrawer.vue'
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
const isProjectFormOpen = ref(false)
const isAboutActive = computed(() => route.name === 'about')
const isContactsActive = computed(() => route.name === 'contacts')
const isPrivacyActive = computed(() => route.name === 'privacy')
const isPortfolioActive = computed(() => route.name === 'portfolio')
const isPortfolioDetailActive = computed(() => route.name === 'portfolio-detail')
const isPortfolioCaseActive = computed(() => route.name === 'portfolio-case')
const isPortfolioPageActive = computed(() => isPortfolioActive.value || isPortfolioDetailActive.value || isPortfolioCaseActive.value)
const isLightPageActive = computed(() => isAboutActive.value || isContactsActive.value || isPrivacyActive.value || isPortfolioCaseActive.value)
const isContentPageActive = computed(() => (
  isAboutActive.value || isContactsActive.value || isPrivacyActive.value || isPortfolioActive.value || isPortfolioDetailActive.value || isPortfolioCaseActive.value
))
const pageBackgroundColor = computed(() => {
  if (theme.value === 'dark') {
    return '#222222'
  }

  if (isLightPageActive.value) {
    return '#ffffff'
  }

  if (isPortfolioPageActive.value) {
    return '#bd0f1c'
  }

  return '#bd0e1c'
})
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

function setMobileSidebar(instance) {
  mobileSidebar.value = instance
}

function openProjectForm() {
  isProjectFormOpen.value = true
}

function closeProjectForm() {
  isProjectFormOpen.value = false
}

provide('openProjectForm', openProjectForm)

let themeColorMeta = null
let previousRootBackground = ''
let previousBodyBackground = ''
let previousThemeColor = ''

function applyPageBackground(color) {
  document.documentElement.style.backgroundColor = color
  document.body.style.backgroundColor = color

  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', color)
  }
}

onMounted(() => {
  previousRootBackground = document.documentElement.style.backgroundColor
  previousBodyBackground = document.body.style.backgroundColor
  themeColorMeta = document.querySelector('meta[name="theme-color"]')

  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta')
    themeColorMeta.setAttribute('name', 'theme-color')
    document.head.appendChild(themeColorMeta)
  }

  previousThemeColor = themeColorMeta.getAttribute('content') || ''
  applyPageBackground(pageBackgroundColor.value)
})

watch(pageBackgroundColor, (color) => {
  applyPageBackground(color)
})

onUnmounted(() => {
  document.documentElement.style.backgroundColor = previousRootBackground
  document.body.style.backgroundColor = previousBodyBackground

  if (themeColorMeta) {
    if (previousThemeColor) {
      themeColorMeta.setAttribute('content', previousThemeColor)
    }
    else {
      themeColorMeta.removeAttribute('content')
    }
  }
})
</script>

<template>
  <main
    class="home-main min-h-screen text-white transition-colors duration-500"
    :class="theme === 'dark' ? 'bg-[#222222]' : isLightPageActive ? 'bg-white' : isPortfolioPageActive ? 'bg-[#bd0f1c]' : 'bg-magnat-red'"
    :style="{ backgroundColor: pageBackgroundColor }"
  >
    <div class="home-compact-page">
      <SidebarMobile
        :ref="setMobileSidebar"
        v-model:theme="theme"
        :is-about-active="isLightPageActive"
        :is-content-page-active="isContentPageActive"
        @menu-open-change="isMobileMenuOpen = $event"
        @open-map="isMapOpen = true"
      />
      <AboutContent v-if="isAboutActive" :key="`mobile-about-${route.fullPath}`" :theme="theme" />
      <ContactsContent v-else-if="isContactsActive" :key="`mobile-contacts-${route.fullPath}`" :theme="theme" />
      <PrivacyContent v-else-if="isPrivacyActive" :key="`mobile-privacy-${route.fullPath}`" :theme="theme" />
      <PortfolioCaseContent v-else-if="isPortfolioCaseActive" :key="`mobile-portfolio-case-${route.fullPath}`" :theme="theme" />
      <PortfolioDetailContent v-else-if="isPortfolioDetailActive" :key="`mobile-portfolio-detail-${route.fullPath}`" :theme="theme" />
      <PortfolioContent v-else-if="isPortfolioActive" :key="`mobile-portfolio-${route.fullPath}`" :theme="theme" />
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

    <div class="home-wide-tablet-page">
      <TabletHome
        v-model:theme="theme"
        :is-about-active="isLightPageActive"
        :is-content-page-active="isContentPageActive"
        :is-portfolio-active="isPortfolioPageActive"
      />
      <AboutContent v-if="isAboutActive" :key="`tablet-about-${route.fullPath}`" :theme="theme" />
      <ContactsContent v-else-if="isContactsActive" :key="`tablet-contacts-${route.fullPath}`" :theme="theme" />
      <PrivacyContent v-else-if="isPrivacyActive" :key="`tablet-privacy-${route.fullPath}`" :theme="theme" />
      <PortfolioCaseContent v-else-if="isPortfolioCaseActive" :key="`tablet-portfolio-case-${route.fullPath}`" :theme="theme" />
      <PortfolioDetailContent v-else-if="isPortfolioDetailActive" :key="`tablet-portfolio-detail-${route.fullPath}`" :theme="theme" />
      <PortfolioContent v-else-if="isPortfolioActive" :key="`tablet-portfolio-${route.fullPath}`" :theme="theme" />
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
        class="home-compact-floating-header"
        is-fixed
        show-backing
        :is-dark-theme="isDarkTheme"
        :is-about-light="isLightPageActive && !isDarkTheme"
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
          :is-about-active="isLightPageActive"
          @open-map="isMapOpen = true"
        />
      </div>

      <DesktopHome
        :theme="theme"
        :is-about-active="isAboutActive"
        :is-contacts-active="isContactsActive"
        :is-privacy-active="isPrivacyActive"
        :is-portfolio-active="isPortfolioActive"
        :is-portfolio-detail-active="isPortfolioDetailActive"
        :is-portfolio-case-active="isPortfolioCaseActive"
      />
    </div>

    <OnTheMapPanel :is-open="isMapOpen" @close="isMapOpen = false" />
    <ProjectFormDrawer :open="isProjectFormOpen" @close="closeProjectForm" />
  </main>
</template>
