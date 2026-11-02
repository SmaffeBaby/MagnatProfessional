import type { InlineTextPart } from '../types/siteChrome'
import { isSafeChromeLink } from '../../backend/src/content/siteChromeConfig.js'

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

export function inlineTextToHtml(parts: InlineTextPart[]) {
  return parts.map(part => part.href && isSafeChromeLink(part.href)
    ? `<a href="${escapeHtml(part.href)}">${escapeHtml(part.text)}</a>`
    : escapeHtml(part.text)).join('')
}

export function inlineTextFromHtml(html: string): InlineTextPart[] {
  const root = new DOMParser().parseFromString(html, 'text/html').body
  const parts: InlineTextPart[] = []
  function append(text: string, href?: string) {
    if (!text) return
    const last = parts[parts.length - 1]
    if (last && last.href === href) last.text += text
    else parts.push(href ? { text, href } : { text })
  }
  function visit(node: Node, href?: string) {
    if (node.nodeType === Node.TEXT_NODE) return append(node.textContent || '', href)
    if (!(node instanceof Element) || ['SCRIPT', 'STYLE', 'IFRAME'].includes(node.tagName)) return
    if (node.tagName === 'BR') return append('\n')
    if (node.tagName === 'A') {
      const candidate = node.getAttribute('href') || ''
      href = isSafeChromeLink(candidate) ? candidate : undefined
    }
    if (['P', 'DIV'].includes(node.tagName) && parts.length && !parts[parts.length - 1].text.endsWith('\n')) append('\n')
    node.childNodes.forEach(child => visit(child, href))
  }
  root.childNodes.forEach(node => visit(node))
  return parts
}
