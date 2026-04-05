import { describe, it, expect } from 'vitest'
import { DEFAULT_MOODS, MOOD_COLORS, MOOD_EMOJIS } from '@/types'

describe('心情类型常量', () => {
  describe('DEFAULT_MOODS', () => {
    it('应该有5种默认心情', () => {
      expect(DEFAULT_MOODS).toHaveLength(5)
    })

    it('应该包含预期的心情类型', () => {
      expect(DEFAULT_MOODS).toContain('开心')
      expect(DEFAULT_MOODS).toContain('平静')
      expect(DEFAULT_MOODS).toContain('一般')
      expect(DEFAULT_MOODS).toContain('难过')
      expect(DEFAULT_MOODS).toContain('糟糕')
    })
  })

  describe('MOOD_COLORS', () => {
    it('每个默认心情都应该有对应的颜色', () => {
      DEFAULT_MOODS.forEach(mood => {
        expect(MOOD_COLORS).toHaveProperty(mood)
      })
    })

    it('颜色值应该是有效的十六进制颜色', () => {
      Object.values(MOOD_COLORS).forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })
  })

  describe('MOOD_EMOJIS', () => {
    it('每个默认心情都应该有对应的emoji', () => {
      DEFAULT_MOODS.forEach(mood => {
        expect(MOOD_EMOJIS).toHaveProperty(mood)
      })
    })

    it('emoji应该是非空字符串', () => {
      Object.values(MOOD_EMOJIS).forEach(emoji => {
        expect(emoji.length).toBeGreaterThan(0)
      })
    })
  })
})

describe('DiaryEntry 结构', () => {
  it('应该能创建有效的日记条目', () => {
    const entry = {
      id: 'test-id',
      date: '2024-01-01',
      mood: '开心',
      note: '今天是个好日子',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    expect(entry.id).toBeDefined()
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(DEFAULT_MOODS).toContain(entry.mood)
    expect(typeof entry.note).toBe('string')
    expect(typeof entry.createdAt).toBe('number')
    expect(typeof entry.updatedAt).toBe('number')
  })
})

describe('KnowledgeItem 结构', () => {
  it('应该能创建有效的手动输入知识条目', () => {
    const item = {
      id: 'test-id',
      title: '测试标题',
      content: '测试内容',
      source: 'manual' as const,
      createdAt: Date.now(),
    }

    expect(item.id).toBeDefined()
    expect(typeof item.title).toBe('string')
    expect(typeof item.content).toBe('string')
    expect(item.source).toBe('manual')
    expect(typeof item.createdAt).toBe('number')
  })

  it('应该能创建有效的文件上传知识条目', () => {
    const item = {
      id: 'test-id',
      title: '测试文件',
      content: '文件内容',
      source: 'file' as const,
      fileName: 'test.txt',
      createdAt: Date.now(),
    }

    expect(item.source).toBe('file')
    expect(item.fileName).toBeDefined()
  })
})

describe('Artwork 结构', () => {
  it('应该能创建有效的艺术品记录', () => {
    const artwork = {
      id: 'test-id',
      imageData: 'data:image/png;base64,abc123',
      createdAt: Date.now(),
    }

    expect(artwork.id).toBeDefined()
    expect(artwork.imageData).toMatch(/^data:image\/\w+;base64,/)
    expect(typeof artwork.createdAt).toBe('number')
  })
})

describe('UserProfile 结构', () => {
  it('应该能创建完整的用户资料', () => {
    const profile = {
      id: 'user',
      nickname: '测试用户',
      birthday: '2000-01-01',
      gender: 'male' as const,
      signature: '这是一段签名',
      avatar: 'data:image/png;base64,abc123',
      customMoods: ['自定义心情1', '自定义心情2'],
    }

    expect(profile.id).toBe('user')
    expect(typeof profile.nickname).toBe('string')
    expect(profile.birthday).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(['male', 'female', 'secret']).toContain(profile.gender)
    expect(typeof profile.signature).toBe('string')
    expect(profile.avatar).toMatch(/^data:image\/\w+;base64,/)
    expect(profile.customMoods).toHaveLength(2)
  })

  it('应该能创建最小化的用户资料', () => {
    const profile = {
      id: 'user',
      nickname: '最小用户',
    }

    expect(profile.id).toBe('user')
    expect(profile.nickname).toBeDefined()
  })
})
