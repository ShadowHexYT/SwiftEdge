import { startTransition, useEffect, useEffectEvent, useRef, useState } from 'react'
import { registerSidebarShortcut, syncLaunchOnStartup } from '../services/desktopControls'
import { syncSidebarWindow } from '../services/desktop'
import type { AppSettings } from '../types/settings'

export function useSidebarController(
  settings: AppSettings,
  updatePartialSettings: (partial: Partial<AppSettings>) => void,
  isReady: boolean,
) {
  const [isOpen, setIsOpen] = useState(settings.pinOpen)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const openTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)
  const syncedWindowState = useRef('')

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

    const nextWindowState = JSON.stringify({
      edgeSide: settings.edgeSide,
      sidebarWidth: settings.sidebarWidth,
      isOpen: settings.pinOpen || isOpen,
    })

    if (syncedWindowState.current === nextWindowState) {
      return
    }

    syncedWindowState.current = nextWindowState
    const timeoutId = window.setTimeout(() => {
      void syncSidebarWindow(JSON.parse(nextWindowState) as {
        edgeSide: AppSettings['edgeSide']
        sidebarWidth: number
        isOpen: boolean
      })
    }, 16)

    return () => {
      window.clearTimeout(timeoutId)
    }
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

    void syncLaunchOnStartup(settings.launchOnStartup)
  }, [isReady, settings.launchOnStartup])

  useEffect(() => {
    let cleanup: () => void = () => {}

    async function registerShortcut() {
      cleanup = await registerSidebarShortcut(() => {
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
      cleanup()
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
