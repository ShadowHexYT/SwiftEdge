import { memo, useDeferredValue, useEffect, useRef, useState } from 'react'
import type { NoteItem } from '../features/notes/types'
import { IconPlus, IconSearch, IconTrash } from './Icons'

type NotesWorkspaceProps = {
  notes: NoteItem[]
  isReady: boolean
  onCreate: () => void
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<Pick<NoteItem, 'title' | 'body'>>) => void
}

const noteTimeFormatter = new Intl.DateTimeFormat([], {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

function formatUpdatedAt(timestamp: number) {
  return noteTimeFormatter.format(new Date(timestamp))
}

export const NotesWorkspace = memo(function NotesWorkspace({
  notes,
  isReady,
  onCreate,
  onDelete,
  onUpdate,
}: NotesWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const deferredQuery = useDeferredValue(searchValue)
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    if (notes.length === 0) {
      setSelectedId(null)
      return
    }

    if (!selectedId || !notes.some((n) => n.id === selectedId)) {
      setSelectedId(notes[0].id)
    }
  }, [notes, selectedId])

  const query = deferredQuery.trim().toLowerCase()
  const filteredNotes = !query
    ? notes
    : notes.filter((note) =>
        `${note.title}\n${note.body}`.toLowerCase().includes(query),
      )

  const selectedNote =
    filteredNotes.find((n) => n.id === selectedId) ??
    notes.find((n) => n.id === selectedId) ??
    null

  useEffect(() => {
    setDraftTitle(selectedNote?.title ?? '')
    setDraftBody(selectedNote?.body ?? '')
  }, [selectedNote?.id])

  useEffect(() => {
    if (!selectedNote) {
      return
    }

    if (
      draftTitle === selectedNote.title &&
      draftBody === selectedNote.body
    ) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      onUpdateRef.current(selectedNote.id, {
        title: draftTitle,
        body: draftBody,
      })
    }, 120)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [draftBody, draftTitle, selectedNote])

  return (
    <section className="section-shell">
      <div className="search-bar">
        <div className="search-input-wrap">
          <IconSearch size={14} />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Find note..."
          />
        </div>
        <button
          type="button"
          className="btn btn--filled btn--sm"
          onClick={onCreate}
        >
          <IconPlus size={14} />
          New
        </button>
      </div>

      <div className="notes-layout">
        <aside className="notes-list" aria-busy={!isReady}>
          {!isReady ? (
            <div className="empty-state">Loading…</div>
          ) : null}
          {isReady && filteredNotes.length === 0 ? (
            <div className="empty-state">
              <span>
                {notes.length === 0 ? 'No notes yet' : 'No matches'}
              </span>
            </div>
          ) : null}

          {filteredNotes.map((note) => (
            <button
              key={note.id}
              type="button"
              className="note-card"
              data-active={note.id === selectedNote?.id}
              onClick={() => setSelectedId(note.id)}
            >
              <div className="note-card__title">
                {note.title || 'Untitled note'}
              </div>
              <div className="note-card__excerpt">
                {note.body || 'Start writing…'}
              </div>
              <div className="note-card__meta">
                {formatUpdatedAt(note.updatedAt)}
              </div>
            </button>
          ))}
        </aside>

        <div className="note-editor">
          {selectedNote ? (
            <>
              <div className="note-editor__toolbar">
                <span className="note-editor__meta">
                  {formatUpdatedAt(selectedNote.updatedAt)}
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onDelete(selectedNote.id)}
                  title="Delete note"
                >
                  <IconTrash size={15} />
                </button>
              </div>
              <input
                type="text"
                className="note-editor__title"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Untitled note"
              />
              <textarea
                className="note-editor__body"
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                placeholder="Start writing…"
              />
            </>
          ) : (
            <div className="empty-state" style={{ flex: 1 }}>
              <div className="empty-state__title">No note selected</div>
              <span>Select a note or create a new one.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
})
