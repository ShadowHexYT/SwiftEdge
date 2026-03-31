export type PremiumPanelTemplate = {
  id: string
  label: string
  url: string
}

export const savedPanelTemplates: PremiumPanelTemplate[] = [
  { id: 'x', label: 'Twitter / X', url: 'https://x.com' },
  { id: 'instagram', label: 'Instagram', url: 'https://instagram.com' },
  { id: 'reddit', label: 'Reddit', url: 'https://reddit.com' },
  { id: 'youtube', label: 'YouTube', url: 'https://youtube.com' },
]
