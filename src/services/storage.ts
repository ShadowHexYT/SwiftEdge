import { isTauriRuntime } from './runtime'

type TauriStoreModule = typeof import('@tauri-apps/plugin-store')
type TauriLazyStore = InstanceType<TauriStoreModule['LazyStore']>

let pluginStorePromise: Promise<TauriStoreModule> | null = null
const storeCache = new Map<string, TauriLazyStore>()

async function getStore(path: string) {
  if (!pluginStorePromise) {
    pluginStorePromise = import('@tauri-apps/plugin-store')
  }

  const module = await pluginStorePromise
  const cachedStore = storeCache.get(path)
  if (cachedStore) {
    return cachedStore
  }

  const store = new module.LazyStore(path)
  storeCache.set(path, store)
  return store
}

async function readFromTauriStore<T>(path: string, key: string) {
  const store = await getStore(path)
  return store.get<T>(key)
}

async function writeToTauriStore<T>(path: string, key: string, value: T) {
  const store = await getStore(path)
  await store.set(key, value)
}

export async function readStoredValue<T>(path: string, key: string) {
  if (isTauriRuntime()) {
    return readFromTauriStore<T>(path, key)
  }

  const raw = window.localStorage.getItem(`${path}:${key}`)
  return raw ? (JSON.parse(raw) as T) : null
}

export async function writeStoredValue<T>(path: string, key: string, value: T) {
  if (isTauriRuntime()) {
    await writeToTauriStore(path, key, value)
    return
  }

  window.localStorage.setItem(`${path}:${key}`, JSON.stringify(value))
}
