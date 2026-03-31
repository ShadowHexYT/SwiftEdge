import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import type { AuthStatus, AuthUser } from '../features/auth/types'
import { getFirebaseServices, isFirebaseConfigured } from '../services/firebase'

export function useAuthSession() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [status, setStatus] = useState<AuthStatus>('idle')
  const isAvailable = isFirebaseConfigured()

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false

    async function bootstrap() {
      if (!isAvailable) {
        setStatus('signed-out')
        setIsReady(true)
        return
      }

      const services = await getFirebaseServices()
      if (!services || cancelled) {
        setIsReady(true)
        return
      }

      unsubscribe = onAuthStateChanged(services.auth, (nextUser) => {
        setUser(
          nextUser
            ? {
                uid: nextUser.uid,
                email: nextUser.email,
                displayName: nextUser.displayName,
                photoURL: nextUser.photoURL,
              }
            : null,
        )
        setStatus(nextUser ? 'signed-in' : 'signed-out')
        setIsReady(true)
      })
    }

    void bootstrap()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [isAvailable])

  return {
    user,
    isReady,
    isAvailable,
    status,
    signIn: async () => {
      const services = await getFirebaseServices()
      if (!services) {
        return
      }

      setStatus('signing-in')
      try {
        await signInWithPopup(services.auth, services.provider)
      } catch (error) {
        console.error(error)
        setStatus('error')
      }
    },
    signOut: async () => {
      const services = await getFirebaseServices()
      if (!services) {
        return
      }

      await signOut(services.auth)
      setStatus('signed-out')
    },
  }
}
