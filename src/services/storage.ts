import { isTauriRuntime } from './runtime'

async function readFromTauriStore<T>(path: string, key: string) {
  const { LazyStore } = await import('@tauri-apps/plugin-store')
  const store = new LazyStore(path)
  return store.get<T>(key)
}

async function writeToTauriStore<T>(path: string, key: string, value: T) {
  const { LazyStore } = await import('@tauri-apps/plugin-store')
  const store = new LazyStore(path)
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
