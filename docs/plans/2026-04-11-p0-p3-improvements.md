# Warmth P0-P3 全量改进实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 对 Warmth 心情日记应用进行 P0-P3 共 10 项全面改进，涵盖核心功能修复、用户体验提升、代码重构。

**Architecture:** 保持 Next.js 14 + Tailwind CSS + IndexedDB 架构不变。新增 recharts 图表库、深色模式 CSS 变量、PWA Service Worker。组件拆分为子目录结构，抽取自定义 hooks。

**Tech Stack:** Next.js 14, Tailwind CSS 4, Dexie.js, Recharts, next-pwa

---

## Task 1: 数据库 Schema 扩展 + 新类型定义

**Files:**
- Modify: `src/lib/db.ts`
- Modify: `src/types/index.ts`

**Step 1: 扩展类型定义**

在 `src/types/index.ts` 中新增：

```typescript
// 聊天消息
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

// 深色模式设置
export interface AppSettings {
  id: string;
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

// 数据导出格式
export interface ExportData {
  version: string;
  exportedAt: string;
  diary: DiaryEntry[];
  knowledge: KnowledgeItem[];
  artworks: Artwork[];
  profile: UserProfile | null;
  chatMessages: ChatMessage[];
  settings: AppSettings | null;
}
```

**Step 2: 扩展数据库 Schema**

在 `src/lib/db.ts` 中新增表：

```typescript
import Dexie, { Table } from 'dexie';
import { DiaryEntry, KnowledgeItem, Artwork, UserProfile, ChatMessage, AppSettings } from '@/types';

export class MoodDiaryDB extends Dexie {
  diary!: Table<DiaryEntry>;
  knowledge!: Table<KnowledgeItem>;
  artworks!: Table<Artwork>;
  profile!: Table<UserProfile>;
  chatMessages!: Table<ChatMessage>;
  settings!: Table<AppSettings>;

  constructor() {
    super('MoodDiaryDB');
    this.version(2).stores({
      diary: 'id, date, mood, createdAt',
      knowledge: 'id, title, source, createdAt',
      artworks: 'id, createdAt',
      profile: 'id',
      chatMessages: 'id, createdAt',
      settings: 'id',
    });
  }
}

export const db = new MoodDiaryDB();
```

**Step 3: 验证构建通过**

Run: `cd Warmth && npx tsc --noEmit`
Expected: 无类型错误

**Step 4: Commit**
```
feat: extend DB schema with chatMessages and settings tables
```

---

## Task 2: 深色模式 (P2)

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/hooks/use_dark_mode.ts`
- Modify: `src/components/Navigation.tsx`

**Step 1: 在 globals.css 中添加深色模式 CSS 变量**

在现有的 `:root` 块之后添加：

```css
/* 深色模式 */
.dark {
  --coral: #FF9A8B;
  --coral-soft: #FFB8AA;
  --coral-light: #FFD8CC;
  --coral-pale: #FFE5DA;
  --cream: #1a1a1e;
  --cream-dark: #141416;
  --peach: #2a2520;
  --text-primary: #E8D4C8;
  --text-secondary: #B8A099;
  --text-muted: #8B7B72;
  --handrawn-border: #3a3530;
  --handrawn-light: #2a2520;
  --success: #8BC49E;
  --warning: #FFD699;
  --error: #F5A8A8;
}

.dark body {
  background: #1a1a1e;
  color: #E8D4C8;
}

.dark ::-webkit-scrollbar-thumb {
  background: #3a3530;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #4a4540;
}
```

**Step 2: 创建 useDarkMode hook**

Create `src/hooks/use_dark_mode.ts`：

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'

export function useDarkMode() {
  const [is_dark, set_is_dark] = useState(false)
  const [mounted, set_mounted] = useState(false)

  useEffect(() => {
    set_mounted(true)
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      const enabled = saved === 'true'
      set_is_dark(enabled)
      document.documentElement.classList.toggle('dark', enabled)
    } else {
      const prefers_dark = window.matchMedia('(prefers-color-scheme: dark)').matches
      set_is_dark(prefers_dark)
      document.documentElement.classList.toggle('dark', prefers_dark)
    }
  }, [])

  const toggle = useCallback(() => {
    set_is_dark(prev => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('darkMode', String(next))
      return next
    })
  }, [])

  return { is_dark, toggle, mounted }
}
```

**Step 3: 在 Navigation 中添加深色模式切换按钮**

