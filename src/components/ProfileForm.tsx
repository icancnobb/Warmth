'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { UserProfile } from '@/types';

export default function ProfileForm() {
  const [profile, setProfile] = useState<UserProfile>({
    id: 'user',
    nickname: '',
    birthday: '',
    gender: 'secret',
    signature: '',
    avatar: '',
  });
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const existing = await db.profile.get('user');
    if (existing) {
      setProfile(existing);
    }
  };

  const saveProfile = useCallback(async (data: UserProfile) => {
    await db.profile.put(data);
    setSaveStatus('已保存');
    setTimeout(() => setSaveStatus(''), 2000);
  }, []);

  const handleChange = (field: keyof UserProfile, value: string) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    setSaveStatus('保存中...');
    setTimeout(() => saveProfile(updated), 1000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const updated = { ...profile, avatar: base64 };
      setProfile(updated);
      saveProfile(updated);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">个人资料</h1>

        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
              {profile.avatar ? (
                <img src={profile.avatar} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl text-gray-400">👤</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          <div>
            <div className="text-sm text-gray-500">点击头像更换</div>
            {saveStatus && <div className="text-sm text-green-500">{saveStatus}</div>}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              昵称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={profile.nickname}
              onChange={e => handleChange('nickname', e.target.value.slice(0, 20))}
              placeholder="请输入昵称"
              className="w-full px-4 py-2 border rounded-lg"
              maxLength={20}
            />
            <div className="text-xs text-gray-400 text-right">{profile.nickname.length}/20</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">生日</label>
            <input
              type="date"
              value={profile.birthday || ''}
              onChange={e => handleChange('birthday', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
            <div className="flex gap-4">
              {(['male', 'female', 'secret'] as const).map(g => (
                <label key={g} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={profile.gender === g}
                    onChange={() => handleChange('gender', g)}
                    className="w-4 h-4"
                  />
                  <span>
                    {g === 'male' ? '男' : g === 'female' ? '女' : '保密'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">签名</label>
            <textarea
              value={profile.signature || ''}
              onChange={e => handleChange('signature', e.target.value.slice(0, 100))}
              placeholder="一句话介绍自己"
              className="w-full px-4 py-2 border rounded-lg h-20 resize-none"
              maxLength={100}
            />
            <div className="text-xs text-gray-400 text-right">{(profile.signature || '').length}/100</div>
          </div>
        </div>
      </div>
    </div>
  );
}
