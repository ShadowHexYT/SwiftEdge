import { useDeferredValue, useEffect, useState } from 'react'
import type { NoteItem } from '../features/notes/types'

type NotesWorkspaceProps = {
  notes: NoteItem[]
  isReady: boolean
  onCreate: () => void
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<Pick<NoteItem, 'title' | 'body'>>) => void
}

function formatUpdatedAt(timestamp: number) {
  return new Intl.DateTimeFormat([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function NotesWorkspace({
  notes,
  isReady,
  onCreate,
  onDelete,
  onUpdate,
}: NotesWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const deferredQuery = useDeferredValue(searchValue)

  useEffect(() => {
    if (notes.length === 0) {
      setSelectedId(null)
      return
    }

    if (!selectedId || !notes.some((note) => note.id === selectedId)) {
      setSelectedId(notes[0].id)
    }
  }, [notes, selectedId])

  const query = deferredQuery.trim().toLowerCase()
  const filteredNotes = !query
    ? notes
    : notes.filter((note) => {
        const haystack = `${note.title}\n${note.body}`.toLowerCase()
        return haystack.includes(query)
      })

  const selectedNote =
    filteredNotes.find((note) => note.id === selectedId) ??
    notes.find((note) => note.id === selectedId) ??
    null

  return (
    <section className="section-shell notes-shell">
      <div className="toolbar-row">
        <label className="search-field">
          <span className="search-field__label">Find note</span>
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search titles and note text"
          />
        </label>
        <button type="button" className="ghost-button" onClick={onCreate}>
          New note
        </button>
      </div>

      <div className="notes-layout">
        <aside className="notes-list" aria-busy={!isReady}>
          {!isReady ? <div className="empty-state">Loading notes…</div> : null}
          {isReady && filteredNotes.length === 0 ? (
            <div className="empty-state">
              {notes.length === 0
                ? 'Create your first note to start building a personal workspace.'
                : 'No notes match that search.'}
            </div>
          ) : null}

          {filteredNotes.map((note) => (
            <button
              key={note.id}
              type="button"
              className="note-list-card"
              data-active={note.id === selectedNote?.id}
              onClick={() => setSelectedId(note.id)}
            >
              <div className="note-list-card__title">{note.title || 'Untitled note'}</div>
              <div className="note-list-card__excerpt">{note.body || 'Start writing…'}</div>
              <div className="note-list-card__meta">{formatUpdatedAt(note.updatedAt)}</div>
            </button>
          ))}
        </aside>

        <div className="note-editor-shell">
          {selectedNote ? (
            <>
              <div className="note-editor-toolbar">
                <div>
                  <div className="section-heading__eyebrow">Personal note</div>
                  <div className="note-editor-toolbar__stamp">
                    Updated {formatUpdatedAt(selectedNote.updatedAt)}
                  </div>
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onDelete(selectedNote.id)}
                >
                  Delete
                </button>
              </div>

              <input
                type="text"
                className="note-title-input"
                value={selectedNote.title}
                onChange={(event) => onUpdate(selectedNote.id, { title: event.target.value })}
                placeholder="Untitled note"
              />

              <textarea
                className="note-body-input"
                value={selectedNote.body}
                onChange={(event) => onUpdate(selectedNote.id, { body: event.target.value })}
                placeholder="Write thoughts, tasks, or snippets you want available from every machine."
              />
            </>
          ) : (
            <div className="empty-state">Select a note or create a fresh one to start writing.</div>
          )}
        </div>
      </div>
    </section>
  )
}
