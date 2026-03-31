import { useEffect, useEffectEvent, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import {
  clearClipboardHistory,
  copyClipboardItem,
  deleteClipboardItem,
  getClipboardHistory,
  replaceClipboardHistory,
  setClipboardHistoryLimit,
} from '../services/desktop'
import type { ClipboardItem } from '../features/clipboard/types'

type ClipboardUpdatedPayload = {
  items: ClipboardItem[]
}

export function useClipboardHistory(historyLimit: number) {
  const [items, setItems] = useState<ClipboardItem[]>([])
  const [isReady, setIsReady] = useState(false)

  const applyItems = useEffectEvent((nextItems: ClipboardItem[]) => {
    setItems(nextItems)
    setIsReady(true)
  })

  useEffect(() => {
    let unlisten: (() => void) | undefined

    async function bootstrap() {
      const initialItems = await getClipboardHistory()
      applyItems(initialItems)

      unlisten = await listen<ClipboardUpdatedPayload>('swiftedge://clipboard-updated', (event) => {
        applyItems(event.payload.items)
      })
    }

    void bootstrap()

    return () => {
      unlisten?.()
    }
  }, [applyItems])

  useEffect(() => {
    void setClipboardHistoryLimit(historyLimit)
  }, [historyLimit])

  return {
    items,
    isReady,
    copyItem: copyClipboardItem,
    deleteItem: deleteClipboardItem,
    clearAll: clearClipboardHistory,
    replaceAll: replaceClipboardHistory,
  }
}
