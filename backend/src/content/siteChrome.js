import { defaultSiteChrome, SITE_CHROME_SECTIONS, validateSiteChrome } from './siteChromeConfig.js'

export function createSiteChromeHandlers(client) {
  async function readSections() {
    const { data, error } = await client.from('site_chrome_content').select('section,content,updated_at')
    if (error) throw error
    const sections = Object.fromEntries(SITE_CHROME_SECTIONS.map(key => [key, defaultSiteChrome(key)]))
    for (const row of data) if (SITE_CHROME_SECTIONS.includes(row.section)) sections[row.section] = validateSiteChrome(row.section, row.content)
    return sections
  }
  function sectionFrom(req) {
    if (!SITE_CHROME_SECTIONS.includes(req.params.section)) throw Object.assign(new Error('Раздел не найден'), { status: 404 })
    return req.params.section
  }
  return {
    publicGet: async (_req, res, next) => {
      try { res.set('Cache-Control', 'no-cache').json({ content: await readSections() }) } catch (error) { next(error) }
    },
    adminGet: async (req, res, next) => {
      try { const section = sectionFrom(req); res.set('Cache-Control', 'no-store').json({ content: (await readSections())[section] }) } catch (error) { next(error) }
    },
    adminPut: async (req, res, next) => {
      try {
        const section = sectionFrom(req)
        const content = validateSiteChrome(section, req.body)
        const { error } = await client.from('site_chrome_content').upsert({ section, content, updated_at: new Date().toISOString() }, { onConflict: 'section' })
        if (error) throw error
        res.set('Cache-Control', 'no-store').json({ content })
      } catch (error) { next(error) }
    },
  }
}
