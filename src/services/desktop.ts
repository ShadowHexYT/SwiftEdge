import { invoke } from '@tauri-apps/api/core'
import type { ClipboardItem } from '../features/clipboard/types'
import type { SidebarWindowState } from '../types/settings'

export function getClipboardHistory() {
  return invoke<ClipboardItem[]>('get_clipboard_history')
}

export function copyClipboardItem(id: string) {
  return invoke<void>('copy_clipboard_item', { id })
}

export function deleteClipboardItem(id: string) {
  return invoke<void>('delete_clipboard_item', { id })
}

export function clearClipboardHistory() {
  return invoke<void>('clear_clipboard_history')
}

export function setClipboardHistoryLimit(limit: number) {
  return invoke<void>('set_clipboard_history_limit', { limit })
}

export function syncSidebarWindow(payload: SidebarWindowState) {
  return invoke<void>('sync_sidebar_window', { payload })
}

export function replaceClipboardHistory(items: ClipboardItem[]) {
  return invoke<void>('replace_clipboard_history', { items })
}
