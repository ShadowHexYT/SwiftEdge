import type { ClipboardItem } from '../features/clipboard/types'

type ClipboardListProps = {
  items: ClipboardItem[]
  allItemsCount: number
  isReady: boolean
  query: string
  onQueryChange: (query: string) => void
  onCopy: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClearAll: () => Promise<void>
}

function formatTimestamp(createdAt: number) {
  return new Intl.DateTimeFormat([], {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(createdAt))
}

export function ClipboardList({
  items,
  allItemsCount,
  isReady,
  query,
  onQueryChange,
  onCopy,
  onDelete,
  onClearAll,
}: ClipboardListProps) {
  return (
    <section className="section-shell">
      <div className="toolbar-row">
        <label className="search-field">
          <span className="search-field__label">Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search text snippets"
          />
        </label>
        <button type="button" className="ghost-button" onClick={() => void onClearAll()}>
          Clear all
        </button>
      </div>

      <div className="status-line">
        <span>{allItemsCount} saved items</span>
        <span>Newest first</span>
      </div>

      <div className="clipboard-list" role="list" aria-busy={!isReady}>
        {!isReady ? <div className="empty-state">Loading clipboard history…</div> : null}

        {isReady && items.length === 0 ? (
          <div className="empty-state">
            {query ? 'No text snippets match that search.' : 'Copy text or an image to start building history.'}
          </div>
        ) : null}

        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="clipboard-card"
            data-kind={item.kind}
            role="listitem"
            onClick={() => void onCopy(item.id)}
          >
            <div className="clipboard-card__meta">
              <span className="clipboard-card__kind">{item.kind === 'text' ? 'Text' : 'Image'}</span>
              <span className="clipboard-card__time">{formatTimestamp(item.createdAt)}</span>
            </div>

            {item.kind === 'image' && item.imageDataUrl ? (
              <div className="clipboard-card__image-wrap">
                <img src={item.imageDataUrl} alt="" className="clipboard-card__image" />
              </div>
            ) : null}

            <div className="clipboard-card__preview">{item.preview}</div>

            <div className="clipboard-card__footer">
              <span>Click to copy back</span>
              <span className="clipboard-card__actions">
                <span className="clipboard-card__action">Reuse</span>
                <span
                  className="clipboard-card__action clipboard-card__action--danger"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    void onDelete(item.id)
                  }}
                >
                  Delete
                </span>
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
