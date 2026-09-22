<script setup>
import { useSidebar } from '../composables/useSidebar'

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
  serviceLinks,
  themeLabel,
  toggleTheme,
} = useSidebar(props, emit)
</script>

<template>
  <aside
    class="flex min-h-screen w-full max-w-[504px] flex-col border-r border-white/15 px-8 py-7 transition-colors duration-500"
    :class="isDarkTheme ? 'bg-[#222222]' : 'bg-magnat-red'"
  >
    <header class="flex items-start justify-between gap-5">
      <a href="/" aria-label="Magnat Professional">
        <img class="h-auto w-[216px]" src="/ico/MagnatProfessionalLogo.svg" alt="Magnat Professional" />
      </a>

      <button
        class="relative h-11 w-11 shrink-0 transition-transform duration-300 ease-out hover:scale-[1.03]"
        type="button"
        :aria-label="themeLabel"
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
    </header>

    <nav class="mt-11 flex flex-wrap gap-x-4 gap-y-3 text-[0.95rem] font-semibold leading-tight text-white/45" aria-label="Услуги">
      <a
        v-for="serviceLink in serviceLinks"
        :key="serviceLink"
        class="transition hover:text-white"
        href="#"
      >
        {{ serviceLink }}
      </a>
    </nav>

    <div class="mt-auto space-y-0 pt-8">
      <section class="mb-[1px] rounded-[28px] bg-white p-7 text-black">
        <h2 class="text-[1.38rem] font-semibold leading-[1.18] tracking-normal">
          Мы располагаемся на Васильевском острове и будем рады видеть вас в нашем офисе
        </h2>

        <a class="mt-6 inline-flex rounded-full border-2 border-magnat-light px-5 py-2.5 text-sm font-semibold text-magnat-light transition hover:bg-magnat-light hover:text-white" href="#">
          На карте
        </a>
      </section>

      <section class="rounded-[28px] bg-white p-7 text-black">
        <a class="block text-[1.45rem] font-black leading-none" href="tel:+78123404478">+7 (812) 340-44-78</a>
        <a class="mt-2 block text-sm font-semibold uppercase text-magnat-light" href="mailto:office@magnatmedia.com">office@magnatmedia.com</a>
      </section>
    </div>
  </aside>
</template>