在 `src/components/Navigation.tsx` 的导航栏右侧（或新增一个浮动按钮），添加月亮/太阳图标切换。

**Step 4: 更新各组件使用 CSS 变量替代硬编码颜色**

全局替换模式（主要文件）：
- `Calendar.tsx`: `bg-[#FFF9F3]` → `bg-[var(--cream)]`
- `ChatInterface.tsx`: 同上模式
- `DrawingBoard.tsx`: 同上模式
- `ProfileForm.tsx`: 同上模式
- `Navigation.tsx`: 同上模式

注意：只替换背景色、文字色、边框色等语义颜色。渐变的高亮色（如按钮 `from-[#FF8A7A] to-[#FFB5A8]`）在深色模式下保持不变或微调。

**Step 5: 验证构建通过**

Run: `cd Warmth && npm run build`
Expected: 构建成功

**Step 6: Commit**
```
feat: add dark mode support with CSS variables and toggle
```

---

## Task 3: 数据导出/备份功能 (P0)

**Files:**
- Create: `src/hooks/use_data_backup.ts`
- Modify: `src/components/ProfileForm.tsx`

**Step 1: 创建 useDataBackup hook**

Create `src/hooks/use_data_backup.ts`：

```typescript
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
        // 清空现有数据
        await Promise.all([
          db.diary.clear(),
          db.knowledge.clear(),
          db.artworks.clear(),
          db.chatMessages.clear(),
        ])

        // 导入数据
        if (data.diary?.length) await db.diary.bulkAdd(data.diary)
        if (data.knowledge?.length) await db.knowledge.bulkAdd(data.knowledge)
        if (data.artworks?.length) await db.artworks.bulkAdd(data.artworks)
        if (data.chatMessages?.length) await db.chatMessages.bulkAdd(data.chatMessages)
        if (data.profile) await db.profile.put(data.profile)
        if (data.settings) await db.settings.put(data.settings)
      })

      return { success: true, message: `成功导入 ${data.diary.length} 条日记` }
    } catch (error) {
      return { success: false, message: '导入失败：文件格式错误' }
    }
  }

  return { export_data, import_data }
}
```

**Step 2: 在 ProfileForm 中添加导出/导入按钮**

在个人资料页面底部添加"导出数据"和"导入数据"两个按钮。

**Step 3: 验证构建通过**

Run: `cd Warmth && npm run build`
Expected: 构建成功

**Step 4: Commit**
```
feat: add data export/import backup functionality
```

---

## Task 4: 绘画板修复 — Touch 事件 + 撤销/重做 + 橡皮擦 (P0)

**Files:**
- Rewrite: `src/components/DrawingBoard.tsx`

**Step 1: 重写 DrawingBoard 组件**

关键改动：
1. 添加 touch 事件支持（`onTouchStart`, `onTouchMove`, `onTouchEnd`）
2. 实现撤销/重做：使用 `history` 栈保存 ImageData 快照
3. 添加橡皮擦工具（设置 `globalCompositeOperation = 'destination-out'` 或用白色画笔）
4. 自适应画布尺寸（根据容器大小动态设置 canvas 尺寸）
5. 修复中英混杂的 `关 close` → `关闭`

核心代码结构：

```typescript
// 历史栈
const history_ref = useRef<ImageData[]>([])
const history_index_ref = useRef<number>(-1)

const save_to_history = () => {
  const canvas = canvas_ref.current
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const image_data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  // 截断 redo 历史
  history_ref.current = history_ref.current.slice(0, history_index_ref.current + 1)
  history_ref.current.push(image_data)
  history_index_ref.current = history_ref.current.length - 1
  // 限制历史长度
  if (history_ref.current.length > 50) {
    history_ref.current.shift()
    history_index_ref.current--
  }
}

const undo = () => {
  if (history_index_ref.current <= 0) return
  history_index_ref.current--
  const ctx = canvas_ref.current?.getContext('2d')
  if (!ctx || !canvas_ref.current) return
  ctx.putImageData(history_ref.current[history_index_ref.current], 0, 0)
}

const redo = () => {
  if (history_index_ref.current >= history_ref.current.length - 1) return
  history_index_ref.current++
  const ctx = canvas_ref.current?.getContext('2d')
  if (!ctx || !canvas_ref.current) return
  ctx.putImageData(history_ref.current[history_index_ref.current], 0, 0)
}

// Touch 事件转换
const get_touch_pos = (e: React.TouchEvent<HTMLCanvasElement>) => {
  const canvas = canvas_ref.current
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  const touch = e.touches[0]
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (touch.clientX - rect.left) * scaleX,
    y: (touch.clientY - rect.top) * scaleY,
  }
}

const start_drawing_touch = (e: React.TouchEvent<HTMLCanvasElement>) => {
  e.preventDefault()
  const pos = get_touch_pos(e)
  const ctx = canvas_ref.current?.getContext('2d')
  if (!ctx) return
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
  set_is_drawing(true)
}
```

