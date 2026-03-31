import { memo } from 'react'
import type { ClipboardItem } from '../features/clipboard/types'
import { IconSearch, IconTrash } from './Icons'

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

const clipboardTimeFormatter = new Intl.DateTimeFormat([], {
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
  day: 'numeric',
})

function formatTimestamp(createdAt: number) {
  return clipboardTimeFormatter.format(new Date(createdAt))
}

export const ClipboardList = memo(function ClipboardList({
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
      <div className="search-bar">
        <div className="search-input-wrap">
          <IconSearch size={14} />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search clipboard..."
          />
        </div>
        {allItemsCount > 0 && (
          <button
            type="button"
            className="btn btn--ghost btn--sm btn--danger"
            onClick={() => void onClearAll()}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="status-line">
        <span>
          {allItemsCount} item{allItemsCount !== 1 ? 's' : ''}
        </span>
        <span>Newest first</span>
      </div>

      <div className="clipboard-list" role="list" aria-busy={!isReady}>
        {!isReady ? <div className="empty-state">Loading clipboard…</div> : null}

        {isReady && items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__title">
              {query ? 'No matches' : 'Clipboard is empty'}
            </div>
            <span>
              {query
                ? 'No text snippets match your search.'
                : 'Copy text or images to start building history.'}
            </span>
          </div>
        ) : null}

        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="clip-card"
            role="listitem"
            onClick={() => void onCopy(item.id)}
          >
            <div className="clip-card__header">
              <span className="clip-card__kind">
                {item.kind === 'text' ? 'Text' : 'Image'}
              </span>
              <span className="clip-card__time">
                {formatTimestamp(item.createdAt)}
              </span>
            </div>

            {item.kind === 'image' && item.imageDataUrl ? (
              <div className="clip-card__image-wrap">
                <img src={item.imageDataUrl} alt="" />
              </div>
            ) : null}

            <div className="clip-card__preview">{item.preview}</div>

            <div className="clip-card__footer">
              <span className="clip-card__hint">Click to copy</span>
              <div className="clip-card__actions">
                <span
                  className="icon-btn icon-btn--inline"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    void onDelete(item.id)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      e.stopPropagation()
                      void onDelete(item.id)
                    }
                  }}
                  title="Delete"
                >
                  <IconTrash size={13} />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
})
