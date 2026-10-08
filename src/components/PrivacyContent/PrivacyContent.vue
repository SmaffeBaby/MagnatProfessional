<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Footer from '../Footer/Footer.vue'
import { useLegalDocument, type LegalDocumentKey, type PrivacyBlock } from '../../composables/usePrivacy'
import './style.css'

const props = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
  documentKey: {
    type: String as () => LegalDocumentKey,
    default: 'privacy',
  },
})

const closedBlockIds = ref<Set<string>>(new Set())
const activeDocumentKey = computed(() => props.documentKey)
const { localizedBlocks, localizedTitle, isLoading, error } = useLegalDocument(activeDocumentKey)
const isDarkTheme = computed(() => props.theme === 'dark')

watch(
  localizedBlocks,
  (blocks) => {
    const visibleIds = new Set(blocks.map((block) => block.id))
    closedBlockIds.value = new Set([...closedBlockIds.value].filter((id) => visibleIds.has(id)))
  },
  { immediate: true },
)

function isOpen(block: PrivacyBlock) {
  return !closedBlockIds.value.has(block.id)
}

function toggleBlock(block: PrivacyBlock) {
  const nextClosedIds = new Set(closedBlockIds.value)

  if (nextClosedIds.has(block.id)) {
    nextClosedIds.delete(block.id)
  } else {
    nextClosedIds.add(block.id)
  }

  closedBlockIds.value = nextClosedIds
}
</script>

<template>
  <div
    class="privacy-content"
    :class="{ 'privacy-content--dark': isDarkTheme }"
  >
    <div class="privacy-content__inner">
      <h1 class="privacy-content__page-title">{{ localizedTitle }}</h1>

      <p v-if="isLoading" class="privacy-content__state">Загружаем данные...</p>
      <p v-else-if="error" class="privacy-content__state privacy-content__state--error">
        Не удалось загрузить политику.
      </p>

      <div v-else class="privacy-content__blocks">
        <section
          v-for="block in localizedBlocks"
          :key="block.id"
          class="privacy-content__block"
          :class="{ 'privacy-content__block--collapsed': !isOpen(block) }"
        >
          <button
            class="privacy-content__block-title"
            type="button"
            :aria-expanded="isOpen(block)"
            :aria-controls="`privacy-block-${block.id}`"
            @click="toggleBlock(block)"
          >
            <span>{{ block.localizedTitle }}</span>
          </button>

          <div
            :id="`privacy-block-${block.id}`"
            class="privacy-content__block-body"
            :aria-hidden="!isOpen(block)"
          >
            <div class="privacy-content__block-body-inner">
              <p v-if="block.localizedText" class="privacy-content__text">
                {{ block.localizedText }}
              </p>

              <div
                v-if="block.type === 'table' && block.localizedTableRows.length"
                class="privacy-content__table-scroll"
              >
                <table class="privacy-content__table">
                  <tbody>
                    <tr v-for="(row, index) in block.localizedTableRows" :key="index">
                      <td>{{ row.left }}</td>
                      <td>{{ row.right }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <Footer />
  </div>
</template>
