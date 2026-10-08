<script setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { useSidebar } from '../../composables/Sidebar/useSidebar'
import { isExternalLink, useHomePanels } from '../../composables/useHomePanels'
import { useLanguageStore } from '../../composables/useLanguageStore'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
  isAboutActive: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:theme', 'open-map'])

const {
  activeThemeIcon,
  inactiveThemeIcon,
  isDarkTheme,
  isThemeButtonHovered,
  toggleTheme,
} = useSidebar(props, emit)

const { t } = useI18n()
const { panels } = useHomePanels()
const languageStore = useLanguageStore()
const { locale } = storeToRefs(languageStore)
const isAboutLight = computed(() => props.isAboutActive && !isDarkTheme.value)

function panelTitle(panel) {
  return locale.value === 'en' && panel.titleEn ? panel.titleEn : panel.title
}
</script>

<template>
  <aside
    class="desktop-sidebar flex min-h-screen w-full max-w-[504px] flex-col border-r px-8 py-7 transition-colors duration-500"
    :class="isAboutLight ? 'border-[#d8d8d8] bg-white text-black' : isDarkTheme ? 'border-white/15 bg-[#222222] text-white' : 'border-white/15 bg-magnat-red text-white'"
  >
    <header class="desktop-sidebar__header flex items-start justify-between gap-5">
      <RouterLink to="/" :aria-label="t('sidebar.logo')">
        <img
          class="desktop-sidebar__logo h-auto w-[216px]"
          :src="isAboutLight ? '/ico/MagnatProfessionalLogo_color.svg' : '/ico/MagnatProfessionalLogo.svg'"
          :alt="t('sidebar.logo')"
        />
      </RouterLink>

      <button
        class="desktop-sidebar__theme-button relative h-11 w-11 shrink-0 transition-transform duration-300 ease-out hover:scale-[1.03]"
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
            { 'sidebar-theme-icon--about-hover': isAboutLight },
          ]"
          :src="isAboutLight ? inactiveThemeIcon : activeThemeIcon"
          alt=""
        />
      </button>
    </header>

    <nav
      class="desktop-sidebar__services mt-11 flex flex-wrap gap-x-2.5 gap-y-2.5 text-base font-normal leading-tight"
      :class="isAboutLight ? 'text-black/45' : 'text-white/45'"
      :aria-label="t('sidebar.servicesLabel')"
    >
      <component
        :is="isExternalLink(panel.linkPath) ? 'a' : RouterLink"
        v-for="panel in panels"
        :key="panel.id"
        class="transition"
        :class="isAboutLight ? 'hover:text-black' : 'hover:text-white'"
        :to="isExternalLink(panel.linkPath) ? undefined : panel.linkPath || '/portfolio'"
        :href="isExternalLink(panel.linkPath) ? panel.linkPath : undefined"
        :target="isExternalLink(panel.linkPath) ? '_blank' : undefined"
        :rel="isExternalLink(panel.linkPath) ? 'noopener noreferrer' : undefined"
      >
        {{ panelTitle(panel) }}
      </component>
    </nav>

    <div class="desktop-sidebar__contacts mt-auto space-y-0 pt-8">
      <section
        class="desktop-sidebar__contact-card mb-[1px] rounded-[28px] p-7 text-black transition-colors duration-500"
        :class="isAboutLight ? 'bg-[#f1f1f6]' : 'bg-white'"
      >
        <h2 class="desktop-sidebar__office-text text-[1.38rem] font-normal leading-[1.18] tracking-normal">
          {{ t('sidebar.contacts.officeText') }}
        </h2>

        <button
          class="desktop-sidebar__map-button mt-6 inline-flex rounded-full border-2 border-magnat-light px-5 py-2.5 text-sm font-normal text-magnat-light transition hover:bg-magnat-light hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-magnat-light focus-visible:ring-offset-2"
          type="button"
          @click="emit('open-map')"
        >
          {{ t('sidebar.contacts.map') }}
        </button>
      </section>

      <section
        class="desktop-sidebar__contact-card rounded-[28px] p-7 text-black transition-colors duration-500"
        :class="isAboutLight ? 'bg-[#f1f1f6]' : 'bg-white'"
      >
        <a class="desktop-sidebar__phone block text-[1.45rem] font-normal leading-none" href="tel:+78123404478">+7 (812) 340-44-78</a>
        <a class="desktop-sidebar__email mt-2 block text-sm font-normal uppercase text-magnat-light" href="mailto:office@magnatmedia.com">office@magnatmedia.com</a>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-theme-icon--about-hover {
  filter: brightness(0) saturate(100%) invert(24%) sepia(86%) saturate(3292%) hue-rotate(344deg) brightness(93%) contrast(96%);
}

@media (min-width: 1800px) {
  .desktop-sidebar {
    max-width: 560px;
    padding: clamp(28px, calc(2.7vw - 20.6px), 40px) clamp(32px, calc(3.4vw - 29.2px), 48px);
  }

  .desktop-sidebar__logo {
    width: clamp(216px, calc(6.4vw + 100.8px), 244px);
  }

  .desktop-sidebar__theme-button,
  .desktop-sidebar__theme-button img {
    width: clamp(44px, calc(1.8vw + 11.6px), 52px);
    height: clamp(44px, calc(1.8vw + 11.6px), 52px);
  }

  .desktop-sidebar__services {
    margin-top: clamp(44px, calc(4vw - 28px), 60px);
    column-gap: clamp(10px, calc(1vw - 8px), 14px);
    row-gap: clamp(10px, calc(1vw - 8px), 14px);
    font-size: clamp(16px, calc(0.7vw + 3.4px), 19px);
  }

  .desktop-sidebar__contacts {
    padding-top: clamp(32px, calc(3vw - 22px), 44px);
  }

  .desktop-sidebar__contact-card {
    border-radius: clamp(28px, calc(1.8vw - 4.4px), 36px);
    padding: clamp(28px, calc(2.7vw - 20.6px), 40px);
  }

  .desktop-sidebar__office-text {
    font-size: clamp(1.38rem, calc(1vw + 0.255rem), 1.62rem);
  }

  .desktop-sidebar__map-button {
    margin-top: clamp(24px, calc(2vw - 12px), 32px);
    padding: clamp(10px, calc(0.9vw - 6.2px), 14px) clamp(20px, calc(2vw - 16px), 28px);
    font-size: clamp(14px, calc(0.55vw + 4.1px), 16px);
  }

  .desktop-sidebar__phone {
    font-size: clamp(1.45rem, calc(1.1vw + 0.213rem), 1.72rem);
  }

  .desktop-sidebar__email {
    margin-top: clamp(8px, calc(0.7vw - 4.6px), 11px);
    font-size: clamp(14px, calc(0.55vw + 4.1px), 16px);
  }
}
</style>
