import type { AppSettings, EdgeSide, ThemeTreatment } from '../types/settings'
import type { AuthStatus, AuthUser, SyncStatus } from '../features/auth/types'
import { IconChevronLeft } from './Icons'

type SettingsPanelProps = {
  settings: AppSettings
  onChange: (nextSettings: AppSettings) => void
  onClose: () => void
  user: AuthUser | null
  authReady: boolean
  authAvailable: boolean
  authStatus: AuthStatus
  syncStatus: SyncStatus
  syncMessage: string
  onSignIn: () => void
  onSignOut: () => void
}

const edgeOptions: EdgeSide[] = ['left', 'right']
const themeOptions: ThemeTreatment[] = ['system', 'windows', 'macos']

export function SettingsPanel({
  settings,
  onChange,
  onClose,
  user,
  authReady,
  authAvailable,
  authStatus,
  syncStatus,
  syncMessage,
  onSignIn,
  onSignOut,
}: SettingsPanelProps) {
  const isMac = document.documentElement.dataset.platform === 'macos'
  const shortcutLabel = isMac ? '\u2318\u21E7Space' : 'Ctrl+Shift+Space'

  return (
    <section className="section-shell settings-shell">
      <div className="settings-header">
        <button type="button" className="icon-btn" onClick={onClose} title="Back">
          <IconChevronLeft size={18} />
        </button>
        <h2>Settings</h2>
        <div style={{ width: 32 }} />
      </div>

      <div className="settings-group">
        <div className="settings-group__title">Appearance</div>

        <div className="setting-row">
          <div className="setting-row__label">
            <strong>Theme</strong>
            <span>Match your OS or pick manually</span>
          </div>
          <div className="segmented-control">
            {themeOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                data-active={settings.themeTreatment === opt}
                onClick={() => onChange({ ...settings, themeTreatment: opt })}
              >
                {opt[0].toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-row__label">
            <strong>Edge side</strong>
          </div>
          <div className="segmented-control">
            {edgeOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                data-active={settings.edgeSide === opt}
                onClick={() => onChange({ ...settings, edgeSide: opt })}
              >
                {opt[0].toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row setting-row--stacked">
          <div className="setting-row__label">
            <strong>Sidebar width</strong>
            <span>{settings.sidebarWidth}px</span>
          </div>
          <input
            className="setting-slider"
            type="range"
            min="280"
            max="640"
            step="10"
            value={settings.sidebarWidth}
            onChange={(e) =>
              onChange({
                ...settings,
                sidebarWidth: Number.parseInt(e.target.value, 10),
              })
            }
          />
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group__title">Behavior</div>

        <div className="setting-row setting-row--stacked">
          <div className="setting-row__label">
            <strong>Hover delay</strong>
            <span>{settings.hoverDelayMs}ms before opening</span>
          </div>
          <input
            className="setting-slider"
            type="range"
            min="0"
            max="900"
            step="50"
            value={settings.hoverDelayMs}
            onChange={(e) =>
              onChange({
                ...settings,
                hoverDelayMs: Number.parseInt(e.target.value, 10),
              })
            }
          />
        </div>

        <label className="setting-row">
          <div className="setting-row__label">
            <strong>Pin open</strong>
            <span>Keep sidebar visible</span>
          </div>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.pinOpen}
              onChange={(e) =>
                onChange({ ...settings, pinOpen: e.target.checked })
              }
            />
            <div className="toggle-switch__track" />
          </div>
        </label>

        <label className="setting-row">
          <div className="setting-row__label">
            <strong>Launch on startup</strong>
          </div>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.launchOnStartup}
              onChange={(e) =>
                onChange({ ...settings, launchOnStartup: e.target.checked })
              }
            />
            <div className="toggle-switch__track" />
          </div>
        </label>

        <div className="setting-row setting-row--stacked">
          <div className="setting-row__label">
            <strong>Clipboard history limit</strong>
            <span>{settings.clipboardHistoryLimit} items</span>
          </div>
          <input
            className="setting-slider"
            type="range"
            min="20"
            max="200"
            step="10"
            value={settings.clipboardHistoryLimit}
            onChange={(e) =>
              onChange({
                ...settings,
                clipboardHistoryLimit: Number.parseInt(e.target.value, 10),
              })
            }
          />
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group__title">Shortcut</div>
        <div className="setting-row">
          <div className="setting-row__label">
            <strong>Toggle sidebar</strong>
          </div>
          <div className="setting-row__value">{shortcutLabel}</div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group__title">Account & Sync</div>
        <div className="account-card">
          <div className="account-card__avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" />
            ) : (
              <span>{user?.displayName?.[0]?.toUpperCase() ?? 'G'}</span>
            )}
          </div>
          <div className="account-card__info">
            {user ? (
              <>
                <div className="account-card__name">
                  {user.displayName ?? 'Signed in'}
                </div>
                <div className="account-card__detail">{user.email}</div>
              </>
            ) : (
              <>
                <div className="account-card__name">Cloud Sync</div>
                <div className="account-card__detail">
                  Sign in with Google to sync across devices
                </div>
              </>
            )}
          </div>
          <div className="sync-badge" data-status={syncStatus}>
            {authAvailable ? syncMessage : 'No config'}
          </div>
        </div>
        {authAvailable ? (
          <div className="setting-row" style={{ justifyContent: 'center' }}>
            {user ? (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={onSignOut}
              >
                Sign out
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--filled"
                onClick={onSignIn}
                disabled={!authReady || authStatus === 'signing-in'}
              >
                {authStatus === 'signing-in'
                  ? 'Connecting\u2026'
                  : 'Sign in with Google'}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}
