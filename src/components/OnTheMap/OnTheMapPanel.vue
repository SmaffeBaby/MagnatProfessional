<script setup>
import { onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import YandexMapWidget from './YandexMapWidget.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])
const { t } = useI18n()

watch(
  () => props.isOpen,
  (isOpen) => {
    if (typeof document === 'undefined') {
      return
    }

    document.body.classList.toggle('overflow-hidden', isOpen)
  },
)

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('overflow-hidden')
  }
})
</script>

<template>
  <Transition name="on-the-map-backdrop">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[700] bg-black/20 desktop:bg-black/10"
      aria-hidden="true"
      @click="emit('close')"
    />
  </Transition>

  <Transition name="on-the-map-panel">
    <aside
      v-if="isOpen"
      class="on-the-map-panel fixed inset-0 z-[710] flex flex-col overflow-y-auto bg-white text-black shadow-2xl desktop:left-auto desktop:w-1/2"
      role="dialog"
      aria-modal="true"
      :aria-label="t('onTheMap.title')"
    >
      <header class="relative shrink-0 px-5 pb-5 pt-5 desktop:px-[60px] desktop:pb-[74px] desktop:pt-[60px]">
        <button
          class="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border-2 border-black p-2 text-black transition duration-300 hover:bg-black hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 desktop:right-[60px] desktop:top-[60px]"
          type="button"
          :aria-label="t('onTheMap.actions.close')"
          @click="emit('close')"
        >
          <svg class="h-full w-full" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6 6 18"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
            />
          </svg>
        </button>

        <address class="not-italic">
          <h2 class="max-w-[780px] pr-[54px] text-2xl font-medium leading-[1.05] tracking-normal desktop:pr-[72px] desktop:text-4xl">
            {{ t('onTheMap.address') }}
          </h2>

          <a
            class="mt-10 block text-lg font-medium leading-none text-[#df1f2d] desktop:mt-[30px] desktop:text-2xl"
            href="tel:+78123404478"
          >
            +7 (812) 340-44-78
          </a>
          <a
            class="mt-5 block break-words text-lg font-medium leading-tight text-black desktop:text-2xl"
            href="mailto:office@magnatmedia.com"
          >
            office@magnatmedia.com
          </a>
        </address>
      </header>

      <div class="min-h-[58vh] flex-1 desktop:min-h-0">
        <YandexMapWidget :title="t('onTheMap.mapTitle')" />
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.on-the-map-backdrop-enter-active,
.on-the-map-backdrop-leave-active {
  transition: opacity 360ms ease;
}

.on-the-map-backdrop-enter-from,
.on-the-map-backdrop-leave-to {
  opacity: 0;
}

.on-the-map-panel-enter-active,
.on-the-map-panel-leave-active {
  transition: transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

.on-the-map-panel-enter-from,
.on-the-map-panel-leave-to {
  transform: translateX(100%);
}

@media (max-width: 767px) {
  .on-the-map-panel-enter-active,
  .on-the-map-panel-leave-active {
    transition-duration: 420ms;
  }
}

@media (prefers-reduced-motion: reduce) {
  .on-the-map-backdrop-enter-active,
  .on-the-map-backdrop-leave-active,
  .on-the-map-panel-enter-active,
  .on-the-map-panel-leave-active {
    transition: none;
  }
}
</style>
