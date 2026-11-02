/**
 * Mouse dragging and wheel scrolling for a horizontal rail of clickable cards.
 * Touch scrolling stays native. No pointer capture until a drag is intentional,
 * so a simple click still reaches the card's link.
 * @param {HTMLElement} element
 * @param {{ onDraggingChange?: (dragging: boolean) => void, isHorizontal: () => boolean }} options
 */
export function bindHorizontalSlider(element, { onDraggingChange = () => {}, isHorizontal }) {
  let pointerId = null
  let startX = 0
  let startLeft = 0
  let dragging = false
  let suppressClick = false
  const removers = []

  function listen(type, handler, options) {
    element.addEventListener(type, handler, options)
    removers.push(() => element.removeEventListener(type, handler, options))
  }

  function maxScroll() {
    return Math.max(0, element.scrollWidth - element.clientWidth)
  }

  function stopDrag() {
    const capturedPointer = pointerId
    pointerId = null
    dragging = false
    onDraggingChange(false)
    if (capturedPointer !== null && element.hasPointerCapture(capturedPointer)) {
      element.releasePointerCapture(capturedPointer)
    }
  }

  listen('pointerdown', event => {
    suppressClick = false
    if (event.button !== 0 || event.isPrimary === false || event.pointerType === 'touch'
      || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
      || !isHorizontal() || maxScroll() <= 1) return
    stopDrag()
    pointerId = event.pointerId
    startX = event.clientX
    startLeft = element.scrollLeft
  })

  listen('pointermove', event => {
    if (pointerId !== event.pointerId) return
    if (!(event.buttons & 1) || !isHorizontal()) return stopDrag()
    const delta = event.clientX - startX
    if (!dragging && Math.abs(delta) < 6) return
    if (!dragging) {
      dragging = true
      suppressClick = true
      element.setPointerCapture(event.pointerId)
      onDraggingChange(true)
    }
    event.preventDefault()
    element.scrollLeft = Math.max(0, Math.min(maxScroll(), startLeft - delta))
  })

  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    listen(type, event => { if (event.pointerId === pointerId) stopDrag() })
  }
  listen('pointerleave', () => { if (!dragging) stopDrag() })
  listen('dragstart', event => { if (isHorizontal()) event.preventDefault() })
  listen('click', event => {
    if (!suppressClick || event.detail === 0) return
    event.preventDefault()
    event.stopPropagation()
    suppressClick = false
  }, true)

  listen('wheel', event => {
    if (!isHorizontal() || event.ctrlKey || !event.cancelable || maxScroll() <= 1) return
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1
    const delta = (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * unit
    const next = Math.max(0, Math.min(maxScroll(), element.scrollLeft + delta))
    // Let the page continue scrolling when the rail reaches either end.
    if (Math.abs(next - element.scrollLeft) < 0.5) return
    event.preventDefault()
    element.scrollLeft = next
  }, { passive: false })

  return () => {
    stopDrag()
    removers.forEach(remove => remove())
  }
}
