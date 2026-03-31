import { useDeferredValue, useEffect, useState } from 'react'
import { AccountPanel } from '../components/AccountPanel'
import { ClipboardList } from '../components/ClipboardList'
import { Header } from '../components/Header'
import { NotesWorkspace } from '../components/NotesWorkspace'
import { PremiumPanelsView } from '../components/PremiumPanelsView'
import { SettingsPanel } from '../components/SettingsPanel'
import { Shell } from '../components/Shell'
import type { NoteItem } from '../features/notes/types'
import { useAuthSession } from '../hooks/useAuthSession'
import { useClipboardHistory } from '../hooks/useClipboardHistory'
import { useCloudSync } from '../hooks/useCloudSync'
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
  const { notes, isReady: notesReady, setNotes, updateNotes } = useNotesStore()
  const auth = useAuthSession()

  useEffect(() => {
    applyPlatformTheme(platform, settings.themeTreatment)
  }, [platform, settings.themeTreatment])

  const {
    items,
    isReady: historyReady,
    copyItem,
    deleteItem,
    clearAll,
    replaceAll: replaceClipboardItems,
  } = useClipboardHistory(settings.clipboardHistoryLimit)

  const sidebar = useSidebarController(settings, updatePartialSettings, settingsReady)

  const sync = useCloudSync({
    user: auth.user,
    settingsReady,
    notesReady,
    clipboardReady: historyReady,
    settings,
    notes,
    clipboardItems: items,
    applySettings: updateSettings,
    applyNotes: setNotes,
    applyClipboardItems: replaceClipboardItems,
  })

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
      isPinned={settings.pinOpen}
      onPointerEnter={sidebar.scheduleOpen}
      onPointerLeave={sidebar.scheduleClose}
    >
      <div className="sidebar-surface">
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
            <div className="content-stack content-stack--settings">
              <AccountPanel
                user={auth.user}
                authReady={auth.isReady}
                authAvailable={auth.isAvailable}
                authStatus={auth.status}
                syncStatus={sync.status}
                syncMessage={sync.message}
                onSignIn={() => void auth.signIn()}
                onSignOut={() => void auth.signOut()}
              />
              <SettingsPanel
                settings={settings}
                onChange={updateSettings}
                onClose={sidebar.closeSettings}
              />
            </div>
          ) : activeMode === 'notes' ? (
            <div className="content-stack content-stack--with-account">
              <AccountPanel
                user={auth.user}
                authReady={auth.isReady}
                authAvailable={auth.isAvailable}
                authStatus={auth.status}
                syncStatus={sync.status}
                syncMessage={sync.message}
                onSignIn={() => void auth.signIn()}
                onSignOut={() => void auth.signOut()}
              />
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
            </div>
          ) : activeMode === 'clipboard' ? (
            <div className="content-stack content-stack--with-account">
              <AccountPanel
                user={auth.user}
                authReady={auth.isReady}
                authAvailable={auth.isAvailable}
                authStatus={auth.status}
                syncStatus={sync.status}
                syncMessage={sync.message}
                onSignIn={() => void auth.signIn()}
                onSignOut={() => void auth.signOut()}
              />
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
            </div>
          ) : (
            <PremiumPanelsView />
          )}
        </div>
      </div>
    </Shell>
  )
}
