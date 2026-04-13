export const JOURNAL_ENTRIES_KEY = 'journal.entries'

export type JournalMood = 'Great' | 'Calm' | 'Okay' | 'Low' | 'Stressed'

export type JournalEntry = {
  id: string
  date: string
  mood: JournalMood
  note: string
  createdAt: number
  updatedAt: number
}

export const JOURNAL_MOODS: JournalMood[] = ['Great', 'Calm', 'Okay', 'Low', 'Stressed']
