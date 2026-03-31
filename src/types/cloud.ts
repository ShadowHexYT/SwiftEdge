import type { ClipboardItem } from '../features/clipboard/types'
import type { NoteItem } from '../features/notes/types'
import type { AppSettings } from './settings'

export type CloudWorkspace = {
  settings: AppSettings
  notes: NoteItem[]
  clipboardItems: ClipboardItem[]
  updatedAt: number
}
