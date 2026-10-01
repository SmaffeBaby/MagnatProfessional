<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import QuestionsForm from '../QuestionsForm/QuestionsForm.vue'
import './style.css'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

function close() {
  emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (typeof document === 'undefined') {
      return
    }

    document.body.classList.toggle('project-form-drawer-open', isOpen)

    if (isOpen) {
      window.addEventListener('keydown', handleKeydown)
      return
    }

    window.removeEventListener('keydown', handleKeydown)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('project-form-drawer-open')
  }

  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="project-form-drawer">
      <div
        v-if="open"
        class="project-form-drawer"
        role="dialog"
        aria-modal="true"
        :aria-label="t('questionsForm.project.title')"
        @click.self="close"
      >
        <div class="project-form-drawer__panel">
          <QuestionsForm variant="project" closable @close="close" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
