import { useEffect, useMemo, useRef, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import type { AuthUser, SyncStatus } from '../features/auth/types'
import type { ClipboardItem } from '../features/clipboard/types'
import type { NoteItem } from '../features/notes/types'
import { getFirebaseServices, isFirebaseConfigured } from '../services/firebase'
import type { CloudWorkspace } from '../types/cloud'
import type { AppSettings } from '../types/settings'

type UseCloudSyncOptions = {
  user: AuthUser | null
  settingsReady: boolean
  notesReady: boolean
  clipboardReady: boolean
  settings: AppSettings
  notes: NoteItem[]
  clipboardItems: ClipboardItem[]
  applySettings: (settings: AppSettings) => void
  applyNotes: (notes: NoteItem[]) => void
  applyClipboardItems: (items: ClipboardItem[]) => Promise<void>
}

function stableSignature(payload: CloudWorkspace) {
  return JSON.stringify({
    settings: payload.settings,
    notes: payload.notes,
    clipboardItems: payload.clipboardItems,
  })
}

export function useCloudSync({
  user,
  settingsReady,
  notesReady,
  clipboardReady,
  settings,
  notes,
  clipboardItems,
  applySettings,
  applyNotes,
  applyClipboardItems,
}: UseCloudSyncOptions) {
  const [status, setStatus] = useState<SyncStatus>('offline')
  const [message, setMessage] = useState('Local-only workspace')
  const remoteSignatureRef = useRef<string | null>(null)
  const hydrationFinishedRef = useRef(false)
  const localWorkspaceRef = useRef<CloudWorkspace | null>(null)
  const applySettingsRef = useRef(applySettings)
  const applyNotesRef = useRef(applyNotes)
  const applyClipboardItemsRef = useRef(applyClipboardItems)

  const localWorkspace = useMemo<CloudWorkspace>(
    () => ({
      settings,
      notes,
      clipboardItems,
      updatedAt: 0,
    }),
    [clipboardItems, notes, settings],
  )

  useEffect(() => {
    localWorkspaceRef.current = localWorkspace
  }, [localWorkspace])

  useEffect(() => {
    applySettingsRef.current = applySettings
  }, [applySettings])

  useEffect(() => {
    applyNotesRef.current = applyNotes
  }, [applyNotes])

  useEffect(() => {
    applyClipboardItemsRef.current = applyClipboardItems
  }, [applyClipboardItems])

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setStatus('offline')
      setMessage('Add Firebase env vars to enable Google sync')
      return
    }

    if (!user || !settingsReady || !notesReady || !clipboardReady) {
      setStatus(user ? 'ready' : 'offline')
      setMessage(user ? 'Preparing sync…' : 'Sign in to sync across machines')
      hydrationFinishedRef.current = false
      remoteSignatureRef.current = null
      return
    }

    let unsubscribe: (() => void) | undefined
    let cancelled = false

    async function subscribe() {
      const activeUser = user
      if (!activeUser) {
        return
      }

      const services = await getFirebaseServices()
      if (!services || cancelled) {
        return
      }

      const workspaceRef = doc(services.db, 'users', activeUser.uid, 'workspace', 'default')
      setStatus('ready')
      setMessage('Connected to Google account')

      unsubscribe = onSnapshot(
        workspaceRef,
        async (snapshot) => {
          if (!snapshot.exists()) {
            const initial = {
              ...(localWorkspaceRef.current ?? localWorkspace),
              updatedAt: Date.now(),
            }
            remoteSignatureRef.current = stableSignature(initial)
            hydrationFinishedRef.current = true
            setStatus('syncing')
            setMessage('Uploading workspace')
            await setDoc(workspaceRef, initial)
            setStatus('synced')
            setMessage('Workspace synced')
            return
          }

          const remoteWorkspace = snapshot.data() as CloudWorkspace
          const remoteSignature = stableSignature(remoteWorkspace)

          if (remoteSignatureRef.current === remoteSignature) {
            hydrationFinishedRef.current = true
            setStatus('synced')
            setMessage('Workspace synced')
            return
          }

          remoteSignatureRef.current = remoteSignature
          hydrationFinishedRef.current = true
          setStatus('syncing')
          setMessage('Applying cloud changes')
          applySettingsRef.current(remoteWorkspace.settings)
          applyNotesRef.current(remoteWorkspace.notes)
          await applyClipboardItemsRef.current(remoteWorkspace.clipboardItems)
          setStatus('synced')
          setMessage('Workspace synced')
        },
        (error) => {
          console.error(error)
          setStatus('error')
          setMessage('Sync failed. Check Firebase config and rules.')
        },
      )
    }

    void subscribe()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [
    clipboardReady,
    notesReady,
    settingsReady,
    user,
  ])

  useEffect(() => {
    if (!user || !hydrationFinishedRef.current || !settingsReady || !notesReady || !clipboardReady) {
      return
    }

    let cancelled = false

    async function pushWorkspace() {
      const activeUser = user
      if (!activeUser) {
        return
      }

      const services = await getFirebaseServices()
      if (!services || cancelled) {
        return
      }

      const workspaceRef = doc(services.db, 'users', activeUser.uid, 'workspace', 'default')
      const nextWorkspace = { ...localWorkspace, updatedAt: Date.now() }
      const nextSignature = stableSignature(nextWorkspace)

      if (remoteSignatureRef.current === nextSignature) {
        return
      }

      remoteSignatureRef.current = nextSignature
      setStatus('syncing')
      setMessage('Syncing changes…')
      await setDoc(workspaceRef, nextWorkspace)
      if (!cancelled) {
        setStatus('synced')
        setMessage('Workspace synced')
      }
    }

    void pushWorkspace()

    return () => {
      cancelled = true
    }
  }, [clipboardReady, localWorkspace, notesReady, settingsReady, user])

  return {
    status,
    message,
  }
}
