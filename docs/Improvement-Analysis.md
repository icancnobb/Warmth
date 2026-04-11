# Warmth 功能改进与优化建议

> 基于高频重度用户视角分析，2026-04-11

---

## 一、核心功能缺陷（严重影响使用）

### 1. 日历心情模块 — 缺少数据洞察

| 问题 | 说明 |
|------|------|
| 没有趋势图 | 打卡一个月后最想看的是情绪变化曲线，但只有简单计数标签 |
| 没有连续打卡 | 缺少 streak 机制，没有"你已连续打卡X天"的正向激励 |
| 没有历史记录列表 | 只能通过日历点进去看，没法快速浏览所有记录 |
| 没有搜索 | 想找某天的备注内容，只能一个个日期点 |
| 没有年度/周报总结 | 月度情绪报告、本周心情概览完全没有 |

### 2. AI 聊天模块 — 名不副实

| 问题 | 说明 |
|------|------|
| 不是真正的 AI | 用的是 TF-IDF 关键词匹配，问"我今天心情怎么样"根本答不了 |
| 对话不持久化 | 刷新页面消息全没了，每次重新开始 |
| 知识库不可编辑 | 添加了就不能改内容，只能删除重建 |
| 无法感知上下文 | 不关联用户的心情记录、个人资料，完全不"懂你" |

### 3. 绘画板 — 基本不可用

| 问题 | 说明 |
|------|------|
| 移动端无法使用 | 只监听了 `onMouseDown/Move/Up`，没有 `touch` 事件支持 |
| 没有撤销/重做 | 画错一笔只能清空重来 |
| 没有橡皮擦 | Product Spec 里写了但没实现 |
| Fabric.js 白装 | `package.json` 里装了 `fabric@7.2.0` 但完全没用到 |
| 画布固定尺寸 | 600×400，不同屏幕尺寸体验差异巨大 |
| 中英混杂 | 预览弹窗里 `关 close`，体验粗糙 |

---

## 二、用户体验问题（影响留存）

### 4. 缺少数据安全

- **没有导出/备份**：所有数据存在 IndexedDB，清浏览器数据就全没了
- **没有导入功能**：换设备没法迁移数据

### 5. 缺少提醒机制

- **没有每日打卡提醒**：用户会忘记打卡
- 没有连续打卡提醒

### 6. 缺少个性化设置

| 功能 | 说明 |
|------|------|
| 没有深色模式 | 晚上用很刺眼 |
| 没有主题色切换 | 全是粉色调，不是所有人都喜欢 |
| 没有字体大小调节 | |

### 7. 没有 PWA 离线支持

- `layout.tsx` 里引用了 `manifest.json` 但项目里没有这个文件
- 没有 Service Worker，不是真正的 PWA
- 没有安装到桌面的引导

---

## 三、代码/技术债务

### 8. 组件过于臃肿

- `Calendar.tsx` 393行
- `ChatInterface.tsx` 319行
- 单文件混合了业务逻辑、样式、内联 SVG
- 应拆分为：UI 组件 + 业务 hook + 常量

### 9. TF-IDF 实现性能差

- 每次发送消息都重新计算所有文档的 TF-IDF 向量，O(n) 复杂度
- 知识库大时会卡顿
- 应该缓存 IDF，增量更新 TF

### 10. `pdf-parse` 不适用于浏览器

- `pdf-parse` 是 Node.js 库，不能在浏览器端直接用 `new PDFParse()`
- 当前可能因 Next.js SSR 能工作，但浏览器端会报错

---

## 四、优先级建议

| 优先级 | 改进项 | 理由 |
|--------|--------|------|
| **P0** | 绘画板添加 touch 事件 + 撤销/重做 + 橡皮擦 | 移动端完全无法使用 |
| **P0** | 数据导出/备份功能 | 用户数据安全 |
| **P1** | 情绪趋势图 + 周/月报 | 核心价值，用户留存 |
| **P1** | 对话历史持久化 | 用户期望聊天记录不丢失 |
| **P1** | 每日打卡提醒 | 用户粘性 |
| **P2** | 深色模式 | 夜间体验 |
| **P2** | AI 聊天接入真正的大模型 API | 当前 TF-IDF 体验太差 |
| **P2** | 知识库可编辑 | 基础 CRUD 不完整 |
| **P3** | 组件拆分重构 | 技术债务 |
| **P3** | PWA 离线支持 | 可有可无的增强 |

