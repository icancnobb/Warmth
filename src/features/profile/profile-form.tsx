'use client'

import { usePersistentState } from '@/hooks/use-persistent-state'
import { DEFAULT_PROFILE, PROFILE_KEY } from './types'

export default function ProfileForm() {
  const { state: profile, setState: setProfile, hydrated } = usePersistentState(PROFILE_KEY, DEFAULT_PROFILE)

  function patchProfile(key: keyof typeof profile, value: string) {
    setProfile({ ...profile, [key]: value })
  }

  return (
    <section className="card stack">
      <h2>Personal Baseline</h2>
      <label className="stack">
        <span>Display name</span>
        <input
          value={profile.displayName}
          maxLength={40}
          onChange={(event) => patchProfile('displayName', event.target.value)}
        />
      </label>
      <label className="stack">
        <span>Birthday</span>
        <input value={profile.birthday} type="date" onChange={(event) => patchProfile('birthday', event.target.value)} />
      </label>
      <label className="stack">
        <span>Pronouns</span>
        <input
          value={profile.pronouns}
          maxLength={40}
          placeholder="she/her, he/him, they/them..."
          onChange={(event) => patchProfile('pronouns', event.target.value)}
        />
      </label>
      <label className="stack">
        <span>Signature</span>
        <textarea
          rows={4}
          maxLength={200}
          placeholder="How do you want Warmth to support you when things are hard?"
          value={profile.signature}
          onChange={(event) => patchProfile('signature', event.target.value)}
        />
      </label>
      <p className="muted">{hydrated ? 'Profile autosaves locally.' : 'Loading profile...'}</p>
    </section>
  )
}
