'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { DiaryEntry, MOOD_COLORS } from '@/types'

interface MoodStatsProps {
  entries: DiaryEntry[]
}

const MOOD_SCORE: Record<string, number> = {
  '开心': 5, '平静': 4, '一般': 3, '难过': 2, '糟糕': 1,
}

export default function MoodStats({ entries }: MoodStatsProps) {
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {}
    entries.forEach(e => { counts[e.mood] = (counts[e.mood] || 0) + 1 })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, color: MOOD_COLORS[name] || '#ccc' }))
      .sort((a, b) => b.value - a.value)
  }, [entries])

  const trendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dateStr = date.toISOString().split('T')[0]
      const entry = entries.find(e => e.date === dateStr)
      return {
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        score: entry ? (MOOD_SCORE[entry.mood] || 3) : null,
        mood: entry?.mood || null,
      }
    })
  }, [entries])

  const streak = useMemo(() => {
    let count = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      if (entries.some(e => e.date === dateStr)) {
        count++
      } else {
        break
      }
    }
    return count
  }, [entries])

  const checkInRate = useMemo(() => {
    const now = new Date()
    const daysPassed = now.getDate()
    const checked = entries.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    return Math.round((checked / daysPassed) * 100)
  }, [entries])

  if (entries.length === 0) return null

  return (
    <div className="space-y-4">
      {/* 统计概览 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[var(--cream)] rounded-2xl p-3 text-center border border-dashed border-[var(--handrawn-border)]">
          <p className="text-2xl font-bold text-[#FF8A7A]">🔥 {streak}</p>
          <p className="text-[10px] text-[var(--text-muted)]">连续打卡</p>
        </div>
        <div className="bg-[var(--cream)] rounded-2xl p-3 text-center border border-dashed border-[var(--handrawn-border)]">
          <p className="text-2xl font-bold text-[#8BC49E]">{checkInRate}%</p>
          <p className="text-[10px] text-[var(--text-muted)]">本月打卡率</p>
        </div>
        <div className="bg-[var(--cream)] rounded-2xl p-3 text-center border border-dashed border-[var(--handrawn-border)]">
          <p className="text-2xl font-bold text-[#87CEEB]">{entries.length}</p>
          <p className="text-[10px] text-[var(--text-muted)]">总记录数</p>
        </div>
      </div>

      {/* 近7天趋势 */}
      <div className="bg-white dark:bg-[#2a2520] rounded-2xl p-4 shadow-[0_4px_16px_rgba(93,78,71,0.06)] border-2 border-dashed border-[var(--handrawn-border)]">
        <p className="text-xs text-[var(--text-muted)] mb-3">📈 近7天心情趋势</p>
        <div style={{ width: '100%', height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--handrawn-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => ['糟糕', '难过', '一般', '平静', '开心'][v - 1]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#FF8A7A" strokeWidth={2.5} dot={{ fill: '#FF8A7A', r: 4 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 月度分布 */}
      {pieData.length > 0 && (
        <div className="bg-white dark:bg-[#2a2520] rounded-2xl p-4 shadow-[0_4px_16px_rgba(93,78,71,0.06)] border-2 border-dashed border-[var(--handrawn-border)]">
          <p className="text-xs text-[var(--text-muted)] mb-3">📊 本月心情分布</p>
          <div style={{ width: '100%', height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={55}
                  innerRadius={30}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name} {item.value}天
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
