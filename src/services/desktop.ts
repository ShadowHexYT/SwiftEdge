import type { ClipboardItem } from '../features/clipboard/types'
import type { SidebarWindowState } from '../types/settings'
import { isTauriRuntime } from './runtime'

const BROWSER_CLIPBOARD_KEY = 'swiftedge.browser.clipboardHistory'
const BROWSER_CLIPBOARD_EVENT = 'swiftedge:clipboard-updated'

let browserClipboardLimit = 80
let browserMonitorStarted = false
let lastBrowserFingerprint: string | null = null
let coreModulePromise: Promise<typeof import('@tauri-apps/api/core')> | null = null
let eventModulePromise: Promise<typeof import('@tauri-apps/api/event')> | null = null

function readBrowserClipboardHistory() {
  const raw = window.localStorage.getItem(BROWSER_CLIPBOARD_KEY)
  return raw ? (JSON.parse(raw) as ClipboardItem[]) : []
}

function emitBrowserClipboardHistory(items: ClipboardItem[]) {
  window.localStorage.setItem(BROWSER_CLIPBOARD_KEY, JSON.stringify(items))
  window.dispatchEvent(
    new CustomEvent<ClipboardItem[]>(BROWSER_CLIPBOARD_EVENT, { detail: items }),
  )
}

function hashValue(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return `${Math.abs(hash)}`
}

function createTextClipboardItem(text: string): ClipboardItem | null {
  const trimmed = text.trim()
  if (!trimmed) {
    return null
  }

  const timestamp = Date.now()
  const fingerprint = hashValue(trimmed)
  const preview =
    trimmed.replace(/\s+/g, ' ').slice(0, 240) + (trimmed.length > 240 ? '…' : '')

  return {
    id: `${timestamp}-${fingerprint}`,
    kind: 'text',
    preview,
    createdAt: timestamp,
    searchText: trimmed,
    textValue: trimmed,
    imageDataUrl: null,
    imageWidth: null,
    imageHeight: null,
  }
}

function createImageClipboardItem(dataUrl: string): ClipboardItem {
  const timestamp = Date.now()
  const fingerprint = hashValue(dataUrl)

  return {
    id: `${timestamp}-${fingerprint}`,
    kind: 'image',
    preview: 'Image from clipboard',
    createdAt: timestamp,
    searchText: 'image',
    textValue: null,
    imageDataUrl: dataUrl,
    imageWidth: null,
    imageHeight: null,
  }
}

function upsertBrowserClipboardItem(item: ClipboardItem) {
  const fingerprint = item.kind === 'text' ? item.textValue ?? '' : item.imageDataUrl ?? ''
  const nextFingerprint = hashValue(fingerprint)
  if (nextFingerprint === lastBrowserFingerprint) {
    return
  }

  lastBrowserFingerprint = nextFingerprint
  const nextItems = readBrowserClipboardHistory().filter((existing) => {
    if (item.kind === 'text') {
      return existing.textValue !== item.textValue
    }

    return existing.imageDataUrl !== item.imageDataUrl
  })

  nextItems.unshift(item)
  nextItems.sort((left, right) => right.createdAt - left.createdAt)
  emitBrowserClipboardHistory(nextItems.slice(0, browserClipboardLimit))
}

function startBrowserClipboardMonitor() {
  if (browserMonitorStarted) {
    return
  }

  browserMonitorStarted = true

  window.addEventListener('paste', (event) => {
    const text = event.clipboardData?.getData('text/plain')
    const textItem = text ? createTextClipboardItem(text) : null
    if (textItem) {
      upsertBrowserClipboardItem(textItem)
    }

    const file = Array.from(event.clipboardData?.files ?? []).find((entry) =>
      entry.type.startsWith('image/'),
    )

    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          upsertBrowserClipboardItem(createImageClipboardItem(reader.result))
        }
      }
      reader.readAsDataURL(file)
    }
  })

  window.setInterval(async () => {
    try {
      const text = await navigator.clipboard?.readText?.()
      const item = text ? createTextClipboardItem(text) : null
      if (item) {
        upsertBrowserClipboardItem(item)
      }
    } catch {
      // Browsers require permissions or gestures here, so silent failure keeps the live demo usable.
    }
  }, 1800)
}

async function tauriInvoke<T>(command: string, payload?: Record<string, unknown>) {
  if (!coreModulePromise) {
    coreModulePromise = import('@tauri-apps/api/core')
  }

  const { invoke } = await coreModulePromise
  return invoke<T>(command, payload)
}

export async function subscribeClipboardUpdates(
  onItems: (items: ClipboardItem[]) => void,
) {
  if (isTauriRuntime()) {
    if (!eventModulePromise) {
      eventModulePromise = import('@tauri-apps/api/event')
    }

    const { listen } = await eventModulePromise
    return listen<{ items: ClipboardItem[] }>('swiftedge://clipboard-updated', (event) => {
      onItems(event.payload.items)
    })
  }

  startBrowserClipboardMonitor()
  const onEvent = (event: Event) => {
    const customEvent = event as CustomEvent<ClipboardItem[]>
    onItems(customEvent.detail)
  }
  window.addEventListener(BROWSER_CLIPBOARD_EVENT, onEvent)
  return () => {
    window.removeEventListener(BROWSER_CLIPBOARD_EVENT, onEvent)
  }
}

export async function getClipboardHistory() {
  if (isTauriRuntime()) {
    return tauriInvoke<ClipboardItem[]>('get_clipboard_history')
  }

  startBrowserClipboardMonitor()
  return readBrowserClipboardHistory()
}

export async function copyClipboardItem(id: string) {
  if (isTauriRuntime()) {
    await tauriInvoke<void>('copy_clipboard_item', { id })
    return
  }

  const item = readBrowserClipboardHistory().find((entry) => entry.id === id)
  if (!item) {
    return
  }

  if (item.kind === 'text' && item.textValue) {
    await navigator.clipboard.writeText(item.textValue)
    return
  }

  if (item.kind === 'image' && item.imageDataUrl && 'ClipboardItem' in window) {
    const response = await fetch(item.imageDataUrl)
    const blob = await response.blob()
    const browserClipboardItem = new window.ClipboardItem({ [blob.type]: blob })
    await navigator.clipboard.write([browserClipboardItem])
  }
}

export async function deleteClipboardItem(id: string) {
  if (isTauriRuntime()) {
    await tauriInvoke<void>('delete_clipboard_item', { id })
    return
  }

  emitBrowserClipboardHistory(
    readBrowserClipboardHistory().filter((item) => item.id !== id),
  )
}

export async function clearClipboardHistory() {
  if (isTauriRuntime()) {
    await tauriInvoke<void>('clear_clipboard_history')
    return
  }

  emitBrowserClipboardHistory([])
}

export async function setClipboardHistoryLimit(limit: number) {
  browserClipboardLimit = limit

  if (isTauriRuntime()) {
    await tauriInvoke<void>('set_clipboard_history_limit', { limit })
    return
  }

  emitBrowserClipboardHistory(readBrowserClipboardHistory().slice(0, limit))
}

export async function syncSidebarWindow(payload: SidebarWindowState) {
  if (isTauriRuntime()) {
    await tauriInvoke<void>('sync_sidebar_window', { payload })
  }
}

export async function replaceClipboardHistory(items: ClipboardItem[]) {
  if (isTauriRuntime()) {
    await tauriInvoke<void>('replace_clipboard_history', { items })
    return
  }

  const nextItems = [...items].sort((left, right) => right.createdAt - left.createdAt)
  emitBrowserClipboardHistory(nextItems.slice(0, browserClipboardLimit))
}
