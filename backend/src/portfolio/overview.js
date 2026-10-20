// Read all metadata even when PostgREST caps each response's row count.
async function readMetadata(client, table, fields) {
  const rows = []
  const pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.from(table).select(fields)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < pageSize) return rows
  }
}

export function createPortfolioOverviewHandler(client, isExternalCategory) {
  return async (_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    try {
      const [panels, cards] = await Promise.all([
        readMetadata(client, 'home_panels', 'id,title,title_en,slug'),
        readMetadata(client, 'portfolio_cards', 'id,panel_id,title,title_en'),
      ])
      const cardsByPanel = new Map()
      for (const card of cards) {
        if (!cardsByPanel.has(card.panel_id)) cardsByPanel.set(card.panel_id, [])
        cardsByPanel.get(card.panel_id).push({ id: card.id, title: card.title, titleEn: card.title_en || '' })
      }
      res.json({ categories: panels.filter(panel => !isExternalCategory(panel)).map(panel => ({
        id: panel.id, title: panel.title, cases: cardsByPanel.get(panel.id) || [],
      })) })
    } catch (error) {
      next(error)
    }
  }
}
