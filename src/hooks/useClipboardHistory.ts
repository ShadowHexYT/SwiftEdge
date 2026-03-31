import { useEffect, useEffectEvent, useState } from 'react'
import {
  clearClipboardHistory,
  copyClipboardItem,
  deleteClipboardItem,
  getClipboardHistory,
  replaceClipboardHistory,
  setClipboardHistoryLimit,
  subscribeClipboardUpdates,
} from '../services/desktop'
import type { ClipboardItem } from '../features/clipboard/types'

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

      unlisten = await subscribeClipboardUpdates((nextItems) => {
        applyItems(nextItems)
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
