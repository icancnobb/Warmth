'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/db'
import { DiaryEntry, DEFAULT_MOODS, MOOD_EMOJIS } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedMood, setSelectedMood] = useState('')
  const [note, setNote] = useState('')
  const [customMoods, setCustomMoods] = useState<string[]>([])
  const [newCustomMood, setNewCustomMood] = useState('')
  const [mounted, setMounted] = useState(false)

  const loadEntries = useCallback(async () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
    const results = await db.diary.where('date').between(startDate, endDate + '\ufff0').toArray()
    setEntries(results)
  }, [currentDate])

  const loadCustomMoods = useCallback(async () => {
    const settings = await db.profile.get('settings')
    if (settings?.customMoods) setCustomMoods(settings.customMoods)
  }, [])

  useEffect(() => { setMounted(true); loadCustomMoods() }, [loadCustomMoods])
  useEffect(() => { loadEntries() }, [loadEntries])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }

  const formatDate = (day: number) => {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    return `${year}-${month}-${dayStr}`
  }

  const getEntryForDate = (day: number) => entries.find(e => e.date === formatDate(day))

  const handleDayClick = (day: number) => {
    const dateStr = formatDate(day)
    const entry = getEntryForDate(day)
    setSelectedDate(dateStr)
    setSelectedMood(entry?.mood || '')
    setNote(entry?.note || '')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!selectedDate) return
    const existing = await db.diary.where('date').equals(selectedDate).first()
    if (existing) {
      await db.diary.update(existing.id, { mood: selectedMood, note, updatedAt: Date.now() })
    } else {
      await db.diary.add({ id: uuidv4(), date: selectedDate, mood: selectedMood, note, createdAt: Date.now(), updatedAt: Date.now() })
    }
    loadEntries()
    setShowModal(false)
  }

  const handleAddCustomMood = async () => {
    if (newCustomMood && customMoods.length < 3) {
      const updated = [...customMoods, newCustomMood]
      setCustomMoods(updated)
      const existing = await db.profile.get('settings')
      await db.profile.put({ id: 'settings', nickname: existing?.nickname || '', customMoods: updated })
      setNewCustomMood('')
    }
  }

  const goToPrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  const goToToday = () => setCurrentDate(new Date())

  const allMoods = [...DEFAULT_MOODS, ...customMoods]
  const days = getDaysInMonth(currentDate)
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const today = new Date().toISOString().split('T')[0]
  const moodCounts = entries.reduce((acc, e) => { acc[e.mood] = (acc[e.mood] || 0) + 1; return acc }, {} as Record<string, number>)

  if (!mounted) return null

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28 relative">
      {/* Apple Design: 空间感 - 简洁背景 */}
      <div className="fixed inset-0 -z-10 bg-[#F5F5F7]" />

      {/* Apple Design: 材料 - 卡片 */}
      <div className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/60 p-5 mb-4">
        {/* Apple Design: 空间感 - 留白 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-xl shadow-md">
              📅
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#1D1D1F]">心情日记</h1>
              <p className="text-xs text-[#86868B]">记录每一天</p>
            </div>
          </div>
          
          {/* Apple Design: 动效 - 按钮组 */}
          <div className="flex items-center bg-[#F5F5F7] rounded-full p-0.5">
            <button onClick={goToPrevMonth} className="w-9 h-9 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] rounded-full hover:bg-white transition-all duration-200">‹</button>
            <button onClick={goToToday} className="px-3 h-9 text-[13px] font-medium text-[#1D1D1F] hover:bg-white rounded-full transition-all duration-200">今天</button>
            <button onClick={goToNextMonth} className="w-9 h-9 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] rounded-full hover:bg-white transition-all duration-200">›</button>
          </div>
        </div>

        {/* Apple Design: Typography - 清晰层级 */}
        <div className="text-center mb-5">
          <span className="text-[28px] font-semibold text-[#1D1D1F]">{currentDate.getFullYear()}</span>
          <span className="text-[17px] text-[#86868B] mx-1">年</span>
          <span className="text-[28px] font-semibold text-[#FF2D55]">{currentDate.getMonth() + 1}</span>
          <span className="text-[17px] text-[#86868B] mx-1">月</span>
        </div>

        {/* Apple Design: 网格 - 对齐 */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((d, i) => (
            <div key={d} className={`text-center text-[11px] font-medium py-2 ${[0,6].includes(i) ? 'text-[#FF2D55]' : 'text-[#86868B]'}`}>{d}</div>
          ))}
        </div>

        {/* Apple Design: 深度 - 阴影 */}
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day, idx) => {
            const dateStr = day ? formatDate(day) : ''
            const entry = day ? getEntryForDate(day) : null
            const isToday = day && dateStr === today
            
            return (
              <div
                key={idx}
                onClick={() => day && handleDayClick(day)}
                className={`
                  aspect-[1.1] flex items-center justify-center text-[15px] font-medium cursor-pointer
                  transition-all duration-200 rounded-2xl mx-auto w-full max-w-[36px]
                  ${!day ? 'invisible' : ''}
                  ${isToday ? 'bg-[#FF2D55] text-white shadow-md' : entry ? 'bg-white shadow-sm text-[#1D1D1F] hover:shadow-md' : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'}
                `}
              >
                {entry ? MOOD_EMOJIS[entry.mood] || '😊' : day}
              </div>
            )
          })}
        </div>
      </div>

      {/* Apple Design: 分组 - 统计卡片 */}
      {Object.keys(moodCounts).length > 0 && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-4">
          <p className="text-[13px] font-medium text-[#86868B] mb-3">本月</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(moodCounts).map(([mood, count]) => (
              <div key={mood} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm">
                <span className="text-sm">{MOOD_EMOJIS[mood] || '😊'}</span>
                <span className="text-[12px] text-[#86868B]">{mood}</span>
                <span className="text-[12px] font-semibold text-[#1D1D1F]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apple Design: 材料 - 弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-t-3xl w-full max-w-md p-6 shadow-lg" onClick={e => e.stopPropagation()}>
            {/* Apple Design: 动效 - 拖动手柄 */}
            <div className="flex justify-center mb-4"><div className="w-[36px] h-[5px] bg-[#D1D1D6] rounded-full" /></div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-semibold text-[#1D1D1F]">记录心情</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center text-[#86868B] hover:bg-[#F5F5F7] rounded-full transition-all">✕</button>
            </div>
            
            <p className="text-[15px] text-[#86868B] text-center mb-5">{selectedDate}</p>
            
            {/* Apple Design: Typography - 大触摸目标 */}
            <div className="mb-5">
              <p className="text-[13px] font-medium text-[#86868B] mb-3">今天感觉如何？</p>
              <div className="grid grid-cols-5 gap-2">
                {allMoods.map(mood => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`
                      flex flex-col items-center gap-1 py-3 rounded-[12px] transition-all duration-200
                      ${selectedMood === mood ? 'bg-[#F5F5F7] shadow-sm scale-105' : 'hover:bg-[#F5F5F7]'}
                    `}
                  >
                    <span className="text-[24px]">{MOOD_EMOJIS[mood] || '😊'}</span>
                    <span className={`text-[11px] ${selectedMood === mood ? 'text-[#FF2D55] font-semibold' : 'text-[#86868B]'}`}>{mood}</span>
                  </button>
                ))}
              </div>
              
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newCustomMood}
                  onChange={e => setNewCustomMood(e.target.value)}
                  placeholder="自定义..."
                  className="flex-1 px-4 py-2.5 bg-[#F5F5F7] rounded-[10px] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#FF2D55]/30"
                  maxLength={10}
                />
                <button
                  onClick={handleAddCustomMood}
                  disabled={customMoods.length >= 3 || !newCustomMood}
                  className="px-4 py-2.5 bg-[#007AFF] text-white rounded-[10px] text-[15px] font-medium disabled:opacity=50"
                >
                  添加
                </button>
              </div>
            </div>

            <div className="mb-6">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 200))}
                placeholder="写下今天的故事..."
                className="w-full px-4 py-3 bg-[#F5F5F7] rounded-[12px] text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-[#FF2D55]/30"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-[#F5F5F7] text-[#1D1D1F] rounded-[12px] font-medium">取消</button>
              <button onClick={handleSave} disabled={!selectedMood} className="flex-1 py-3 bg-[#007AFF] text-white rounded-[12px] font-medium disabled:opacity=50">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
