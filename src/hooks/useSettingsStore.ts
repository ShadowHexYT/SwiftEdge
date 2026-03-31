import { useEffect, useState } from 'react'
import { LazyStore } from '@tauri-apps/plugin-store'
import type { AppSettings } from '../types/settings'
import { defaultSettings } from '../types/settings'

const settingsStore = new LazyStore('settings.json')

export function useSettingsStore() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      const stored = await settingsStore.get<AppSettings>('app-settings')
      if (cancelled) {
        return
      }

      if (stored) {
        setSettings({ ...defaultSettings, ...stored })
      }
      setIsReady(true)
    }

    void loadSettings()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isReady) {
      return
    }

    void settingsStore.set('app-settings', settings)
  }, [isReady, settings])

  return {
    settings,
    isReady,
    updateSettings: setSettings,
    updatePartialSettings: (partial: Partial<AppSettings>) =>
      setSettings((current) => ({ ...current, ...partial })),
  }
}
