import type { PortfolioArticleImage, PortfolioCard, HomePanel } from './useHomePanels'

const warmedUrls = new Set<string>()

export function collectPanelMediaUrls(panel?: HomePanel | null) {
  return compactUrls([
    panel?.imageUrl,
    panel?.posterUrl,
    panel?.videoUrl,
    panel?.mascotUrl,
  ])
}

export function collectPanelPreviewMediaUrls(panel?: HomePanel | null) {
  return compactUrls([
    panel?.imageUrl,
    panel?.posterUrl,
    panel?.mascotUrl,
  ])
}

export function collectPortfolioCardMediaUrls(card?: PortfolioCard | null) {
  const articleImages = (card?.articleBlocks || []).flatMap((block) => {
    if (block.imageGroups?.length) {
      return block.imageGroups.flatMap((group) => group.images)
    }

    return block.images
  })

  return compactUrls([
    card?.caseHeroUrl,
    card?.imageUrl,
    card?.posterUrl,
    card?.videoUrl,
    ...articleImages.map((image: PortfolioArticleImage) => image.url),
  ])
}

export function warmMediaUrls(urls: string[]) {
  const uniqueUrls = [...new Set(urls)].filter((url) => url && !warmedUrls.has(url))

  for (const url of uniqueUrls) {
    warmedUrls.add(url)

    window.requestIdleCallback?.(() => preloadMedia(url))
      ?? window.setTimeout(() => preloadMedia(url), 1)
  }
}

function preloadMedia(url: string) {
  if (isVideoUrl(url)) {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.src = url
    video.load()
    return
  }

  const image = new Image()
  image.decoding = 'async'
  image.src = url
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url)
}

function compactUrls(urls: Array<string | null | undefined>) {
  return urls.filter((url): url is string => Boolean(url))
}
