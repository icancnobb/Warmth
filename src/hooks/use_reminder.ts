'use client'

import { useState, useEffect, useCallback } from 'react'

interface ReminderSettings {
  enabled: boolean
  hour: number
  minute: number
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: 21,
  minute: 0,
}

export function useReminder() {
  const [settings, set_settings] = useState<ReminderSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    const saved = localStorage.getItem('reminderSettings')
    if (saved) {
      try { set_settings(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('reminderSettings', JSON.stringify(settings))
  }, [settings])

  const request_permission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }, [])

  const check_reminder = useCallback(() => {
    if (!settings.enabled) return
    if (Notification.permission !== 'granted') return
    const now = new Date()
    if (now.getHours() === settings.hour && now.getMinutes() === settings.minute) {
      const today = now.toISOString().split('T')[0]
      const last_reminder = localStorage.getItem('lastReminder')
      if (last_reminder === today) return

      new Notification('心情日记 🌸', {
        body: '今天的心情记录了吗？来写下今天的感受吧~',
      })
      localStorage.setItem('lastReminder', today)
    }
  }, [settings])

  useEffect(() => {
    const interval = setInterval(check_reminder, 60000)
    return () => clearInterval(interval)
  }, [check_reminder])

  return { settings, set_settings, request_permission }
}
