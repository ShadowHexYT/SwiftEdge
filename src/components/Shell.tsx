import { useCallback, useEffect, useRef, type PropsWithChildren } from 'react'
import type { EdgeSide } from '../types/settings'

type ShellProps = PropsWithChildren<{
  edgeSide: EdgeSide
  isOpen: boolean
  isExpanded: boolean
  isPinned: boolean
  sidebarWidth: number
  onPointerEnter: () => void
  onPointerLeave: () => void
  onWidthChange: (width: number) => void
}>

export function Shell({
  edgeSide,
  isOpen,
  isExpanded,
  isPinned,
  sidebarWidth,
  onPointerEnter,
  onPointerLeave,
  onWidthChange,
  children,
}: ShellProps) {
  const frameRef = useRef<number | null>(null)
  const pendingWidthRef = useRef(sidebarWidth)

  useEffect(() => {
    pendingWidthRef.current = sidebarWidth
  }, [sidebarWidth])

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  const startResize = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = sidebarWidth

      const onMove = (ev: PointerEvent) => {
        const delta =
          edgeSide === 'right' ? startX - ev.clientX : ev.clientX - startX
        pendingWidthRef.current = Math.round(
          Math.max(280, Math.min(640, startWidth + delta)),
        )

        if (frameRef.current === null) {
          frameRef.current = window.requestAnimationFrame(() => {
            frameRef.current = null
            onWidthChange(pendingWidthRef.current)
          })
        }
      }

      const onUp = () => {
        if (frameRef.current !== null) {
          window.cancelAnimationFrame(frameRef.current)
          frameRef.current = null
        }
        onWidthChange(pendingWidthRef.current)
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
    },
    [edgeSide, sidebarWidth, onWidthChange],
  )

  return (
    <main
      className="app-shell"
      data-edge={edgeSide}
      data-open={isOpen}
      data-expanded={isExpanded}
      data-pinned={isPinned}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      style={{ ['--sidebar-width' as string]: `${sidebarWidth}px` }}
    >
      <div className="edge-handle" aria-hidden="true">
        <div className="edge-handle__bar" />
      </div>
      <div className="panel-frame">
        <div className="resize-handle" onPointerDown={startResize} aria-hidden="true">
          <div className="resize-handle__grip" />
        </div>
        <div className="sidebar-surface">{children}</div>
      </div>
    </main>
  )
}
