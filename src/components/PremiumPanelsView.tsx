import { savedPanelTemplates } from '../features/premium/panelRegistry'
import { IconGlobe, IconLock } from './Icons'

export function PremiumPanelsView() {
  return (
    <section className="section-shell premium-shell">
      <div className="premium-hero">
        <div className="premium-hero__icon">
          <IconGlobe size={24} />
        </div>
        <h2>Web Panels</h2>
        <p>
          Embedded website panels will be available with a premium
          subscription. Saved shortcuts are ready to unlock.
        </p>
      </div>

      <div className="panel-shortcuts">
        {savedPanelTemplates.map((panel) => (
          <div key={panel.id} className="panel-shortcut">
            <div className="panel-shortcut__info">
              <div className="panel-shortcut__label">{panel.label}</div>
              <div className="panel-shortcut__url">{panel.url}</div>
            </div>
            <span className="panel-shortcut__lock">
              <IconLock size={11} /> Locked
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