工具栏添加：撤销、重做、橡皮擦按钮。

**Step 2: 验证构建通过**

Run: `cd Warmth && npm run build`
Expected: 构建成功

**Step 3: Commit**
```
feat: fix drawing board with touch support, undo/redo, eraser
```

---

## Task 5: 对话历史持久化 (P1)

**Files:**
- Modify: `src/components/ChatInterface.tsx`
- Modify: `src/lib/db.ts`（已在 Task 1 完成）
- Modify: `src/context/AppContext.tsx`

**Step 1: 在 AppContext 中添加 chatMessages 相关 action**

```typescript
// 新增 action 类型
| { type: 'LOAD_CHAT_MESSAGES'; payload: ChatMessage[] }
| { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
| { type: 'CLEAR_CHAT_MESSAGES' }

// 在 reducer 中处理
case 'LOAD_CHAT_MESSAGES':
  return { ...state, chatMessages: action.payload };
case 'ADD_CHAT_MESSAGE':
  return { ...state, chatMessages: [...state.chatMessages, action.payload] };
case 'CLEAR_CHAT_MESSAGES':
  return { ...state, chatMessages: [] };
```

**Step 2: 在 AppProvider 中添加 chatMessages helper**

```typescript
const addChatMessage = async (msg: ChatMessage) => {
  await db.chatMessages.add(msg);
  dispatch({ type: 'ADD_CHAT_MESSAGE', payload: msg });
};

const clearChatMessages = async () => {
  await db.chatMessages.clear();
  dispatch({ type: 'CLEAR_CHAT_MESSAGES' });
};
```

**Step 3: 修改 ChatInterface 使用持久化消息**

- 组件挂载时从 state 加载消息
- 发送消息时通过 context 持久化
- 清空时通过 context 删除

**Step 4: 验证构建通过**

Run: `cd Warmth && npm run build`
Expected: 构建成功

**Step 5: Commit**
```
feat: persist chat history to IndexedDB
```

---

## Task 6: 情绪趋势图 + 周报/月报 (P1)

**Files:**
- Create: `src/components/Calendar/MoodStats.tsx`
- Modify: `src/components/Calendar.tsx`

**Step 1: 安装 recharts**

Run: `cd Warmth && npm install recharts`

**Step 2: 创建 MoodStats 组件**

Create `src/components/Calendar/MoodStats.tsx`：

功能：
- 月度情绪分布饼图（各心情天数占比）
- 近7天情绪趋势折线图
- 打卡连续天数（streak）
- 本月打卡率统计

```typescript
'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { DiaryEntry, MOOD_COLORS, DEFAULT_MOODS } from '@/types'

interface MoodStatsProps {
  entries: DiaryEntry[]
}

export default function MoodStats({ entries }: MoodStatsProps) {
  // 月度情绪分布
  const pie_data = useMemo(() => {
    const counts: Record<string, number> = {}
    entries.forEach(e => { counts[e.mood] = (counts[e.mood] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: MOOD_COLORS[name] || '#ccc',
    }))
  }, [entries])

  // 近7天趋势（心情映射为数字）
  const trend_data = useMemo(() => {
    const mood_score: Record<string, number> = {
      '开心': 5, '平静': 4, '一般': 3, '难过': 2, '糟糕': 1,
    }
    const last_7_days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const date_str = date.toISOString().split('T')[0]
      const entry = entries.find(e => e.date === date_str)
      return {
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        score: entry ? (mood_score[entry.mood] || 3) : null,
        mood: entry?.mood || null,
      }
    })
    return last_7_days
  }, [entries])

  // 连续打卡天数
  const streak = useMemo(() => {
    let count = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const date_str = date.toISOString().split('T')[0]
      if (entries.some(e => e.date === date_str)) {
        count++
      } else {
        break
      }
    }
    return count
  }, [entries])

  // 本月打卡率
  const check_in_rate = useMemo(() => {
    const now = new Date()
    const days_in_month = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const days_passed = now.getDate()
    const checked = entries.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    return Math.round((checked / days_passed) * 100)
  }, [entries])

  // ... 渲染 JSX
}
```

