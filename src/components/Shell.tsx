import type { PropsWithChildren } from 'react'
import type { EdgeSide } from '../types/settings'

type ShellProps = PropsWithChildren<{
  edgeSide: EdgeSide
  isOpen: boolean
  isPinned: boolean
  onPointerEnter: () => void
  onPointerLeave: () => void
}>

export function Shell({
  edgeSide,
  isOpen,
  isPinned,
  onPointerEnter,
  onPointerLeave,
  children,
}: ShellProps) {
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
        <div className="edge-handle__glow" />
        <div className="edge-handle__bar" />
      </div>
      {isOpen ? <div className="panel-frame">{children}</div> : null}
    </main>
  )
}
