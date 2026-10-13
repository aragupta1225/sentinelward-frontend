import { useEffect } from 'react'

const DOCK_CONTROL_SELECTOR = [
  'button',
  '.button-link',
  '.page-actions a',
  '.table-actions a',
  '.primary-nav a',
  '.logout-link',
  '.login-back-link',
  '.landing-final-cta a',
  '.landing-safety__copy > a',
].join(', ')

function resetControl(control: HTMLElement) {
  control.style.removeProperty('--dock-scale')
  control.style.removeProperty('--dock-lift')
}

export function DockMotion() {
  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!finePointer.matches || reducedMotion.matches) return

    let controls: HTMLElement[] = []
    let frame = 0

    const refreshControls = () => {
      controls.forEach((control) => control.removeAttribute('data-dock-motion'))
      controls = Array.from(document.querySelectorAll<HTMLElement>(DOCK_CONTROL_SELECTOR))
      controls.forEach((control) => control.setAttribute('data-dock-motion', ''))
    }
    const resetAll = () => controls.forEach(resetControl)
    const update = (clientX: number, clientY: number) => {
      for (const control of controls) {
        if (control instanceof HTMLButtonElement && control.disabled) {
          resetControl(control)
          continue
        }
        const rect = control.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue
        const nearestX = Math.max(rect.left, Math.min(clientX, rect.right))
        const nearestY = Math.max(rect.top, Math.min(clientY, rect.bottom))
        const distance = Math.hypot(clientX - nearestX, clientY - nearestY)
        const proximity = Math.max(0, 1 - distance / 140) ** 2
        if (proximity < 0.002) {
          resetControl(control)
          continue
        }
        const isLargeControl = rect.width > 260 || rect.height > 96
        const scale = 1 + proximity * (isLargeControl ? 0.025 : 0.08)
        const lift = proximity * (isLargeControl ? -2 : -4)
        control.style.setProperty('--dock-scale', scale.toFixed(3))
        control.style.setProperty('--dock-lift', `${lift.toFixed(2)}px`)
      }
    }
    const onPointerMove = (event: PointerEvent) => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => update(event.clientX, event.clientY))
    }
    const observer = new MutationObserver(refreshControls)

    refreshControls()
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', resetAll)
    window.addEventListener('blur', resetAll)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', resetAll)
      window.removeEventListener('blur', resetAll)
      resetAll()
      controls.forEach((control) => control.removeAttribute('data-dock-motion'))
    }
  }, [])

  return null
}
