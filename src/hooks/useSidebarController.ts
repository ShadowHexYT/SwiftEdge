import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { subscribeSidebarOpenRequests, syncSidebarWindow } from '../services/desktop'
import {
  configureNativeMacShell,
  focusSidebarWindow,
  registerSidebarFocusListener,
  registerSidebarShortcut,
  syncNativePanelInteractivity,
  syncLaunchOnStartup,
} from '../services/desktopControls'
import type { AppSettings } from '../types/settings'

type PanelState = 'collapsed' | 'opening' | 'expanded' | 'closing'

const PANEL_CLOSE_DELAY_MS = 110
const PANEL_MOTION_DURATION_MS = 160
const MAX_EFFECTIVE_HOVER_DELAY_MS = 90
const NATIVE_EDGE_IDLE_CLOSE_MS = 420

export function useSidebarController(
  settings: AppSettings,
  updatePartialSettings: (partial: Partial<AppSettings>) => void,
  isReady: boolean,
) {
  const [panelState, setPanelState] = useState<PanelState>(
    settings.pinOpen ? 'expanded' : 'collapsed',
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const shellRef = useRef<HTMLElement | null>(null)
  const openTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)
  const motionTimer = useRef<number | null>(null)
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
    if (motionTimer.current !== null) {
      window.clearTimeout(motionTimer.current)
      motionTimer.current = null
    }
  })

  const finishExpanded = useEffectEvent(() => {
    motionTimer.current = window.setTimeout(() => {
      setPanelState('expanded')
      motionTimer.current = null
    }, PANEL_MOTION_DURATION_MS)
  })

  const requestOpen = useEffectEvent(() => {
    clearTimers()

    setPanelState((current) => {
      if (current === 'expanded' || current === 'opening') {
        return current
      }
      return 'opening'
    })
    finishExpanded()
  })

  const requestOpenFromNativeEdge = useEffectEvent(() => {
    if (settings.pinOpen) {
      requestOpen()
      return
    }

    isPointerInside.current = false
    requestOpen()

    closeTimer.current = window.setTimeout(() => {
      if (!isPointerInside.current && !isWindowFocused.current) {
        collapseSidebar()
      }
    }, NATIVE_EDGE_IDLE_CLOSE_MS)
  })

  const collapseSidebar = useEffectEvent(() => {
    if (settings.pinOpen) {
      requestOpen()
      return
    }

    clearTimers()
    setSettingsOpen(false)
    setPanelState((current) => {
      if (current === 'collapsed' || current === 'closing') {
        return current
      }
      return 'closing'
    })
    motionTimer.current = window.setTimeout(() => {
      setPanelState('collapsed')
      motionTimer.current = null
    }, PANEL_MOTION_DURATION_MS)
  })

  const scheduleOpen = useEffectEvent(() => {
    if (settings.pinOpen) {
      requestOpen()
      return
    }

    if (panelState === 'expanded' || panelState === 'opening') {
      clearTimers()
      return
    }

    clearTimers()
    openTimer.current = window.setTimeout(() => {
      requestOpen()
    }, Math.min(Math.max(0, settings.hoverDelayMs), MAX_EFFECTIVE_HOVER_DELAY_MS))
  })

  const scheduleClose = useEffectEvent(() => {
    if (settings.pinOpen) {
      requestOpen()
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

  const isVisible = panelState !== 'collapsed'

  useEffect(() => {
    if (!isReady) {
      return
    }

    const nextWindowState = JSON.stringify({
      edgeSide: settings.edgeSide,
      sidebarWidth: settings.sidebarWidth,
      hoverDelayMs: settings.hoverDelayMs,
      isOpen: settings.pinOpen || isVisible,
    })

    if (syncedWindowState.current === nextWindowState) {
      return
    }

    syncedWindowState.current = nextWindowState
    void syncSidebarWindow(JSON.parse(nextWindowState) as {
      edgeSide: AppSettings['edgeSide']
      sidebarWidth: number
      hoverDelayMs: number
      isOpen: boolean
    })
  }, [
    isReady,
    isVisible,
    settings.edgeSide,
    settings.hoverDelayMs,
    settings.pinOpen,
    settings.sidebarWidth,
  ])

  useEffect(() => {
    if (!isReady) {
      return
    }

    if (settings.pinOpen) {
      clearTimers()
      setPanelState('expanded')
      return
    }

    setPanelState('collapsed')
  }, [clearTimers, isReady, settings.pinOpen])

  useEffect(() => {
    if (!isReady) {
      return
    }

    void configureNativeMacShell()
  }, [isReady])

  useEffect(() => {
    if (!isReady) {
      return
    }

    const interactive = settings.pinOpen || panelState !== 'collapsed'
    void syncNativePanelInteractivity(interactive)
  }, [isReady, panelState, settings.pinOpen])

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

        if (settings.pinOpen || panelState !== 'collapsed') {
          collapseSidebar()
          return
        }

        requestOpen()
        void focusSidebarWindow()
      })
    }

    if (isReady) {
      void registerShortcut()
    }

    return () => {
      cleanup()
    }
  }, [collapseSidebar, isReady, panelState, requestOpen, settings.pinOpen])

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

  useEffect(() => {
    if (!isReady) {
      return
    }

    let cleanup: () => void = () => {}

    void subscribeSidebarOpenRequests(() => {
      requestOpenFromNativeEdge()
    }).then((nextCleanup) => {
      cleanup = nextCleanup
    })

    return () => {
      cleanup()
    }
  }, [isReady, requestOpenFromNativeEdge])

  useEffect(() => {
    if (!isReady) {
      return
    }

    const onPointerDown = (event: PointerEvent) => {
      if (settings.pinOpen || !shellRef.current) {
        return
      }

      if (!shellRef.current.contains(event.target as Node)) {
        isPointerInside.current = false
        collapseSidebar()
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !settings.pinOpen) {
        collapseSidebar()
      }
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [collapseSidebar, isReady, settings.pinOpen])

  return {
    shellRef,
    panelState,
    isExpanded: settings.pinOpen || isVisible,
    isOpen: settings.pinOpen || panelState === 'expanded' || panelState === 'opening',
    settingsOpen,
    openSettings: () => {
      setSettingsOpen(true)
      requestOpen()
      void focusSidebarWindow()
    },
    closeSettings: () => setSettingsOpen(false),
    togglePin: () => updatePartialSettings({ pinOpen: !settings.pinOpen }),
    openImmediately: () => {
      isPointerInside.current = true
      requestOpen()
      void focusSidebarWindow()
    },
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
