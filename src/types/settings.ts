export type EdgeSide = 'left' | 'right'
export type ThemeTreatment = 'system' | 'windows' | 'macos'
export type SidebarMode = 'notes' | 'clipboard' | 'panels'

export type AppSettings = {
  edgeSide: EdgeSide
  hoverDelayMs: number
  sidebarWidth: number
  launchOnStartup: boolean
  pinOpen: boolean
  themeTreatment: ThemeTreatment
  clipboardHistoryLimit: number
}

export type SidebarWindowState = Pick<AppSettings, 'edgeSide' | 'sidebarWidth'> & {
  hoverDelayMs: number
  isOpen: boolean
}

export const defaultSettings: AppSettings = {
  edgeSide: 'right',
  hoverDelayMs: 120,
  sidebarWidth: 392,
  launchOnStartup: false,
  pinOpen: false,
  themeTreatment: 'system',
  clipboardHistoryLimit: 80,
}
