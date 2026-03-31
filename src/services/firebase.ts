import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
}

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every((value) => Boolean(value))
}

let firebaseSingleton:
  | {
      auth: ReturnType<typeof getAuth>
      db: ReturnType<typeof getFirestore>
      provider: GoogleAuthProvider
    }
  | null = null

export async function getFirebaseServices() {
  if (!isFirebaseConfigured()) {
    return null
  }

  if (firebaseSingleton) {
    return firebaseSingleton
  }

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  await setPersistence(auth, browserLocalPersistence)

  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  firebaseSingleton = {
    auth,
    db: getFirestore(app),
    provider,
  }

  return firebaseSingleton
}
