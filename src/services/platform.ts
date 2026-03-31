import type { ThemeTreatment } from '../types/settings'

export type PlatformFlavor = 'macos' | 'windows'

export function getPlatformFlavor(): PlatformFlavor {
  return navigator.userAgent.includes('Mac') ? 'macos' : 'windows'
}

export function applyPlatformTheme(platform: PlatformFlavor, treatment: ThemeTreatment) {
  const resolvedTheme = treatment === 'system' ? platform : treatment
  document.documentElement.dataset.platform = platform
  document.documentElement.dataset.theme = resolvedTheme
}
