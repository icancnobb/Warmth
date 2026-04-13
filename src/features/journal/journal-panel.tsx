'use client'

import { useMemo, useState } from 'react'
import { usePersistentState } from '@/hooks/use-persistent-state'
import { JOURNAL_ENTRIES_KEY, JOURNAL_MOODS, type JournalEntry, type JournalMood } from './types'

function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function JournalPanel() {
  const [date, setDate] = useState(todayISODate)
  const [mood, setMood] = useState<JournalMood>('Calm')
  const [note, setNote] = useState('')
  const { state: entries, setState: setEntries, hydrated } = usePersistentState<JournalEntry[]>(
    JOURNAL_ENTRIES_KEY,
    []
  )

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt),
    [entries]
  )

  const activeEntry = useMemo(() => entries.find((entry) => entry.date === date), [date, entries])

  function handleLoadCurrentDate() {
    if (!activeEntry) {
      setMood('Calm')
      setNote('')
      return
    }

    setMood(activeEntry.mood)
    setNote(activeEntry.note)
  }

  function handleSaveEntry() {
    const now = Date.now()
    const payload: JournalEntry = {
      id: activeEntry?.id ?? makeId(),
      date,
      mood,
      note: note.trim(),
      createdAt: activeEntry?.createdAt ?? now,
      updatedAt: now,
    }

    const next = entries.filter((entry) => entry.date !== date)
    next.push(payload)
    setEntries(next)
  }

  function handleDeleteEntry(id: string) {
    setEntries(entries.filter((entry) => entry.id !== id))
  }

  return (
    <div className="grid grid-2">
      <section className="card stack">
        <h2>Daily Check-in</h2>
        <label className="stack">
          <span>Date</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label className="stack">
          <span>Mood</span>
          <select value={mood} onChange={(event) => setMood(event.target.value as JournalMood)}>
            {JOURNAL_MOODS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="stack">
          <span>Note</span>
          <textarea
            rows={5}
            value={note}
            maxLength={300}
            placeholder="What mattered today?"
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <div className="inline">
          <button type="button" onClick={handleSaveEntry}>
            Save entry
          </button>
          <button type="button" className="secondary" onClick={handleLoadCurrentDate}>
            Load selected date
          </button>
        </div>
        <p className="muted">{hydrated ? 'Saved locally in your browser.' : 'Loading local state...'}</p>
      </section>

      <section className="card stack">
        <h2>Recent Entries</h2>
        {sortedEntries.length === 0 ? (
          <p className="muted">No entries yet.</p>
        ) : (
          sortedEntries.slice(0, 12).map((entry) => (
            <article key={entry.id} className="card" style={{ boxShadow: 'none' }}>
              <div className="inline" style={{ justifyContent: 'space-between' }}>
                <strong>{entry.date}</strong>
                <span className="badge">{entry.mood}</span>
              </div>
              <p>{entry.note || 'No note added.'}</p>
              <button type="button" className="ghost" onClick={() => handleDeleteEntry(entry.id)}>
                Delete
              </button>
            </article>
          ))
        )}
      </section>
    </div>
  )
}
