import { computed, reactive, ref } from 'vue'
import { adminRequest } from '../useAdminApi'
import type { PrivacyBlock, PrivacyTableRow } from '../usePrivacy'

export type PrivacyBlockForm = {
  id: string | null
  type: 'text' | 'table'
  sortOrder: number
  title: string
  titleEn: string
  text: string
  textEn: string
  tableRows: PrivacyTableRow[]
  tableRowsEn: PrivacyTableRow[]
}

function emptyRow(): PrivacyTableRow {
  return {
    left: '',
    right: '',
  }
}

function emptyForm(): PrivacyBlockForm {
  return {
    id: null,
    type: 'text',
    sortOrder: 0,
    title: '',
    titleEn: '',
    text: '',
    textEn: '',
    tableRows: [emptyRow()],
    tableRowsEn: [emptyRow()],
  }
}

function cloneRows(rows: PrivacyTableRow[] = []) {
  const clonedRows = rows.map((row) => ({
    left: row.left || '',
    right: row.right || '',
  }))

  return clonedRows.length ? clonedRows : [emptyRow()]
}

export function useAdminPrivacy() {
  const form = reactive<PrivacyBlockForm>(emptyForm())
  const blocks = ref<PrivacyBlock[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')

  const formTitle = computed(() => form.id ? 'Редактирование блока' : 'Новый блок')

  async function loadBlocks() {
    isLoading.value = true
    error.value = ''

    try {
      const payload = await adminRequest('/api/admin/privacy')
      blocks.value = payload.blocks
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  async function saveBlock() {
    isSaving.value = true
    error.value = ''

    try {
      const path = form.id ? `/api/admin/privacy/${form.id}` : '/api/admin/privacy'
      const method = form.id ? 'PUT' : 'POST'

      await adminRequest(path, {
        method,
        body: JSON.stringify(form),
      })

      resetForm()
      await loadBlocks()
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isSaving.value = false
    }
  }

  async function deleteBlock(block: PrivacyBlock) {
    if (!window.confirm(`Удалить блок «${block.title}»?`)) {
      return
    }

    isLoading.value = true
    error.value = ''

    try {
      await adminRequest(`/api/admin/privacy/${block.id}`, {
        method: 'DELETE',
      })
      await loadBlocks()
      if (form.id === block.id) {
        resetForm()
      }
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  function editBlock(block: PrivacyBlock) {
    Object.assign(form, {
      id: block.id,
      type: block.type,
      sortOrder: block.sortOrder,
      title: block.title,
      titleEn: block.titleEn || '',
      text: block.text,
      textEn: block.textEn || '',
      tableRows: cloneRows(block.tableRows),
      tableRowsEn: cloneRows(block.tableRowsEn),
    })
  }

  function addTableRow(language: 'ru' | 'en') {
    const rows = language === 'en' ? form.tableRowsEn : form.tableRows
    rows.push(emptyRow())
  }

  function removeTableRow(language: 'ru' | 'en', index: number) {
    const rows = language === 'en' ? form.tableRowsEn : form.tableRows
    rows.splice(index, 1)

    if (!rows.length) {
      rows.push(emptyRow())
    }
  }

  function resetForm() {
    Object.assign(form, emptyForm())
  }

  function clearBlocks() {
    blocks.value = []
    resetForm()
  }

  return {
    form,
    blocks,
    isLoading,
    isSaving,
    error,
    formTitle,
    loadBlocks,
    saveBlock,
    deleteBlock,
    editBlock,
    addTableRow,
    removeTableRow,
    resetForm,
    clearBlocks,
  }
}
