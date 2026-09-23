<script setup>
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
</script>

<template>
  <header class="relative z-10 flex items-start justify-between gap-5">
    <a href="/public" aria-label="Magnat Professional" @click="isMenuOpen && emit('close-menu')">
      <img class="h-auto w-[160px] max-w-[68vw]" src="/ico/MagnatProfessionalLogo.svg" alt="Magnat Professional" />
    </a>

    <div class="flex shrink-0 items-center gap-3.5">
      <button
        class="relative h-11 w-11 transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95"
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

      <button
        class="grid h-11 w-11 place-items-center rounded-full transition duration-300 ease-out hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95"
        :class="isDarkTheme ? 'focus-visible:ring-offset-[#222222]' : 'focus-visible:ring-offset-magnat-red'"
        type="button"
        :aria-label="isMenuOpen ? 'Закрыть меню' : 'Открыть меню'"
        @click="emit(isMenuOpen ? 'close-menu' : 'open-menu')"
      >
        <img
          class="h-11 w-11"
          :src="isMenuOpen ? '/ico/cancel.svg' : '/ico/burger/burger_inactive.svg'"
          alt=""
        />
      </button>
    </div>
  </header>
</template>
