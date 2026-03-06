'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    setMounted(true)
    loadEntries()
    loadCustomMoods()
  }, [])

  const loadEntries = async () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
    const results = await db.diary.where('date').between(startDate, endDate + '\ufff0').toArray()
    setEntries(results)
  }

  const loadCustomMoods = async () => {
    const settings = await db.profile.get('settings')
    if (settings?.customMoods) setCustomMoods(settings.customMoods)
  }

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
      {/* 温暖的渐变背景 - Apple的层次 + 温暖的色彩 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50 via-pink-50 to-purple-50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-rose-200/40 to-pink-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-gradient-to-bl from-purple-200/30 to-rose-200/30 rounded-full blur-3xl" />
      </div>

      {/* 主卡片 - 玻璃拟态 */}
      <div className="relative z-10">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-rose-200/50">
              📅
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">心情日记</h1>
              <p className="text-xs text-gray-500">记录每一天</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-white/70 backdrop-blur-xl rounded-2xl p-1 shadow-sm">
            <button onClick={goToPrevMonth} className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-white rounded-xl transition-all hover:scale-105">‹</button>
            <button onClick={goToToday} className="px-3 h-9 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-rose-200 hover:scale-105 transition-all">今天</button>
            <button onClick={goToNextMonth} className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-white rounded-xl transition-all hover:scale-105">›</button>
          </div>
        </div>

        {/* 月份卡片 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-100/50 p-5 mb-4">
          <div className="text-center mb-4">
            <span className="text-3xl font-bold text-gray-800">{currentDate.getFullYear()}</span>
            <span className="text-lg text-gray-400 mx-1">年</span>
            <span className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">{currentDate.getMonth() + 1}</span>
            <span className="text-lg text-gray-400 mx-1">月</span>
          </div>

          {/* 星期 */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((d, i) => (
              <div key={d} className={`text-center text-xs font-medium py-2 ${[0,6].includes(i) ? 'text-rose-400' : 'text-gray-400'}`}>{d}</div>
            ))}
          </div>

          {/* 日期网格 */}
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
                    aspect-square rounded-2xl flex items-center justify-center text-[15px] font-medium cursor-pointer
                    transition-all duration-200
                    ${!day ? 'invisible' : ''}
                    ${isToday ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200' : entry ? 'bg-white shadow-sm hover:scale-105 hover:shadow-md' : 'bg-white/60 hover:bg-white hover:scale-105'}
                  `}
                >
                  {entry ? MOOD_EMOJIS[entry.mood] || '😊' : day}
                </div>
              )
            })}
          </div>
        </div>

        {/* 统计 */}
        {Object.keys(moodCounts).length > 0 && (
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 mb-4">
            <p className="text-sm font-medium text-gray-600 mb-3">本月心情</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(moodCounts).map(([mood, count]) => (
                <div key={mood} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm hover:scale-105 transition-transform">
                  <span className="text-lg">{MOOD_EMOJIS[mood] || '😊'}</span>
                  <span className="text-xs text-gray-500">{mood}</span>
                  <span className="text-xs font-bold text-rose-500">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-t-3xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* 拖动手柄 */}
            <div className="flex justify-center mb-4"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">记录心情</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">✕</button>
            </div>
            
            <p className="text-center text-gray-500 mb-5">{selectedDate}</p>
            
            {/* 心情选择 */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-600 mb-3">今天心情怎么样？</p>
              <div className="grid grid-cols-5 gap-2">
                {allMoods.map(mood => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`
                      flex flex-col items-center gap-1 py-3 rounded-2xl transition-all duration-200
                      ${selectedMood === mood 
                        ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200 scale-105' 
                        : 'bg-gray-50 hover:bg-gray-100 hover:scale-105'}
                    `}
                  >
                    <span className="text-2xl">{MOOD_EMOJIS[mood] || '😊'}</span>
                    <span className="text-[10px]">{mood}</span>
                  </button>
                ))}
              </div>
              
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newCustomMood}
                  onChange={e => setNewCustomMood(e.target.value)}
                  placeholder="自定义心情..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  maxLength={10}
                />
                <button
                  onClick={handleAddCustomMood}
                  disabled={customMoods.length >= 3 || !newCustomMood}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-rose-200 transition-all"
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
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all">取消</button>
              <button onClick={handleSave} disabled={!selectedMood} className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-rose-200 transition-all">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
