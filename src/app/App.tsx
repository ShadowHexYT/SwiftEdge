import { useDeferredValue, useEffect, useState } from 'react'
import { ClipboardList } from '../components/ClipboardList'
import { Header } from '../components/Header'
import { NotesWorkspace } from '../components/NotesWorkspace'
import { PremiumPanelsView } from '../components/PremiumPanelsView'
import { SettingsPanel } from '../components/SettingsPanel'
import { Shell } from '../components/Shell'
import type { NoteItem } from '../features/notes/types'
import { useClipboardHistory } from '../hooks/useClipboardHistory'
import { useNotesStore } from '../hooks/useNotesStore'
import { useSettingsStore } from '../hooks/useSettingsStore'
import { useSidebarController } from '../hooks/useSidebarController'
import { applyPlatformTheme, getPlatformFlavor } from '../services/platform'
import type { SidebarMode } from '../types/settings'

export function App() {
  const {
    settings,
    isReady: settingsReady,
    updateSettings,
    updatePartialSettings,
  } = useSettingsStore()
  const [searchQuery, setSearchQuery] = useState('')
  const deferredQuery = useDeferredValue(searchQuery)
  const [activeMode, setActiveMode] = useState<SidebarMode>('notes')
  const platform = getPlatformFlavor()
  const { notes, isReady: notesReady, updateNotes } = useNotesStore()

  useEffect(() => {
    applyPlatformTheme(platform, settings.themeTreatment)
  }, [platform, settings.themeTreatment])

  const {
    items,
    isReady: historyReady,
    copyItem,
    deleteItem,
    clearAll,
  } = useClipboardHistory(settings.clipboardHistoryLimit)

  const sidebar = useSidebarController(settings, updatePartialSettings, settingsReady)

  const query = deferredQuery.trim().toLowerCase()
  const filteredItems = !query
    ? items
    : items.filter(
        (item) => item.kind === 'text' && item.searchText.toLowerCase().includes(query),
      )

  function createNote() {
    const timestamp = Date.now()
    const newNote: NoteItem = {
      id: `${timestamp}`,
      title: 'Untitled note',
      body: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    updateNotes((currentNotes) => [newNote, ...currentNotes])
  }

  return (
    <Shell
      edgeSide={settings.edgeSide}
      isOpen={sidebar.isOpen}
      isExpanded={sidebar.isExpanded}
      isPinned={settings.pinOpen}
      sidebarWidth={settings.sidebarWidth}
      onPointerEnter={sidebar.scheduleOpen}
      onPointerLeave={sidebar.scheduleClose}
      onWidthChange={(width) => updatePartialSettings({ sidebarWidth: width })}
    >
      <Header
        activeMode={activeMode}
        onModeChange={setActiveMode}
        onOpenSettings={sidebar.openSettings}
        onTogglePin={sidebar.togglePin}
        isPinned={settings.pinOpen}
        isPremiumUnlocked={false}
      />

      <div className="content-stack">
        {sidebar.settingsOpen ? (
          <SettingsPanel
            settings={settings}
            onChange={updateSettings}
            onClose={sidebar.closeSettings}
          />
        ) : activeMode === 'notes' ? (
          <NotesWorkspace
            notes={notes}
            isReady={notesReady}
            onCreate={createNote}
            onDelete={(id) => {
              updateNotes((currentNotes) => currentNotes.filter((note) => note.id !== id))
            }}
            onUpdate={(id, patch) => {
              updateNotes((currentNotes) =>
                currentNotes.map((note) =>
                  note.id === id
                    ? { ...note, ...patch, updatedAt: Date.now() }
                    : note,
                ),
              )
            }}
          />
        ) : activeMode === 'clipboard' ? (
          <ClipboardList
            items={filteredItems}
            allItemsCount={items.length}
            isReady={settingsReady && historyReady}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onCopy={copyItem}
            onDelete={deleteItem}
            onClearAll={clearAll}
          />
        ) : (
          <PremiumPanelsView />
        )}
      </div>
    </Shell>
  )
}
