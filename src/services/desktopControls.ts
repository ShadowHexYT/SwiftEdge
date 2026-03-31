import { isTauriRuntime } from './runtime'

type ShortcutCleanup = () => void

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
    await plugin.unregisterAll()
    await plugin.register('CommandOrControl+Shift+Space', (event) => {
      if (event.state === 'Pressed') {
        toggle()
      }
    })

    return () => {
      void plugin.unregisterAll()
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
