import type { SidebarMode } from '../types/settings'
import {
  IconClipboard,
  IconGlobe,
  IconNotes,
  IconPin,
  IconSettings,
} from './Icons'

type HeaderProps = {
  activeMode: SidebarMode
  onModeChange: (mode: SidebarMode) => void
  onOpenSettings: () => void
  onTogglePin: () => void
  isPinned: boolean
  isPremiumUnlocked: boolean
}

const modes: Array<{
  id: SidebarMode
  label: string
  icon: React.ComponentType<{ size?: number }>
}> = [
  { id: 'notes', label: 'Notes', icon: IconNotes },
  { id: 'clipboard', label: 'Clipboard', icon: IconClipboard },
  { id: 'panels', label: 'Web', icon: IconGlobe },
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
      <div className="header-brand">
        <div className="header-brand__mark">S</div>
      </div>

      <nav className="mode-tabs" role="tablist" aria-label="Sidebar mode">
        {modes.map((mode) => {
          const Icon = mode.icon
          const isLocked = mode.id === 'panels' && !isPremiumUnlocked
          const isActive = activeMode === mode.id

          return (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className="mode-tab"
              data-active={isActive}
              onClick={() => onModeChange(mode.id)}
            >
              <Icon size={15} />
              <span>{mode.label}</span>
              {isLocked ? <span className="mode-tab__badge">Pro</span> : null}
            </button>
          )
        })}
      </nav>

      <div className="header-actions">
        <button
          type="button"
          className="icon-btn"
          data-active={isPinned}
          onClick={onTogglePin}
          aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
        >
          <IconPin size={15} />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onOpenSettings}
          aria-label="Settings"
          title="Settings"
        >
          <IconSettings size={15} />
        </button>
      </div>
    </header>
  )
}
