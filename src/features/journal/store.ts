import { readFromStore, writeToStore } from '@/lib/storage'
import { JOURNAL_ENTRIES_KEY, type JournalEntry } from './types'

export function readJournalEntries() {
  return readFromStore<JournalEntry[]>(JOURNAL_ENTRIES_KEY, [])
}

export function writeJournalEntries(entries: JournalEntry[]) {
  writeToStore(JOURNAL_ENTRIES_KEY, entries)
}
