import type { AuthStatus, AuthUser, SyncStatus } from '../features/auth/types'

type AccountPanelProps = {
  user: AuthUser | null
  authReady: boolean
  authAvailable: boolean
  authStatus: AuthStatus
  syncStatus: SyncStatus
  syncMessage: string
  onSignIn: () => void
  onSignOut: () => void
}

function initialsForUser(user: AuthUser | null) {
  if (!user?.displayName) {
    return 'G'
  }

  return user.displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AccountPanel({
  user,
  authReady,
  authAvailable,
  authStatus,
  syncStatus,
  syncMessage,
  onSignIn,
  onSignOut,
}: AccountPanelProps) {
  return (
    <section className="account-panel">
      <div className="account-panel__summary">
        <div className="account-avatar">
          {user?.photoURL ? <img src={user.photoURL} alt="" /> : <span>{initialsForUser(user)}</span>}
        </div>

        <div className="account-panel__copy">
          <div className="section-heading__eyebrow">Google Sync</div>
          {user ? (
            <>
              <div className="account-panel__name">{user.displayName ?? 'Signed in'}</div>
              <div className="account-panel__email">{user.email}</div>
            </>
          ) : (
            <>
              <div className="account-panel__name">Keep notes and clipboard in sync</div>
              <div className="account-panel__email">
                Sign in with Google to move your workspace between desktops.
              </div>
            </>
          )}
        </div>
      </div>

      <div className="account-panel__actions">
        <div className="sync-chip" data-status={syncStatus}>
          {authAvailable ? syncMessage : 'Add Firebase config to enable sync'}
        </div>

        {!authAvailable ? null : user ? (
          <button type="button" className="ghost-button" onClick={onSignOut}>
            Sign out
          </button>
        ) : (
          <button
            type="button"
            className="ghost-button"
            onClick={onSignIn}
            disabled={!authReady || authStatus === 'signing-in'}
          >
            {authStatus === 'signing-in' ? 'Connecting…' : 'Sign in with Google'}
          </button>
        )}
      </div>
    </section>
  )
}
