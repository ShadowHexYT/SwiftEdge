import { savedPanelTemplates } from '../features/premium/panelRegistry'

export function PremiumPanelsView() {
  return (
    <section className="section-shell premium-shell">
      <div className="premium-hero">
        <div className="premium-hero__eyebrow">Premium Architecture Ready</div>
        <h2>Embedded website panels are stubbed cleanly and ready to unlock later.</h2>
        <p>
          Saved panel shortcuts, premium gating, and a dedicated website mode already exist in the
          code structure. Payment and entitlement logic can be added later without reshaping the
          sidebar shell.
        </p>
      </div>

      <div className="panel-shortcuts">
        {savedPanelTemplates.map((panel) => (
          <article key={panel.id} className="panel-shortcut-card">
            <div>
              <div className="panel-shortcut-card__title">{panel.label}</div>
              <div className="panel-shortcut-card__url">{panel.url}</div>
            </div>
            <span className="badge-chip">Locked</span>
          </article>
        ))}
      </div>

      <div className="premium-note">
        Future implementation path: each saved shortcut maps to a premium panel descriptor, which
        can later render an embedded webview surface per site or a dedicated authenticated panel.
      </div>
    </section>
  )
}
