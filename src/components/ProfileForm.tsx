'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { db } from '@/lib/db'
import { UserProfile } from '@/types'
import { useDataBackup } from '@/hooks/use_data_backup'
import { useReminder } from '@/hooks/use_reminder'

export default function ProfileForm() {
  const [profile, setProfile] = useState<UserProfile>({ id: 'user', nickname: '', birthday: '', gender: 'secret', signature: '', avatar: '' })
  const [saveStatus, setSaveStatus] = useState('')
  const [mounted, setMounted] = useState(false)
  const file_input_ref = useRef<HTMLInputElement>(null)
  const { export_data, import_data } = useDataBackup()
  const { settings: reminder_settings, set_settings: set_reminder_settings, request_permission } = useReminder()
  const [backup_status, set_backup_status] = useState('')

  useEffect(() => { setMounted(true); loadProfile() }, [])

  const loadProfile = async () => { 
    const existing = await db.profile.get('user'); 
    if (existing) setProfile(existing) 
  }

  const saveProfile = useCallback(async (data: UserProfile) => {
    await db.profile.put(data)
    setSaveStatus('已保存')
    setTimeout(() => setSaveStatus(''), 1500)
  }, [])

  const handleChange = (field: keyof UserProfile, value: string) => {
    const updated = { ...profile, [field]: value }
    setProfile(updated)
    setSaveStatus('保存中...')
    setTimeout(() => saveProfile(updated), 600)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      const updated = { ...profile, avatar: base64 }
      setProfile(updated)
      saveProfile(updated)
    }
    reader.readAsDataURL(file)
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 pt-14 pb-20 overflow-auto">
      {/* 简洁背景 */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#FFF9F3] to-[#FFF5F0]" />

      <div className="max-w-sm mx-auto px-4 py-6">
        {/* 头部信息卡 */}
        <div className="text-center mb-5 animate-fade-in">
          {/* 头像 */}
          <div className="relative inline-block mb-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFB5A8] to-[#FFD4C8] flex items-center justify-center shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
              {profile.avatar ? (
                <img src={profile.avatar} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">😊</span>
              )}
            </div>
            {/* 头像悬停遮罩 */}
            <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 hover:opacity-100 transition-all duration-200 flex items-center justify-center cursor-pointer group">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          
          {/* 昵称 */}
          <h2 className="text-lg font-semibold text-[#5D4E47]">
            {profile.nickname || '给自己起个名字'}
          </h2>
          
          {/* 签名 */}
          {profile.signature && (
            <p className="text-sm text-[#B8A099] mt-1">{profile.signature}</p>
          )}
          
          {/* 保存状态 */}
          {saveStatus && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-[#8BC49E] bg-[#E8F5F0] px-3 py-1 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {saveStatus}
            </div>
          )}
        </div>

        {/* 表单区域 */}
        <div className="space-y-3">
          {/* 昵称 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#FFE8E0]/50 animate-card-in">
            <label className="block text-xs font-medium text-[#B8A099] mb-2">昵称</label>
            <input 
              type="text" 
              value={profile.nickname} 
              onChange={e => handleChange('nickname', e.target.value.slice(0, 20))} 
              placeholder="给自己起个昵称..." 
              className="w-full bg-transparent text-[#5D4E47] placeholder-[#D4C4B8] text-sm focus:outline-none"
              maxLength={20}
            />
          </div>

          {/* 生日 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#FFE8E0]/50 animate-card-in delay-100">
            <label className="block text-xs font-medium text-[#B8A099] mb-2">生日</label>
            <input 
              type="date" 
              value={profile.birthday || ''} 
              onChange={e => handleChange('birthday', e.target.value)} 
              className="w-full bg-transparent text-[#5D4E47] text-sm focus:outline-none"
            />
          </div>

          {/* 性别 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#FFE8E0]/50 animate-card-in delay-200">
            <label className="block text-xs font-medium text-[#B8A099] mb-2">性别</label>
            <div className="flex gap-2">
              {[
                { value: 'male', emoji: '👨' },
                { value: 'female', emoji: '👩' },
                { value: 'secret', emoji: '🔒' },
              ].map(g => (
                <button 
                  key={g.value} 
                  onClick={() => handleChange('gender', g.value)} 
                  className={`
                    flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5
                    ${profile.gender === g.value 
                      ? 'bg-gradient-to-br from-[#FF8A7A] to-[#FFB5A8] text-white shadow-md -translate-y-0.5' 
                      : 'bg-[#FFF8F5] text-[#8B6B61] hover:bg-[#FFE8E0]'
                    }
                  `}
                >
                  <span>{g.emoji}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 签名 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#FFE8E0]/50 animate-card-in delay-300">
            <label className="block text-xs font-medium text-[#B8A099] mb-2">签名</label>
            <textarea 
              value={profile.signature || ''} 
              onChange={e => handleChange('signature', e.target.value.slice(0, 100))} 
              placeholder="用一句话介绍自己..." 
              className="w-full bg-transparent text-[#5D4E47] placeholder-[#D4C4B8] text-sm resize-none focus:outline-none"
              maxLength={100}
              rows={2}
            />
          </div>
        </div>

        {/* 底部提示 */}
        <div className="text-center mt-6 animate-fade-in delay-400">
          <p className="text-xs text-[#B8A099]">
            💡 信息会自动保存
          </p>
        </div>

        {/* 数据备份 */}
        <div className="mt-6 space-y-3">
          <div className="bg-white/80 dark:bg-[#2a2520]/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#FFE8E0]/50">
            <p className="text-xs font-medium text-[#B8A099] mb-3">📦 数据管理</p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    await export_data()
                    set_backup_status('✅ 导出成功')
                  } catch { set_backup_status('❌ 导出失败') }
                  setTimeout(() => set_backup_status(''), 2000)
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#8BC49E] to-[#A8E6CF] text-white rounded-xl text-sm font-medium"
              >
                📦 导出数据
              </button>
              <button
                onClick={() => file_input_ref.current?.click()}
                className="flex-1 py-2.5 bg-[#FFF8F3] dark:bg-[#2a2520] text-[#8B6B61] rounded-xl text-sm font-medium border border-dashed border-[#E8D4C8]"
              >
                📥 导入数据
              </button>
              <input
                ref={file_input_ref}
                type="file"
                accept=".json"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const result = await import_data(file)
                  set_backup_status(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
                  setTimeout(() => set_backup_status(''), 3000)
                  e.target.value = ''
                }}
                className="hidden"
              />
            </div>
            {backup_status && (
              <p className="text-xs text-center mt-2 text-[#8B6B61]">{backup_status}</p>
            )}
          </div>

          {/* 每日提醒 */}
          <div className="bg-white/80 dark:bg-[#2a2520]/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#FFE8E0]/50">
            <p className="text-xs font-medium text-[#B8A099] mb-3">🔔 每日打卡提醒</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#5D4E47] dark:text-[#E8D4C8]">开启提醒</span>
              <button
                onClick={async () => {
                  if (!reminder_settings.enabled) {
                    const granted = await request_permission()
                    if (!granted) {
                      alert('请允许浏览器发送通知')
                      return
                    }
                  }
                  set_reminder_settings(prev => ({ ...prev, enabled: !prev.enabled }))
                }}
                className={`w-12 h-6 rounded-full transition-all duration-300 ${reminder_settings.enabled ? 'bg-gradient-to-r from-[#FF8A7A] to-[#FFB5A8]' : 'bg-[#E8D4C8]'} relative`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${reminder_settings.enabled ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
            {reminder_settings.enabled && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#8B6B61] dark:text-[#B8A099]">提醒时间</span>
                <input
                  type="time"
                  value={`${String(reminder_settings.hour).padStart(2, '0')}:${String(reminder_settings.minute).padStart(2, '0')}`}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':').map(Number)
                    set_reminder_settings(prev => ({ ...prev, hour: h, minute: m }))
                  }}
                  className="bg-[#FFF8F3] dark:bg-[#1a1a1e] text-[#5D4E47] dark:text-[#E8D4C8] text-sm rounded-xl px-3 py-1.5 border border-dashed border-[#E8D4C8]"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
