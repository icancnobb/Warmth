'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { usePersistentState } from '@/hooks/use-persistent-state'
import { CHAT_HISTORY_KEY } from '@/features/chat/types'
import { DRAW_ARTWORKS_KEY } from '@/features/draw/types'
import { JOURNAL_ENTRIES_KEY, type JournalEntry } from '@/features/journal/types'
import { PROFILE_KEY, type UserProfile } from '@/features/profile/types'

export default function HomeDashboard() {
  const { state: entries, hydrated: entriesReady } = usePersistentState<JournalEntry[]>(JOURNAL_ENTRIES_KEY, [])
  const { state: chats, hydrated: chatsReady } = usePersistentState(CHAT_HISTORY_KEY, [])
  const { state: artworks, hydrated: artworksReady } = usePersistentState(DRAW_ARTWORKS_KEY, [])
  const { state: profile, hydrated: profileReady } = usePersistentState<UserProfile>(PROFILE_KEY, {
    displayName: '',
    birthday: '',
    pronouns: '',
    signature: '',
  })

  const latestMood = useMemo(() => {
    if (!entriesReady || entries.length === 0) {
      return 'No mood logged yet'
    }

    const latest = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0]
    return `${latest.mood} on ${latest.date}`
  }, [entries, entriesReady])

  const isReady = entriesReady && chatsReady && artworksReady && profileReady

  return (
    <div className="grid grid-2">
      <article className="card">
        <h2>Quick Status</h2>
        {!isReady ? (
          <p className="muted">Loading your local data...</p>
        ) : (
          <>
            <div className="stat">
              <span>Journal entries</span>
              <span className="stat-value">{entries.length}</span>
            </div>
            <div className="stat">
              <span>Chat turns</span>
              <span className="stat-value">{chats.length}</span>
            </div>
            <div className="stat">
              <span>Saved artworks</span>
              <span className="stat-value">{artworks.length}</span>
            </div>
            <div className="stat">
              <span>Latest mood</span>
              <span className="stat-value">{latestMood}</span>
            </div>
            <div className="stat">
              <span>Profile name</span>
              <span className="stat-value">{profile.displayName || 'Not set'}</span>
            </div>
          </>
        )}
      </article>

      <article className="card stack">
        <h2>Focus Actions</h2>
        <Link href="/journal" className="badge">
          Write today&apos;s entry
        </Link>
        <Link href="/chat" className="badge">
          Check in with Warmth
        </Link>
        <Link href="/draw" className="badge">
          Draw for 5 minutes
        </Link>
        <Link href="/profile" className="badge">
          Update personal baseline
        </Link>
      </article>

      <article className="card">
        <h3>How this rebuild is structured</h3>
        <ul className="note-list">
          <li>App routes only compose pages and keep business logic out.</li>
          <li>Each feature owns types, storage keys, and UI interactions.</li>
          <li>A shared persistence hook syncs state to browser storage.</li>
        </ul>
      </article>

      <article className="card">
        <h3>Design Intent</h3>
        <p className="muted">
          Warmth v2 favors clarity and emotional calm: fewer moving parts, explicit modules,
          and direct workflows you can evolve later.
        </p>
      </article>
    </div>
  )
}
