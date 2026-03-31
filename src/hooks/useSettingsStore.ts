import { useEffect, useState } from 'react'
import { readStoredValue, writeStoredValue } from '../services/storage'
import type { AppSettings } from '../types/settings'
import { defaultSettings } from '../types/settings'

export function useSettingsStore() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      const stored = await readStoredValue<AppSettings>('settings.json', 'app-settings')
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

    const timeoutId = window.setTimeout(() => {
      void writeStoredValue('settings.json', 'app-settings', settings)
    }, 120)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isReady, settings])

  return {
    settings,
    isReady,
    updateSettings: setSettings,
    updatePartialSettings: (partial: Partial<AppSettings>) =>
      setSettings((current) => ({ ...current, ...partial })),
  }
}
