'use client'

import { db } from '@/lib/db'
import { ExportData } from '@/types'

export function useDataBackup() {
  const export_data = async (): Promise<string> => {
    const [diary, knowledge, artworks, profile, chatMessages, settings] = await Promise.all([
      db.diary.toArray(),
      db.knowledge.toArray(),
      db.artworks.toArray(),
      db.profile.get('user'),
      db.chatMessages.toArray(),
      db.settings.get('app'),
    ])

    const export_obj: ExportData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      diary,
      knowledge,
      artworks,
      profile: profile || null,
      chatMessages,
      settings: settings || null,
    }

    const json_str = JSON.stringify(export_obj, null, 2)
    const blob = new Blob([json_str], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `warmth-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    return json_str
  }

  const import_data = async (file: File): Promise<{ success: boolean; message: string }> => {
    try {
      const text = await file.text()
      const data = JSON.parse(text) as ExportData

      if (!data.version || !data.diary) {
        return { success: false, message: '无效的备份文件格式' }
      }

      await db.transaction('rw', [db.diary, db.knowledge, db.artworks, db.profile, db.chatMessages, db.settings], async () => {
        await Promise.all([db.diary.clear(), db.knowledge.clear(), db.artworks.clear(), db.chatMessages.clear()])

        if (data.diary?.length) await db.diary.bulkAdd(data.diary)
        if (data.knowledge?.length) await db.knowledge.bulkAdd(data.knowledge)
        if (data.artworks?.length) await db.artworks.bulkAdd(data.artworks)
        if (data.chatMessages?.length) await db.chatMessages.bulkAdd(data.chatMessages)
        if (data.profile) await db.profile.put(data.profile)
        if (data.settings) await db.settings.put(data.settings)
      })

      return { success: true, message: `成功导入 ${data.diary.length} 条日记` }
    } catch {
      return { success: false, message: '导入失败：文件格式错误' }
    }
  }

  return { export_data, import_data }
}
