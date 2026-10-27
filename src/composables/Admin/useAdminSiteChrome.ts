import { onUnmounted, reactive, ref, watch, type Ref } from 'vue'
import { adminRequest } from '../useAdminApi'
import { queryClient } from '../../queryClient'
import { defaultSiteChrome } from '../../../backend/src/content/siteChromeConfig.js'
import type { ChromeSection, SiteChromeContent } from '../../types/siteChrome'
import type { HomePanel } from '../useHomePanels'

export function useAdminSiteChrome(section: Ref<ChromeSection>) {
  const form = reactive<SiteChromeContent>({ header: defaultSiteChrome('header'), sidebar: defaultSiteChrome('sidebar'), footer: defaultSiteChrome('footer'), cookie: defaultSiteChrome('cookie') })
  const panels = ref<HomePanel[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const loaded = ref(false)
  const error = ref('')
  const notice = ref('')
  let requestId = 0
  let snapshot = ''
  onUnmounted(() => { requestId++ })
  async function load() {
    const id = ++requestId
    const current = section.value
    loaded.value = false
    isLoading.value = true
    error.value = ''
    notice.value = ''
    try {
      const [payload, panelPayload] = await Promise.all([
        adminRequest(`/api/admin/site-chrome/${current}`),
        current === 'sidebar' ? adminRequest('/api/admin/home-panels') : Promise.resolve(null),
      ])
      if (id !== requestId) return
      Object.assign(form[current], payload.content)
      if (panelPayload) {
        panels.value = panelPayload.panels
        for (const panel of panels.value) if (!form.sidebar.serviceOverrides.some(item => item.id === panel.id)) {
          form.sidebar.serviceOverrides.push({ id: panel.id, label: '', labelEn: '' })
        }
      }
      snapshot = JSON.stringify(form[current])
      loaded.value = true
    } catch (requestError) {
      if (id === requestId) error.value = (requestError as Error).message
    } finally {
      if (id === requestId) isLoading.value = false
    }
  }
  async function save() {
    if (!loaded.value || isSaving.value) return
    const current = section.value
    const id = requestId
    isSaving.value = true
    error.value = ''
    notice.value = ''
    try {
      const payload = await adminRequest(`/api/admin/site-chrome/${current}`, { method: 'PUT', body: JSON.stringify(form[current]) })
      queryClient.setQueryData<{ content: SiteChromeContent }>(['site-chrome'], cached => ({ content: {
        cookie: cached?.content.cookie || defaultSiteChrome('cookie'),
        header: cached?.content.header || defaultSiteChrome('header'),
        sidebar: cached?.content.sidebar || defaultSiteChrome('sidebar'),
        footer: cached?.content.footer || defaultSiteChrome('footer'),
        [current]: payload.content,
      } }))
      if (id !== requestId) return
      Object.assign(form[current], payload.content)
      snapshot = JSON.stringify(form[current])
      notice.value = 'Изменения сохранены'
    } catch (requestError) {
      if (id === requestId) error.value = (requestError as Error).message
    } finally { isSaving.value = false }
  }
  function discard() {
    if (loaded.value && snapshot) Object.assign(form[section.value], JSON.parse(snapshot))
    notice.value = ''
  }
  watch(section, load, { immediate: true })
  return { form, panels, isLoading, isSaving, loaded, error, notice, load, save, discard }
}