**Step 3: 在 Calendar.tsx 中集成 MoodStats**

在月历统计卡片区域替换为新的 MoodStats 组件。

**Step 4: 验证构建通过**

Run: `cd Warmth && npm run build`
Expected: 构建成功

**Step 5: Commit**
```
feat: add mood trend charts, streak counter and monthly stats
```

---

## Task 7: 每日打卡提醒 (P1)

**Files:**
- Create: `src/hooks/use_reminder.ts`
- Modify: `src/components/ProfileForm.tsx`

**Step 1: 创建 useReminder hook**

Create `src/hooks/use_reminder.ts`：

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'

interface ReminderSettings {
  enabled: boolean
  hour: number // 0-23
  minute: number // 0-59
}

export function useReminder() {
  const [settings, set_settings] = useState<ReminderSettings>({
    enabled: false,
    hour: 21,
    minute: 0,
  })

  useEffect(() => {
    const saved = localStorage.getItem('reminderSettings')
    if (saved) set_settings(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('reminderSettings', JSON.stringify(settings))
  }, [settings])

  const request_permission = async () => {
    if (!('Notification' in window)) return false
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  const check_reminder = useCallback(() => {
    if (!settings.enabled) return
    const now = new Date()
    if (now.getHours() === settings.hour && now.getMinutes() === settings.minute) {
      const today = now.toISOString().split('T')[0]
      const last_reminder = localStorage.getItem('lastReminder')
      if (last_reminder === today) return

      new Notification('心情日记 🌸', {
        body: '今天的心情记录了吗？来写下今天的感受吧~',
        icon: '/icon-192.png',
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
```

**Step 2: 在 ProfileForm 中添加提醒设置**

在个人资料页面添加一个"每日提醒"开关和时间选择器。

**Step 3: 验证构建通过**

Run: `cd Warmth && npm run build`
Expected: 构建成功

**Step 4: Commit**
```
feat: add daily check-in reminder with browser notifications
```

---

## Task 8: AI 聊天改进 + 知识库可编辑 (P2)

**Files:**
- Rewrite: `src/components/ChatInterface.tsx`
- Modify: `src/context/AppContext.tsx`

**Step 1: 添加知识库编辑功能**

在 AppContext 中添加 `updateKnowledge` action：

```typescript
| { type: 'UPDATE_KNOWLEDGE'; payload: KnowledgeItem }

// reducer
case 'UPDATE_KNOWLEDGE':
  return {
    ...state,
    knowledge: state.knowledge.map(k =>
      k.id === action.payload.id ? action.payload : k
    ),
  };

// helper
const updateKnowledge = async (item: KnowledgeItem) => {
  await db.knowledge.put(item);
  dispatch({ type: 'UPDATE_KNOWLEDGE', payload: item });
};
```

**Step 2: 改进 ChatInterface 知识库面板**

- 知识库列表项添加"编辑"按钮
- 点击编辑弹出编辑弹窗（复用添加表单，预填数据）
- 添加知识库搜索过滤功能

**Step 3: 改进 TF-IDF 性能**

添加 IDF 缓存机制：

```typescript
let cached_idf: Map<string, number> | null = null
let cached_docs_key: string = ''

function get_idf_with_cache(documents: string[]): Map<string, number> {
  const key = documents.map(d => d.slice(0, 100)).join('||')
  if (cached_idf && cached_docs_key === key) return cached_idf
  cached_idf = computeIDF(documents)
  cached_docs_key = key
  return cached_idf
}
```

**Step 4: 修复 pdf-parse 兼容性**

将 `src/lib/pdf.ts` 中的 `pdf-parse` 替换为浏览器端兼容方案：

```typescript
export async function parsePdfFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  // 使用浏览器内置的简单文本提取（作为降级方案）
  // 或动态 import pdfjs-dist
  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let text = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((item: any) => item.str).join(' ') + '\n'
    }
    return text.trim()
  } catch {
    throw new Error('PDF 解析失败，请确保网络连接正常')
  }
}
```

Run: `cd Warmth && npm install pdfjs-dist`

**Step 5: 验证构建通过**

Run: `cd Warmth && npm run build`
Expected: 构建成功

**Step 6: Commit**
```
feat: improve AI chat with editable knowledge base and TF-IDF caching
```

---

## Task 9: 组件拆分重构 (P3)

**Files:**
- Create: `src/components/Calendar/CalendarHeader.tsx`
- Create: `src/components/Calendar/CalendarGrid.tsx`
- Create: `src/components/Calendar/MoodModal.tsx`
- Create: `src/components/Calendar/MoodStats.tsx`（已在 Task 6 创建）
- Create: `src/components/Chat/KnowledgePanel.tsx`
- Create: `src/components/Chat/MessageList.tsx`
- Create: `src/components/Chat/MessageInput.tsx`
- Create: `src/components/Drawing/Canvas.tsx`
- Create: `src/components/Drawing/Toolbar.tsx`
- Create: `src/components/Drawing/ArtworkGallery.tsx`
- Rewrite: `src/components/Calendar.tsx`（精简为组合组件）
- Rewrite: `src/components/ChatInterface.tsx`（精简为组合组件）
- Rewrite: `src/components/DrawingBoard.tsx`（精简为组合组件）

**Step 1: 拆分 Calendar 组件**

将 393 行的 `Calendar.tsx` 拆分为：
- `CalendarHeader.tsx` — 月份切换、今天按钮
- `CalendarGrid.tsx` — 日期网格渲染
- `MoodModal.tsx` — 打卡弹窗
- `MoodStats.tsx` — 统计卡片（Task 6 已创建）
- `Calendar.tsx` — 主组件，组合以上子组件

**Step 2: 拆分 ChatInterface 组件**

将 319 行的 `ChatInterface.tsx` 拆分为：
- `KnowledgePanel.tsx` — 知识库管理面板
- `MessageList.tsx` — 消息列表渲染
- `MessageInput.tsx` — 输入框和发送按钮
- `ChatInterface.tsx` — 主组件，组合以上子组件

**Step 3: 拆分 DrawingBoard 组件**

将 280 行的 `DrawingBoard.tsx` 拆分为：
- `Canvas.tsx` — 画布和绘制逻辑
- `Toolbar.tsx` — 工具栏（颜色、粗细、撤销、重做、橡皮擦）
- `ArtworkGallery.tsx` — 作品画廊和预览
- `DrawingBoard.tsx` — 主组件，组合以上子组件

**Step 4: 验证构建通过**

Run: `cd Warmth && npm run build`
Expected: 构建成功

**Step 5: Commit**
```
refactor: split large components into sub-components
```

---

## Task 10: PWA 离线支持 (P3)

**Files:**
- Create: `public/manifest.json`
- Modify: `src/app/layout.tsx`
- Modify: `next.config.js`

**Step 1: 创建 manifest.json**

Create `public/manifest.json`：

```json
{
  "name": "心情日记 - Warmth",
  "short_name": "Warmth",
  "description": "个人情感助手 - 记录每一天的心情",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFF9F3",
  "theme_color": "#FF8A7A",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Step 2: layout.tsx 中确认 manifest 引用**

已在 `src/app/layout.tsx` 中有 `manifest: '/manifest.json'`，确认即可。

**Step 3: 安装 next-pwa**

Run: `cd Warmth && npm install next-pwa`

**Step 4: 配置 next.config.js**

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA({
  reactStrictMode: true,
})
```

**Step 5: 验证构建通过**

Run: `cd Warmth && npm run build`
Expected: 构建成功，`public/` 下生成 `workbox-*.js`

**Step 6: Commit**
```
feat: add PWA support with offline caching
```

---

## 执行顺序

由于 Task 9（组件拆分）会重写多个文件，建议执行顺序：

1. **Task 1** — DB Schema 扩展（基础，其他 Task 依赖）
2. **Task 3** — 数据导出/备份（独立，优先级 P0）
3. **Task 4** — 绘画板修复（独立，优先级 P0）
4. **Task 2** — 深色模式（独立，优先级 P2）
5. **Task 5** — 对话持久化（依赖 Task 1）
6. **Task 6** — 情绪趋势图（依赖 Task 1）
7. **Task 7** — 每日提醒（独立）
8. **Task 8** — AI 聊天改进 + 知识库编辑（依赖 Task 1）
9. **Task 9** — 组件拆分（最后做，因为会重写文件）
10. **Task 10** — PWA 支持（独立，最后）
