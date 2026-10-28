import { prefetchApiQuery } from './useApiQuery'

// Warm only the destination the visitor points to or focuses with the keyboard.
export function prefetchPortfolioLink(link: string) {
  const match = /^\/portfolio\/([^/?#]+)(?:\/([^/?#]+))?\/?(?:[?#].*)?$/.exec(link)
  if (!match) return

  try {
    const panelSlug = decodeURIComponent(match[1])
    const cardSlug = match[2] ? decodeURIComponent(match[2]) : undefined
    const queryKey = cardSlug ? ['portfolio-case', panelSlug, cardSlug] : ['portfolio-detail', panelSlug]
    const path = `/api/portfolio/${encodeURIComponent(panelSlug)}${cardSlug ? `/${encodeURIComponent(cardSlug)}` : ''}`
    return prefetchApiQuery(queryKey, path)
  } catch {
    // Invalid URL encoding must not interfere with navigation.
    return
  }
}
