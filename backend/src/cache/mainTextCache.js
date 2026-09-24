const MAIN_TEXT_TABLE = 'main_text'
const CACHE_TTL_MS = Number(process.env.MAIN_TEXT_CACHE_TTL_MS || 5000)

let cachedPayload = null
let cachedAt = 0
let inFlightRefresh = null

export async function getMainText(supabase) {
  const now = Date.now()

  if (cachedPayload && now - cachedAt < CACHE_TTL_MS) {
    return cachedPayload
  }

  if (!inFlightRefresh) {
    inFlightRefresh = refreshMainText(supabase).finally(() => {
      inFlightRefresh = null
    })
  }

  return inFlightRefresh
}

export function clearMainTextCache() {
  cachedPayload = null
  cachedAt = 0
}

async function refreshMainText(supabase) {
  const { data: meta, error: metaError } = await supabase
    .from(MAIN_TEXT_TABLE)
    .select('updated_at')
    .eq('id', 1)
    .single()

  if (metaError) {
    throw metaError
  }

  if (cachedPayload?.updatedAt === meta.updated_at) {
    cachedAt = Date.now()
    return cachedPayload
  }

  const { data, error } = await supabase
    .from(MAIN_TEXT_TABLE)
    .select(`
      title_text_ru,
      title_text_en,
      right_text_ru,
      right_text_en,
      description_text_ru,
      description_text_en,
      button_text_ru,
      button_text_en,
      updated_at
    `)
    .eq('id', 1)
    .single()

  if (error) {
    throw error
  }

  cachedPayload = {
    updatedAt: data.updated_at,
    ru: {
      titleText: data.title_text_ru,
      rightText: data.right_text_ru,
      descriptionText: data.description_text_ru,
      buttonText: data.button_text_ru,
    },
    en: {
      titleText: data.title_text_en,
      rightText: data.right_text_en,
      descriptionText: data.description_text_en,
      buttonText: data.button_text_en,
    },
  }
  cachedAt = Date.now()

  return cachedPayload
}
