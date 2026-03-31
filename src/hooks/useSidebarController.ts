import { startTransition, useEffect, useEffectEvent, useRef, useState } from 'react'
import { disable as disableAutostart, enable as enableAutostart, isEnabled as isAutostartEnabled } from '@tauri-apps/plugin-autostart'
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut'
import { syncSidebarWindow } from '../services/desktop'
import type { AppSettings } from '../types/settings'

const TOGGLE_SHORTCUT = 'CommandOrControl+Shift+Space'

export function useSidebarController(
  settings: AppSettings,
  updatePartialSettings: (partial: Partial<AppSettings>) => void,
  isReady: boolean,
) {
  const [isOpen, setIsOpen] = useState(settings.pinOpen)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const openTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)

  const clearTimers = useEffectEvent(() => {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current)
      openTimer.current = null
    }
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  })

  const commitOpenState = useEffectEvent((nextOpen: boolean) => {
    startTransition(() => {
      setIsOpen(nextOpen)
    })
  })

  const scheduleOpen = useEffectEvent(() => {
    clearTimers()
    if (settings.pinOpen) {
      commitOpenState(true)
      return
    }

    openTimer.current = window.setTimeout(() => {
      commitOpenState(true)
    }, settings.hoverDelayMs)
  })

  const scheduleClose = useEffectEvent(() => {
    clearTimers()
    if (settings.pinOpen) {
      commitOpenState(true)
      return
    }

    closeTimer.current = window.setTimeout(() => {
      setSettingsOpen(false)
      commitOpenState(false)
    }, 120)
  })

  useEffect(() => {
    if (!isReady) {
      return
    }

    void syncSidebarWindow({
      edgeSide: settings.edgeSide,
      sidebarWidth: settings.sidebarWidth,
      isOpen: settings.pinOpen || isOpen,
    })
  }, [isOpen, isReady, settings.edgeSide, settings.pinOpen, settings.sidebarWidth])

  useEffect(() => {
    if (!isReady) {
      return
    }

    if (settings.pinOpen) {
      setIsOpen(true)
    }
  }, [isReady, settings.pinOpen])

  useEffect(() => {
    if (!isReady) {
      return
    }

    async function syncAutostartPreference() {
      const enabled = await isAutostartEnabled()
      if (settings.launchOnStartup && !enabled) {
        await enableAutostart()
      }
      if (!settings.launchOnStartup && enabled) {
        await disableAutostart()
      }
    }

    void syncAutostartPreference()
  }, [isReady, settings.launchOnStartup])

  useEffect(() => {
    let disposed = false

    async function registerShortcut() {
      await unregisterAll()
      await register(TOGGLE_SHORTCUT, (event) => {
        if (event.state !== 'Pressed' || disposed) {
          return
        }

        startTransition(() => {
          setSettingsOpen(false)
          setIsOpen((current) => !current)
        })
      })
    }

    if (isReady) {
      void registerShortcut()
    }

    return () => {
      disposed = true
      void unregisterAll()
    }
  }, [isReady])

  return {
    isOpen: settings.pinOpen || isOpen,
    settingsOpen,
    openSettings: () => {
      setSettingsOpen(true)
      setIsOpen(true)
    },
    closeSettings: () => setSettingsOpen(false),
    togglePin: () => updatePartialSettings({ pinOpen: !settings.pinOpen }),
    scheduleOpen,
    scheduleClose,
  }
}
