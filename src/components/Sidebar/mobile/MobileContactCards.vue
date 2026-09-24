<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const emit = defineEmits(['open-map'])
</script>

<template>
  <div class="-mx-5 mt-[110px] space-y-0 text-black">
    <section class="mobile-menu-card mb-[1px] rounded-[32px] bg-white px-5 pb-9 pt-11">
      <h2 class="max-w-[430px] text-[clamp(1.45rem,6.4vw,1.9rem)] font-normal leading-[1.18] tracking-normal">
        {{ t('sidebarMobile.contacts.officeText') }}
      </h2>

      <button
        class="mt-8 inline-flex rounded-full border-2 border-magnat-light px-6 py-3 text-[1.08rem] font-normal leading-none text-magnat-light transition duration-300 ease-out hover:bg-magnat-light hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-magnat-light focus-visible:ring-offset-2"
        type="button"
        @click="emit('open-map')"
      >
        {{ t('sidebarMobile.contacts.map') }}
      </button>
    </section>

    <section class="mobile-menu-card rounded-[32px] bg-white px-5 pb-8 pt-9">
      <a class="block whitespace-nowrap text-[clamp(1.62rem,7vw,2.15rem)] font-normal leading-none tracking-normal" href="tel:+78123404478">+7 (812) 340-44-78</a>
      <a class="mt-3 block break-words text-[clamp(0.98rem,4.1vw,1.18rem)] font-normal uppercase leading-tight text-magnat-light" href="mailto:office@magnatmedia.com">office@magnatmedia.com</a>
    </section>
  </div>
</template>
