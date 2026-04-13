import { describe, expect, it } from 'vitest'
import { craftWarmthReply } from '@/features/chat/engine'

describe('craftWarmthReply', () => {
  it('returns anxiety guidance for anxiety keywords', () => {
    const reply = craftWarmthReply('I feel anxious about work')
    expect(reply.toLowerCase()).toContain('inhale')
  })

  it('returns planning guidance for planning keywords', () => {
    const reply = craftWarmthReply('help me plan my next week')
    expect(reply.toLowerCase()).toContain('tiny plan')
  })
})
