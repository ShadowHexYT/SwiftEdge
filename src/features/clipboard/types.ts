export type ClipboardItemKind = 'text' | 'image'

export type ClipboardItem = {
  id: string
  kind: ClipboardItemKind
  preview: string
  createdAt: number
  searchText: string
  textValue: string | null
  imageDataUrl: string | null
  imageWidth: number | null
  imageHeight: number | null
}
