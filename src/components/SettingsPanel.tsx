import type { AppSettings, EdgeSide, ThemeTreatment } from '../types/settings'

type SettingsPanelProps = {
  settings: AppSettings
  onChange: (nextSettings: AppSettings) => void
  onClose: () => void
}

const edgeOptions: EdgeSide[] = ['left', 'right']
const themeOptions: ThemeTreatment[] = ['system', 'windows', 'macos']

export function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  return (
    <section className="section-shell settings-shell">
      <div className="section-heading">
        <div>
          <div className="section-heading__eyebrow">Preferences</div>
          <h2>Behavior and appearance</h2>
        </div>
        <button type="button" className="ghost-button" onClick={onClose}>
          Done
        </button>
      </div>

      <div className="settings-grid">
        <label className="setting-card">
          <span>Edge side</span>
          <div className="segmented-control">
            {edgeOptions.map((option) => (
              <button
                key={option}
                type="button"
                data-active={settings.edgeSide === option}
                onClick={() => onChange({ ...settings, edgeSide: option })}
              >
                {option}
              </button>
            ))}
          </div>
        </label>

        <label className="setting-card">
          <span>Hover delay</span>
          <strong>{settings.hoverDelayMs} ms</strong>
          <input
            type="range"
            min="0"
            max="900"
            step="50"
            value={settings.hoverDelayMs}
            onChange={(event) =>
              onChange({ ...settings, hoverDelayMs: Number.parseInt(event.target.value, 10) })
            }
          />
        </label>

        <label className="setting-card">
          <span>Sidebar width</span>
          <strong>{settings.sidebarWidth}px</strong>
          <input
            type="range"
            min="320"
            max="520"
            step="10"
            value={settings.sidebarWidth}
            onChange={(event) =>
              onChange({ ...settings, sidebarWidth: Number.parseInt(event.target.value, 10) })
            }
          />
        </label>

        <label className="setting-card">
          <span>Clipboard history limit</span>
          <strong>{settings.clipboardHistoryLimit} items</strong>
          <input
            type="range"
            min="20"
            max="200"
            step="10"
            value={settings.clipboardHistoryLimit}
            onChange={(event) =>
              onChange({
                ...settings,
                clipboardHistoryLimit: Number.parseInt(event.target.value, 10),
              })
            }
          />
        </label>

        <label className="setting-card setting-card--inline">
          <span>Launch on startup</span>
          <input
            type="checkbox"
            checked={settings.launchOnStartup}
            onChange={(event) => onChange({ ...settings, launchOnStartup: event.target.checked })}
          />
        </label>

        <label className="setting-card setting-card--inline">
          <span>Pin open</span>
          <input
            type="checkbox"
            checked={settings.pinOpen}
            onChange={(event) => onChange({ ...settings, pinOpen: event.target.checked })}
          />
        </label>

        <label className="setting-card">
          <span>Theme treatment</span>
          <div className="segmented-control">
            {themeOptions.map((option) => (
              <button
                key={option}
                type="button"
                data-active={settings.themeTreatment === option}
                onClick={() => onChange({ ...settings, themeTreatment: option })}
              >
                {option}
              </button>
            ))}
          </div>
        </label>

        <div className="setting-card setting-card--static">
          <span>Keyboard shortcut</span>
          <strong>Command/Ctrl + Shift + Space</strong>
          <p>Toggles the sidebar open or closed from anywhere.</p>
        </div>

        <div className="setting-card setting-card--static">
          <span>Cloud sync</span>
          <strong>Google account powered</strong>
          <p>
            Sign in with Google to sync notes, clipboard history, and settings across your machines.
          </p>
        </div>
      </div>
    </section>
  )
}
