'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/db'
import { DiaryEntry, DEFAULT_MOODS, MOOD_EMOJIS } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import MoodStats from './Calendar/MoodStats'

// 手绘插画风心情图标 - 可爱emoji风格
const MoodIcons = {
  '开心': <span style={{fontSize: '24px'}}>😊</span>,
  '平静': <span style={{fontSize: '24px'}}>😌</span>,
  '一般': <span style={{fontSize: '24px'}}>😐</span>,
  '难过': <span style={{fontSize: '24px'}}>😢</span>,
  '糟糕': <span style={{fontSize: '24px'}}>😔</span>,
}

// 手绘装饰元素
const HanddrawnDecorations = () => (
  <div className="absolute -top-2 -right-2 opacity-30">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path d="M20 5 L23 15 L33 15 L25 22 L28 33 L20 26 L12 33 L15 22 L7 15 L17 15 Z" 
            fill="none" stroke="#FFB347" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: '2 1' }}/>
    </svg>
  </div>
)

// 手绘边框装饰
const HanddrawnBorder = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
    <rect x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" rx="24" ry="24"
          fill="none" stroke="#E8D4C8" strokeWidth="2" strokeLinecap="round"
          strokeDasharray="4 3" opacity="0.6"/>
  </svg>
)

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

  // 获取心情图标
  const getMoodIcon = (mood: string) => {
    if (MoodIcons[mood as keyof typeof MoodIcons]) {
      return MoodIcons[mood as keyof typeof MoodIcons]
    }
    return <span className="text-lg">😊</span>
  }

  if (!mounted) return null

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-28 relative">
      {/* 手绘风背景 - 温暖的奶油色 + 淡淡纹理 */}
      <div className="fixed inset-0 -z-10 bg-[var(--cream)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.03]" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%235D4E47' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

      {/* 手绘插画风卡片 */}
      <div className="relative z-10 bg-white dark:bg-[#2a2520] rounded-[28px] p-6 mb-4 shadow-[0_4px_20px_rgba(93,78,71,0.08)] border-2 border-dashed border-[var(--handrawn-border)]">
        <HanddrawnBorder />
        <HanddrawnDecorations />
        
        {/* 标题区 */}
        <div className="flex items-center justify-between mb-6 relative">
          <div className="flex items-center gap-3">
            {/* 手绘图标 */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFE5D8] to-[#FFD4C4] flex items-center justify-center shadow-md border border-[#FFB5A8]/20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FF8A7A" fillOpacity="0.2" stroke="#FF8A7A" strokeWidth="1.5"/>
                <circle cx="12" cy="8" r="3" fill="#FFB5A8"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-wide">心情日记</h1>
              <p className="text-xs text-[var(--text-muted)]">✨ 记录每一天的小确幸</p>
            </div>
          </div>
          
          {/* 手绘风格月份切换 */}
          <div className="flex items-center bg-[var(--cream)] rounded-full px-2 py-1 border border-[var(--handrawn-border)]">
            <button 
              onClick={goToPrevMonth} 
              className="w-9 h-9 flex items-center justify-center text-[#8B6B61] hover:text-[#FF8A7A] hover:bg-[#FFE8E0] rounded-full transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button 
              onClick={goToToday} 
              className="px-3 h-9 text-[13px] font-medium text-[#5D4E47] hover:bg-[#FFE8E0] rounded-full transition-all"
            >
              今天
            </button>
            <button 
              onClick={goToNextMonth} 
              className="w-9 h-9 flex items-center justify-center text-[#8B6B61] hover:text-[#FF8A7A] hover:bg-[#FFE8E0] rounded-full transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 手绘风日期展示 */}
        <div className="text-center mb-5">
          <span className="text-[15px] text-[#B8A099] mr-2">{currentDate.getFullYear()}</span>
          <span className="text-[28px] font-bold text-[#FF8A7A] tracking-wider">{currentDate.getMonth() + 1}</span>
          <span className="text-[17px] text-[#8B6B61] ml-1">月</span>
          {/* 手绘装饰线 */}
          <svg className="block mx-auto mt-2" width="60" height="8" viewBox="0 0 60 8">
            <path d="M0 4 Q15 0 30 4 T60 4" fill="none" stroke="#FFD4C8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* 星期网格 */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((d, i) => (
            <div 
              key={d} 
              className={`text-center text-[11px] font-medium py-2 ${[0,6].includes(i) ? 'text-[#FF8A7A]' : 'text-[#B8A099]'}`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 日期网格 - 手绘风格日期格 */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const dateStr = day ? formatDate(day) : ''
            const entry = day ? getEntryForDate(day) : null
            const isToday = day && dateStr === today
            
            return (
              <div
                key={idx}
                onClick={() => day && handleDayClick(day)}
                className={`
                  aspect-square flex flex-col items-center justify-center text-[14px] font-medium cursor-pointer
                  transition-all duration-200 rounded-2xl mx-auto w-full max-w-[40px]
                  ${!day ? 'invisible' : ''}
                  ${isToday 
                    ? 'bg-gradient-to-br from-[#FF8A7A] to-[#FFB5A8] text-white shadow-lg transform scale-105 border-2 border-dashed border-white' 
                    : entry 
                      ? 'bg-[#FFF8F3] text-[#5D4E47] hover:shadow-md hover:scale-105 border border-[#E8D4C8]' 
                      : 'text-[#8B6B61] hover:bg-[#FFF8F3]'
                  }
                `}
              >
                {entry ? (
                  <div className="transform scale-90">{getMoodIcon(entry.mood)}</div>
                ) : (
                  <span className={isToday ? 'font-bold' : ''}>{day}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 手绘风统计卡片 */}
      <MoodStats entries={entries} />

      {/* 手绘风弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-[#5D4E47]/20 backdrop-blur-sm z-50 flex items-end justify-center">
          <div 
            className="bg-white/95 backdrop-blur-xl rounded-t-[28px] w-full max-w-md p-6 shadow-2xl border-t-2 border-l-2 border-r-0 border-b-0 border-dashed border-[#E8D4C8]" 
            onClick={e => e.stopPropagation()}
          >
            {/* 手绘风拖动手柄 */}
            <div className="flex justify-center mb-4">
              <svg width="50" height="8" viewBox="0 0 50 8">
                <path d="M0 4 Q12.5 0 25 4 T50 4" fill="none" stroke="#E8D4C8" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-bold text-[#5D4E47] flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FFE5D8" stroke="#FF8A7A" strokeWidth="1.5"/>
                </svg>
                记录心情
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-8 h-8 flex items-center justify-center text-[#B8A099] hover:bg-[#FFF8F3] rounded-full transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <p className="text-[15px] text-[#8B6B61] text-center mb-5 font-medium">{selectedDate}</p>
            
            {/* 手绘风心情选择 */}
            <div className="mb-5">
              <p className="text-[13px] font-medium text-[#B8A099] mb-3 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFB347">
                  <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 17l-6.3 4 2.3-7-6-4.6h7.6z"/>
                </svg>
                今天感觉如何？
              </p>
              <div className="grid grid-cols-5 gap-2">
                {allMoods.map(mood => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`
                      flex flex-col items-center gap-1 py-3 rounded-2xl transition-all duration-200
                      ${selectedMood === mood 
                        ? 'bg-gradient-to-br from-[#FF8A7A] to-[#FFB5A8] text-white shadow-lg transform scale-105 border-2 border-dashed border-white' 
                        : 'bg-[#FFF8F3] text-[#5D4E47] hover:bg-[#FFE8E0] border-2 border-transparent hover:border-[#E8D4C8]'
                      }
                    `}
                  >
                    <div className={selectedMood === mood ? '' : 'grayscale opacity-70'}>{getMoodIcon(mood)}</div>
                    <span className={`text-[11px] font-medium ${selectedMood === mood ? 'text-white' : 'text-[#8B6B61]'}`}>
                      {mood}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* 手绘风格自定义心情 */}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newCustomMood}
                  onChange={e => setNewCustomMood(e.target.value)}
                  placeholder="添加自定义心情..."
                  className="flex-1 px-4 py-3 bg-[#FFF8F3] rounded-2xl text-[15px] text-[#5D4E47] placeholder-[#D4C4B8] border border-[#E8D4C8] transition-all duration-200 focus:outline-none focus:border-[#FFB5A8] focus:shadow-[0_0_0_3px_rgba(255,138,122,0.1)]"
                  maxLength={10}
                />
                <button
                  onClick={handleAddCustomMood}
                  disabled={customMoods.length >= 3 || !newCustomMood}
                  className="px-5 py-3 bg-gradient-to-r from-[#FF8A7A] to-[#FFB5A8] text-white rounded-2xl text-[15px] font-medium shadow-md disabled:opacity-40 transition-all duration-200 hover:shadow-lg flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  添加
                </button>
              </div>
            </div>

            {/* 手绘风备注输入 */}
            <div className="mb-6">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 200))}
                placeholder="写下今天想说的话..."
                className="w-full px-4 py-3 bg-[#FFF8F3] rounded-2xl text-[15px] text-[#5D4E47] placeholder-[#D4C4B8] resize-none border border-[#E8D4C8] transition-all duration-200 focus:outline-none focus:border-[#FFB5A8] focus:shadow-[0_0_0_3px_rgba(255,138,122,0.1)]"
                rows={3}
              />
              <p className="text-[11px] text-[#B8A099] text-right mt-1">{note.length}/200</p>
            </div>

            {/* 手绘风按钮 */}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowModal(false)} 
                className="flex-1 py-3.5 bg-[#FFF8F3] text-[#8B6B61] rounded-2xl font-medium border border-[#E8D4C8] transition-all duration-200 hover:bg-[#FFE8E0]"
              >
                再想想
              </button>
              <button 
                onClick={handleSave} 
                disabled={!selectedMood}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#FF8A7A] to-[#FFB5A8] text-white rounded-2xl font-medium shadow-md disabled:opacity-40 transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
