import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { syncSidebarWindow } from '../services/desktop'
import {
  registerSidebarShortcut,
  syncLaunchOnStartup,
} from '../services/desktopControls'
import type { AppSettings } from '../types/settings'

const PANEL_CLOSE_DELAY_MS = 120
const PANEL_HIDE_DURATION_MS = 110

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
    window.requestAnimationFrame(() => {
      setIsOpen(true)
    })
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
    }, PANEL_HIDE_DURATION_MS)
  })

  const scheduleOpen = useEffectEvent(() => {
    if (settings.pinOpen) {
      showPanel()
      return
    }

    clearTimers()
    openTimer.current = window.setTimeout(() => {
      showPanel()
    }, Math.max(0, settings.hoverDelayMs))
  })

  const scheduleClose = useEffectEvent(() => {
    if (settings.pinOpen) {
      showPanel()
      return
    }

    clearTimers()
    closeTimer.current = window.setTimeout(() => {
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
    scheduleOpen,
    scheduleClose,
  }
}
