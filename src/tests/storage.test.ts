import { afterEach, describe, expect, it } from 'vitest'
import { readFromStore, writeToStore } from '@/lib/storage'

afterEach(() => {
  if (typeof window !== 'undefined') {
    window.localStorage.clear()
  }
})

describe('storage helpers', () => {
  it('writes and reads JSON values', () => {
    writeToStore('unit.sample', { count: 2 })
    const value = readFromStore('unit.sample', { count: 0 })
    expect(value.count).toBe(2)
  })

  it('returns fallback when key is missing', () => {
    const value = readFromStore('unit.missing', ['fallback'])
    expect(value[0]).toBe('fallback')
  })
})
