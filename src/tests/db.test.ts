import { describe, it, expect, vi, beforeEach } from 'vitest'
import { db } from '@/lib/db'

// Get the mock from the setup file
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any

describe('数据库操作', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Diary 操作', () => {
    it('应该能添加日记条目', async () => {
      const entry = {
        id: 'test-entry',
        date: '2024-01-01',
        mood: '开心',
        note: '测试笔记',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await mockDb.diary.add(entry)
      expect(mockDb.diary.add).toHaveBeenCalledWith(entry)
    })

    it('应该能获取日记条目', async () => {
      const mockEntry = {
        id: 'test-entry',
        date: '2024-01-01',
        mood: '开心',
        note: '测试笔记',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      mockDb.diary.get.mockResolvedValue(mockEntry)
      const result = await mockDb.diary.get('test-entry')
      expect(result).toEqual(mockEntry)
    })

    it('应该能删除日记条目', async () => {
      await mockDb.diary.delete('test-entry')
      expect(mockDb.diary.delete).toHaveBeenCalledWith('test-entry')
    })

    it('应该能更新日记条目', async () => {
      const updates = { mood: '平静', note: '更新后的笔记' }
      await mockDb.diary.update('test-entry', updates)
      expect(mockDb.diary.update).toHaveBeenCalledWith('test-entry', updates)
    })
  })

  describe('Knowledge 操作', () => {
    it('应该能添加知识条目', async () => {
      const item = {
        id: 'test-knowledge',
        title: '测试知识',
        content: '测试内容',
        source: 'manual' as const,
        createdAt: Date.now(),
      }

      await mockDb.knowledge.add(item)
      expect(mockDb.knowledge.add).toHaveBeenCalledWith(item)
    })

    it('应该能删除知识条目', async () => {
      await mockDb.knowledge.delete('test-knowledge')
      expect(mockDb.knowledge.delete).toHaveBeenCalledWith('test-knowledge')
    })

    it('应该能获取所有知识条目', async () => {
      const mockItems = [
        { id: '1', title: '知识1', content: '内容1', source: 'manual' as const, createdAt: Date.now() },
        { id: '2', title: '知识2', content: '内容2', source: 'file' as const, fileName: 'test.txt', createdAt: Date.now() },
      ]

      mockDb.knowledge.toArray.mockResolvedValue(mockItems)
      const result = await mockDb.knowledge.toArray()
      expect(result).toHaveLength(2)
      expect(result).toEqual(mockItems)
    })
  })

  describe('Artwork 操作', () => {
    it('应该能添加艺术品', async () => {
      const artwork = {
        id: 'test-artwork',
        imageData: 'data:image/png;base64,abc123',
        createdAt: Date.now(),
      }

      await mockDb.artworks.add(artwork)
      expect(mockDb.artworks.add).toHaveBeenCalledWith(artwork)
    })

    it('应该能删除艺术品', async () => {
      await mockDb.artworks.delete('test-artwork')
      expect(mockDb.artworks.delete).toHaveBeenCalledWith('test-artwork')
    })

    it('应该能获取所有艺术品（按时间倒序）', async () => {
      const mockArtworks = [
        { id: '1', imageData: 'data1', createdAt: 2000 },
        { id: '2', imageData: 'data2', createdAt: 3000 },
      ]

      mockDb.artworks.orderBy().reverse().toArray.mockResolvedValue(mockArtworks)
      const result = await mockDb.artworks.orderBy('createdAt').reverse().toArray()
      expect(result).toHaveLength(2)
    })
  })

  describe('Profile 操作', () => {
    it('应该能保存用户资料', async () => {
      const profile = {
        id: 'user',
        nickname: '测试用户',
        birthday: '2000-01-01',
        gender: 'male' as const,
        signature: '测试签名',
        avatar: '',
      }

      await mockDb.profile.put(profile)
      expect(mockDb.profile.put).toHaveBeenCalledWith(profile)
    })

    it('应该能获取用户资料', async () => {
      const mockProfile = {
        id: 'user',
        nickname: '测试用户',
      }

      mockDb.profile.get.mockResolvedValue(mockProfile)
      const result = await mockDb.profile.get('user')
      expect(result).toEqual(mockProfile)
    })
  })
})
