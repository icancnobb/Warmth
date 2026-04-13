export const PROFILE_KEY = 'profile.card'

export type UserProfile = {
  displayName: string
  birthday: string
  pronouns: string
  signature: string
}

export const DEFAULT_PROFILE: UserProfile = {
  displayName: '',
  birthday: '',
  pronouns: '',
  signature: '',
}
