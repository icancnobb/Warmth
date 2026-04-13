const APP_KEY_PREFIX = 'warmth.v2'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readFromStore<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(`${APP_KEY_PREFIX}.${key}`)
    if (!raw) {
      return fallback
    }

    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeToStore<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return
  }

  try {
    window.localStorage.setItem(`${APP_KEY_PREFIX}.${key}`, JSON.stringify(value))
  } catch {
    // Ignore quota and serialization errors for resilience.
  }
}
