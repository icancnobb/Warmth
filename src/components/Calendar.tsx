'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { DiaryEntry, DEFAULT_MOODS, MOOD_COLORS } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState('');
  const [note, setNote] = useState('');
  const [customMoods, setCustomMoods] = useState<string[]>([]);
  const [newCustomMood, setNewCustomMood] = useState('');

  useEffect(() => {
    loadEntries();
    loadCustomMoods();
  }, []);

  const loadEntries = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    const results = await db.diary
      .where('date')
      .between(startDate, endDate + '\ufff0')
      .toArray();
    setEntries(results);
  };

  const loadCustomMoods = async () => {
    const settings = await db.profile.get('settings');
    if (settings?.customMoods) {
      setCustomMoods(settings.customMoods);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const formatDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const getEntryForDate = (day: number): DiaryEntry | undefined => {
    const dateStr = formatDate(day);
    return entries.find(e => e.date === dateStr);
  };

  const handleDayClick = (day: number) => {
    const dateStr = formatDate(day);
    const entry = getEntryForDate(day);
    setSelectedDate(dateStr);
    setSelectedMood(entry?.mood || '');
    setNote(entry?.note || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    const existing = await db.diary.where('date').equals(selectedDate).first();
    if (existing) {
      await db.diary.update(existing.id, {
        mood: selectedMood,
        note,
        updatedAt: Date.now(),
      });
    } else {
      await db.diary.add({
        id: uuidv4(),
        date: selectedDate,
        mood: selectedMood,
        note,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    loadEntries();
    setShowModal(false);
  };

  const handleAddCustomMood = async () => {
    if (newCustomMood && customMoods.length < 3) {
      const updated = [...customMoods, newCustomMood];
      setCustomMoods(updated);
      const existing = await db.profile.get('settings');
      await db.profile.put({ 
        id: 'settings', 
        nickname: existing?.nickname || '',
        customMoods: updated 
      });
      setNewCustomMood('');
    }
  };

  const allMoods = [...DEFAULT_MOODS, ...customMoods];
  const days = getDaysInMonth(currentDate);
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">心情日记</h1>
          <div className="flex gap-2">
            <button
              onClick={goToPrevMonth}
              className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              &lt;
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200"
            >
              今天
            </button>
            <button
              onClick={goToNextMonth}
              className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              &gt;
            </button>
          </div>
        </div>

        <div className="text-center mb-4 text-xl font-semibold text-gray-600">
          {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(d => (
            <div key={d} className="text-center font-medium text-gray-500 py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const dateStr = day ? formatDate(day) : '';
            const entry = day ? getEntryForDate(day) : null;
            const isToday = day && dateStr === today;
            const moodColor = entry?.mood ? MOOD_COLORS[entry.mood] || '#E5E7EB' : 'transparent';

            return (
              <div
                key={idx}
                onClick={() => day && handleDayClick(day)}
                className={`
                  h-20 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all
                  ${day ? 'hover:shadow-md hover:scale-105' : ''}
                  ${isToday ? 'ring-2 ring-pink-400' : 'bg-gray-50'}
                `}
                style={{ backgroundColor: entry ? moodColor : undefined }}
              >
                {day && (
                  <>
                    <span className={`text-lg ${entry ? 'text-white font-bold' : 'text-gray-700'}`}>
                      {day}
                    </span>
                    {entry && (
                      <span className="text-xs text-white/80">{entry.mood}</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">打卡 - {selectedDate}</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">选择心情</label>
              <div className="flex flex-wrap gap-2">
                {allMoods.map(mood => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`px-4 py-2 rounded-full transition-all ${
                      selectedMood === mood
                        ? 'ring-2 ring-pink-400 ring-offset-2'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{ backgroundColor: MOOD_COLORS[mood] || '#E5E7EB' }}
                  >
                    {mood}
                  </button>
                ))}
              </div>
              
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newCustomMood}
                  onChange={e => setNewCustomMood(e.target.value)}
                  placeholder="自定义心情"
                  className="flex-1 px-3 py-1 border rounded-lg"
                  maxLength={10}
                />
                <button
                  onClick={handleAddCustomMood}
                  disabled={customMoods.length >= 3}
                  className="px-3 py-1 bg-pink-500 text-white rounded-lg disabled:opacity-50"
                >
                  添加
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                备注 ({note.length}/200)
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 200))}
                className="w-full px-3 py-2 border rounded-lg h-24 resize-none"
                placeholder="今天发生了什么？"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedMood}
                className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
