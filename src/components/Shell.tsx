import { useCallback, type PropsWithChildren } from 'react'
import type { EdgeSide } from '../types/settings'

type ShellProps = PropsWithChildren<{
  edgeSide: EdgeSide
  isOpen: boolean
  isPinned: boolean
  sidebarWidth: number
  onPointerEnter: () => void
  onPointerLeave: () => void
  onWidthChange: (width: number) => void
}>

export function Shell({
  edgeSide,
  isOpen,
  isPinned,
  sidebarWidth,
  onPointerEnter,
  onPointerLeave,
  onWidthChange,
  children,
}: ShellProps) {
  const startResize = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = sidebarWidth

      const onMove = (ev: PointerEvent) => {
        const delta =
          edgeSide === 'right' ? startX - ev.clientX : ev.clientX - startX
        onWidthChange(
          Math.round(Math.max(280, Math.min(640, startWidth + delta))),
        )
      }

      const onUp = () => {
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
      data-pinned={isPinned}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div className="edge-handle" aria-hidden="true">
        <div className="edge-handle__bar" />
      </div>
      {isOpen ? (
        <div className="panel-frame">
          <div
            className="resize-handle"
            onPointerDown={startResize}
            aria-hidden="true"
          >
            <div className="resize-handle__grip" />
          </div>
          <div className="sidebar-surface">{children}</div>
        </div>
      ) : null}
    </main>
  )
}