---

## 五、具体改进方案

### 5.1 绘画板移动端修复

**问题**：移动端无法使用，只监听了鼠标事件

**方案**：添加 touch 事件支持

```tsx
// 移动端支持
onTouchStart={startDrawing}
onTouchMove={draw}
onTouchEnd={stopDrawing}
```

### 5.2 绘画板撤销/重做

**问题**：没有撤销机制

**方案**：使用命令模式，保存操作历史栈

```tsx
interface DrawCommand {
  type: 'stroke' | 'clear'
  data: ImageData | null
}
const undoStack: DrawCommand[] = []
const redoStack: DrawCommand[] = []
```

### 5.3 数据导出/备份

**问题**：数据无备份

**方案**：导出为 JSON 文件，支持导入恢复

```tsx
// 导出
const exportData = {
  diary: await db.diary.toArray(),
  knowledge: await db.knowledge.toArray(),
  artworks: await db.artworks.toArray(),
  profile: await db.profile.toArray(),
  exportedAt: new Date().toISOString()
}
// 下载 JSON 文件

// 导入
const file = e.target.files?.[0]
const data = JSON.parse(await file.text())
// 逐表导入
```

### 5.4 深色模式

**问题**：晚上使用刺眼

**方案**：使用 CSS 变量 + Tailwind dark mode

```tsx
// tailwind.config.js
darkMode: 'class'

// 全局 CSS 变量
--color-bg: #FFF9F3
--color-bg-dark: #1a1a1a

// 切换按钮
<button onClick={() => document.documentElement.classList.toggle('dark')}>
```

### 5.5 情绪趋势图

**问题**：没有数据可视化

**方案**：使用轻量级图表库如 Chart.js 或纯 CSS/SVG

```tsx
// 月度情绪分布饼图
// 周趋势折线图
// 使用 Recharts 或轻量级方案
```

### 5.6 对话历史持久化

**问题**：刷新页面聊天记录丢失

**方案**：保存到 IndexedDB

```tsx
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}
// 保存到 db.chatMessages
```

---

## 六、技术债务清理

### 6.1 组件拆分建议

```
src/components/
├── Calendar/
│   ├── Calendar.tsx          # 主组件（精简）
│   ├── CalendarHeader.tsx     # 月份切换头部
│   ├── CalendarGrid.tsx       # 日期网格
│   ├── MoodModal.tsx         # 打卡弹窗
│   └── MoodStats.tsx         # 统计卡片
├── Chat/
│   ├── ChatInterface.tsx      # 主组件（精简）
│   ├── KnowledgePanel.tsx     # 知识库面板
│   ├── MessageList.tsx        # 消息列表
│   └── MessageInput.tsx      # 输入框
└── Drawing/
    ├── DrawingBoard.tsx       # 主组件（精简）
    ├── Canvas.tsx             # 画布组件
    ├── Toolbar.tsx            # 工具栏
    └── ArtworkGallery.tsx     # 作品画廊
```

### 6.2 TF-IDF 缓存优化

```tsx
// 缓存 IDF 值
let cachedIDF: Map<string, number> | null = null
let cachedDocuments: string[] = []

function computeIDFWithCache(documents: string[]): Map<string, number> {
  const docsKey = documents.join('|||')
  if (cachedIDF && cachedDocuments.join('|||') === docsKey) {
    return cachedIDF
  }
  cachedIDF = computeIDF(documents)
  cachedDocuments = documents
  return cachedIDF
}
```

### 6.3 PDF 解析修复

**问题**：`pdf-parse` 不适用于浏览器

**方案**：使用 `pdfjs-dist`

```tsx
import * as pdfjsLib from 'pdfjs-dist'

export async function parsePdfFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item: any) => item.str).join(' ') + '\n'
  }
  return text
}
```

---

## 七、Product-Spec 更新建议

建议将以下功能加入 Product-Spec：

- [ ] 深色模式
- [ ] 数据导出/导入
- [ ] 情绪趋势图
- [ ] 周报/月报
- [ ] 对话历史持久化
- [ ] 知识库编辑功能
- [ ] 绘画板：撤销/重做、橡皮擦、touch 支持
- [ ] 每日打卡提醒
- [ ] PWA 离线支持

---

*本文档由 AI 辅助分析，基于源码审查和用户体验角度生成*
