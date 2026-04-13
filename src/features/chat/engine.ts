import { readJournalEntries } from '@/features/journal/store'
import { readProfile } from '@/features/profile/store'

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word))
}

export function craftWarmthReply(prompt: string) {
  const normalized = prompt.toLowerCase()
  const entries = readJournalEntries()
  const profile = readProfile()

  const latest = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0]
  const userName = profile.displayName?.trim() || 'friend'

  if (includesAny(normalized, ['anxious', 'panic', 'stress', 'nervous'])) {
    return `${userName}, let us slow this down together. Try this cycle: inhale 4 seconds, hold 4, exhale 6, repeat 4 rounds. Then write one concrete next step you can complete in 10 minutes.`
  }

  if (includesAny(normalized, ['sad', 'lonely', 'down', 'empty'])) {
    return `I hear you. Today does not need to be fixed all at once. Choose one gentle action now: water, sunlight, a short walk, or a message to someone safe.`
  }

  if (includesAny(normalized, ['plan', 'goal', 'focus'])) {
    return `Let us make a tiny plan. 1) Define one target. 2) Do a 20-minute sprint. 3) Log what changed in your journal. I can help you review after the sprint.`
  }

  if (latest) {
    return `Your latest mood was ${latest.mood} on ${latest.date}. Based on that trend, I suggest one reflection question: "What gave me energy today, and what drained it?"`
  }

  return `I am here with you. Share what happened today, and I will help you sort feelings, facts, and a next action.`
}
