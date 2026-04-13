import { readFromStore, writeToStore } from '@/lib/storage'
import { DEFAULT_PROFILE, PROFILE_KEY, type UserProfile } from './types'

export function readProfile() {
  return readFromStore<UserProfile>(PROFILE_KEY, DEFAULT_PROFILE)
}

export function writeProfile(profile: UserProfile) {
  writeToStore(PROFILE_KEY, profile)
}
