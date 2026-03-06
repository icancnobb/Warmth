'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/db'
import { UserProfile } from '@/types'

export default function ProfileForm() {
  const [profile, setProfile] = useState<UserProfile>({ id: 'user', nickname: '', birthday: '', gender: 'secret', signature: '', avatar: '' })
  const [saveStatus, setSaveStatus] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true); loadProfile() }, [])

  const loadProfile = async () => { const existing = await db.profile.get('user'); if (existing) setProfile(existing) }

  const saveProfile = useCallback(async (data: UserProfile) => {
    await db.profile.put(data)
    setSaveStatus('已保存')
    setTimeout(() => setSaveStatus(''), 2000)
  }, [])

  const handleChange = (field: keyof UserProfile, value: string) => {
    const updated = { ...profile, [field]: value }
    setProfile(updated)
    setSaveStatus('保存中...')
    setTimeout(() => saveProfile(updated), 1000)
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
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-200/30 to-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-200/30 to-pink-200/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-xl mx-auto p-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-100/50 border border-white/60 p-5 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <h1 className="text-xl font-bold text-gray-800">个人资料</h1>
              <p className="text-xs text-gray-500">完善你的个人信息</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-100/50 border border-white/60 p-6">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden flex items-center justify-center shadow-lg">
                {profile.avatar ? <img src={profile.avatar} alt="头像" className="w-full h-full object-cover" /> : <span className="text-5xl">😀</span>}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <span className="text-white text-xs">更换</span>
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-700">{profile.nickname || '未设置昵称'}</p>
              {profile.signature && <p className="text-sm text-gray-400 mt-1">{profile.signature}</p>}
              {saveStatus && <p className="text-sm text-green-500 mt-1">{saveStatus}</p>}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">昵称 <span className="text-rose-400">*</span></label>
              <input type="text" value={profile.nickname} onChange={e => handleChange('nickname', e.target.value.slice(0, 20))} placeholder="请输入昵称" className="w-full px-4 py-3 bg-white/80 border-0 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm" maxLength={20} />
              <div className="text-xs text-gray-400 text-right mt-1">{profile.nickname.length}/20</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">生日</label>
              <input type="date" value={profile.birthday || ''} onChange={e => handleChange('birthday', e.target.value)} className="w-full px-4 py-3 bg-white/80 border-0 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-3">性别</label>
              <div className="flex gap-3">
                {([
                  { value: 'male', label: '👨 男' },
                  { value: 'female', label: '👩 女' },
                  { value: 'secret', label: '🔒 保密' },
                ] as const).map(g => (
                  <button key={g.value} onClick={() => handleChange('gender', g.value)} className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all ${profile.gender === g.value ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200' : 'bg-white/80 text-gray-600 hover:bg-white'}`}>
                    {g.label.replace(/👨|👩|🔒/, '')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">签名</label>
              <textarea value={profile.signature || ''} onChange={e => handleChange('signature', e.target.value.slice(0, 100))} placeholder="一句话介绍自己..." className="w-full px-4 py-3 bg-white/80 border-0 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm" maxLength={100} rows={2} />
              <div className="text-xs text-gray-400 text-right mt-1">{(profile.signature || '').length}/100</div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-gray-400">
          <p>信息自动保存，无需手动操作</p>
        </div>
      </div>
    </div>
  )
}
