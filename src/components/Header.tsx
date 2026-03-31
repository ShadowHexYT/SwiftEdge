import type { SidebarMode } from '../types/settings'

type HeaderProps = {
  activeMode: SidebarMode
  onModeChange: (mode: SidebarMode) => void
  onOpenSettings: () => void
  onTogglePin: () => void
  isPinned: boolean
  isPremiumUnlocked: boolean
}

const modes: Array<{ id: SidebarMode; label: string }> = [
  { id: 'notes', label: 'Notes' },
  { id: 'clipboard', label: 'Clipboard' },
  { id: 'panels', label: 'Web Panels' },
]

export function Header({
  activeMode,
  onModeChange,
  onOpenSettings,
  onTogglePin,
  isPinned,
  isPremiumUnlocked,
}: HeaderProps) {
  return (
    <header className="sidebar-header">
      <div className="sidebar-title">
        <div className="sidebar-title__eyebrow">Edge Utility</div>
        <div className="sidebar-title__name">SwiftEdge</div>
      </div>

      <div className="mode-toggle" role="tablist" aria-label="Sidebar mode">
        {modes.map((mode) => {
          const isLocked = mode.id === 'panels' && !isPremiumUnlocked
          const isActive = activeMode === mode.id

          return (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className="mode-toggle__button"
              data-active={isActive}
              onClick={() => onModeChange(mode.id)}
            >
              <span>{mode.label}</span>
              {isLocked ? <span className="badge-chip">Premium</span> : null}
            </button>
          )
        })}
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="icon-button"
          onClick={onTogglePin}
          aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
        >
          {isPinned ? 'Unpin' : 'Pin'}
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Open settings"
        >
          Settings
        </button>
      </div>
    </header>
  )
}
