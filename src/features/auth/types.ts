export type AuthUser = {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export type AuthStatus = 'idle' | 'signing-in' | 'signed-in' | 'signed-out' | 'error'

export type SyncStatus = 'offline' | 'ready' | 'syncing' | 'synced' | 'error'
