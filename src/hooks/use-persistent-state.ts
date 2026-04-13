'use client'

import { useEffect, useState } from 'react'
import { readFromStore, writeToStore } from '@/lib/storage'

export function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(initialValue)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = readFromStore<T>(key, initialValue)
    setState(stored)
    setHydrated(true)
  }, [key, initialValue])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    writeToStore(key, state)
  }, [hydrated, key, state])

  return { state, setState, hydrated }
}
