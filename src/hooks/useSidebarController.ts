import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { syncSidebarWindow } from '../services/desktop'
import {
  registerSidebarFocusListener,
  registerSidebarShortcut,
  syncLaunchOnStartup,
} from '../services/desktopControls'
import type { AppSettings } from '../types/settings'

const PANEL_CLOSE_DELAY_MS = 24
const PANEL_COLLAPSE_DELAY_MS = 148
const MAX_EFFECTIVE_HOVER_DELAY_MS = 64

export function useSidebarController(
  settings: AppSettings,
  updatePartialSettings: (partial: Partial<AppSettings>) => void,
  isReady: boolean,
) {
  const [isExpanded, setIsExpanded] = useState(settings.pinOpen)
  const [isOpen, setIsOpen] = useState(settings.pinOpen)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const openTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)
  const collapseTimer = useRef<number | null>(null)
  const syncedWindowState = useRef('')
  const isPointerInside = useRef(false)
  const isWindowFocused = useRef(false)

  const clearTimers = useEffectEvent(() => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current)
      openTimer.current = null
    }
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    if (collapseTimer.current !== null) {
      window.clearTimeout(collapseTimer.current)
      collapseTimer.current = null
    }
  })

  const expandWindow = useEffectEvent(() => {
    clearTimers()
    setIsExpanded(true)
  })

  const showPanel = useEffectEvent(() => {
    expandWindow()
    setIsOpen(true)
  })

  const collapseSidebar = useEffectEvent(() => {
    if (settings.pinOpen) {
      showPanel()
      return
    }

    clearTimers()
    setSettingsOpen(false)
    setIsOpen(false)
    collapseTimer.current = window.setTimeout(() => {
      setIsExpanded(false)
    }, PANEL_COLLAPSE_DELAY_MS)
  })

  const scheduleOpen = useEffectEvent(() => {
    if (settings.pinOpen) {
      showPanel()
      return
    }

    if (isExpanded || isOpen) {
      if (collapseTimer.current !== null) {
        window.clearTimeout(collapseTimer.current)
        collapseTimer.current = null
      }
      if (isExpanded && !isOpen) {
        setIsOpen(true)
      }
      return
    }

    clearTimers()
    openTimer.current = window.setTimeout(() => {
      showPanel()
    }, Math.min(Math.max(0, settings.hoverDelayMs), MAX_EFFECTIVE_HOVER_DELAY_MS))
  })

  const scheduleClose = useEffectEvent(() => {
    if (settings.pinOpen) {
      showPanel()
      return
    }

    clearTimers()
    closeTimer.current = window.setTimeout(() => {
      if (isPointerInside.current || isWindowFocused.current) {
        return
      }
      collapseSidebar()
    }, PANEL_CLOSE_DELAY_MS)
  })

  useEffect(() => {
    if (!isReady) {
      return
    }

    const nextWindowState = JSON.stringify({
      edgeSide: settings.edgeSide,
      sidebarWidth: settings.sidebarWidth,
      isOpen: settings.pinOpen || isExpanded,
    })

    if (syncedWindowState.current === nextWindowState) {
      return
    }

    syncedWindowState.current = nextWindowState
    void syncSidebarWindow(JSON.parse(nextWindowState) as {
      edgeSide: AppSettings['edgeSide']
      sidebarWidth: number
      isOpen: boolean
    })
  }, [isExpanded, isReady, settings.edgeSide, settings.pinOpen, settings.sidebarWidth])

  useEffect(() => {
    if (!isReady) {
      return
    }

    if (settings.pinOpen) {
      setIsExpanded(true)
      setIsOpen(true)
      return
    }

    setIsOpen(false)
    setIsExpanded(false)
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
        setSettingsOpen(false)

        if (settings.pinOpen || isExpanded) {
          collapseSidebar()
          return
        }

        showPanel()
      })
    }

    if (isReady) {
      void registerShortcut()
    }

    return () => {
      cleanup()
    }
  }, [collapseSidebar, isExpanded, isReady, settings.pinOpen, showPanel])

  useEffect(() => {
    if (!isReady) {
      return
    }

    let cleanup: () => void = () => {}

    void registerSidebarFocusListener((focused) => {
      isWindowFocused.current = focused

      if (focused) {
        clearTimers()
        return
      }

      if (!settings.pinOpen && !isPointerInside.current) {
        collapseSidebar()
      }
    }).then((nextCleanup) => {
      cleanup = nextCleanup
    })

    return () => {
      cleanup()
    }
  }, [clearTimers, collapseSidebar, isReady, settings.pinOpen])

  return {
    isExpanded: settings.pinOpen || isExpanded,
    isOpen: settings.pinOpen || isOpen,
    settingsOpen,
    openSettings: () => {
      setSettingsOpen(true)
      showPanel()
    },
    closeSettings: () => setSettingsOpen(false),
    togglePin: () => updatePartialSettings({ pinOpen: !settings.pinOpen }),
    scheduleOpen: () => {
      isPointerInside.current = true
      scheduleOpen()
    },
    scheduleClose: () => {
      isPointerInside.current = false
      scheduleClose()
    },
  }
}
