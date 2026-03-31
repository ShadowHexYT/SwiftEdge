import { isTauriRuntime } from './runtime'

type ShortcutCleanup = () => void
type FocusCleanup = () => void

export async function syncLaunchOnStartup(enabled: boolean) {
  if (!isTauriRuntime()) {
    return
  }

  const plugin = await import('@tauri-apps/plugin-autostart')
  const isEnabled = await plugin.isEnabled()

  if (enabled && !isEnabled) {
    await plugin.enable()
  }

  if (!enabled && isEnabled) {
    await plugin.disable()
  }
}

export async function registerSidebarShortcut(toggle: () => void): Promise<ShortcutCleanup> {
  if (isTauriRuntime()) {
    const plugin = await import('@tauri-apps/plugin-global-shortcut')
    const accelerator = 'CommandOrControl+Shift+Space'

    try {
      const isRegistered = await plugin.isRegistered(accelerator)
      if (!isRegistered) {
        await plugin.register(accelerator, (event) => {
          if (event.state === 'Pressed') {
            toggle()
          }
        })
      }
    } catch (error) {
      console.warn('[SwiftEdge] Global shortcut unavailable:', error)
      return () => {}
    }

    return () => {
      void plugin.unregister(accelerator).catch(() => {})
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const isModifierPressed = navigator.userAgent.includes('Mac')
      ? event.metaKey
      : event.ctrlKey
    if (isModifierPressed && event.shiftKey && event.code === 'Space') {
      event.preventDefault()
      toggle()
    }
  }

  window.addEventListener('keydown', onKeyDown)
  return () => {
    window.removeEventListener('keydown', onKeyDown)
  }
}

export async function registerSidebarFocusListener(
  onFocusChanged: (focused: boolean) => void,
): Promise<FocusCleanup> {
  if (isTauriRuntime()) {
    const windowModule = await import('@tauri-apps/api/window')
    const currentWindow = windowModule.getCurrentWindow()
    return currentWindow.onFocusChanged(({ payload }) => {
      onFocusChanged(payload)
    })
  }

  const onFocus = () => onFocusChanged(true)
  const onBlur = () => onFocusChanged(false)
  window.addEventListener('focus', onFocus)
  window.addEventListener('blur', onBlur)
  return () => {
    window.removeEventListener('focus', onFocus)
    window.removeEventListener('blur', onBlur)
  }
}
