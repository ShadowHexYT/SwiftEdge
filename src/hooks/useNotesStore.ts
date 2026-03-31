import { useEffect, useState } from 'react'
import { LazyStore } from '@tauri-apps/plugin-store'
import type { NoteItem } from '../features/notes/types'

const notesStore = new LazyStore('notes.json')

export function useNotesStore() {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadNotes() {
      const stored = (await notesStore.get<NoteItem[]>('notes')) ?? []
      if (cancelled) {
        return
      }

      setNotes([...stored].sort((left, right) => right.updatedAt - left.updatedAt))
      setIsReady(true)
    }

    void loadNotes()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isReady) {
      return
    }

    void notesStore.set('notes', notes)
  }, [isReady, notes])

  return {
    notes,
    isReady,
    setNotes: (nextNotes: NoteItem[]) =>
      setNotes([...nextNotes].sort((left, right) => right.updatedAt - left.updatedAt)),
    updateNotes: (
      updater: NoteItem[] | ((currentNotes: NoteItem[]) => NoteItem[]),
    ) =>
      setNotes((currentNotes) => {
        const nextNotes =
          typeof updater === 'function' ? updater(currentNotes) : updater

        return [...nextNotes].sort((left, right) => right.updatedAt - left.updatedAt)
      }),
  }
}
