# Warmth 前端彻底重构计划

> **For Claude:** 使用 subagent-driven 或 executing 执行此计划

**Goal:** 将 Warmth 打造成真正温暖治愈系的心灵陪伴应用，从视觉到交互完全耳目一新

**Architecture:** 全新设计系统 + 组件级重构，不是小修小补，是从颜色、布局、动效、情感的全面升级

**Tech Stack:** Next.js 14 + Tailwind CSS + React Context + IndexedDB(Dexie)

---

## 核心设计理念

### 视觉方向：温暖治愈系 2.0
- **不再是 Apple 冷淡风**，而是温暖的、柔软的、像被子一样包裹的感觉
- **色调**：珊瑚粉 + 奶油白 + 淡橙 + 薄荷绿辅助
- **质感**：哑光、柔软边缘、深度通过阴影而非颜色
- **动效**：缓慢、轻柔、像呼吸一样自然

### 布局理念
- **全屏沉浸**：减少边框和分割线，让内容呼吸
- **卡片浮起**：卡片像纸张一样堆叠，有轻微阴影
- **底部导航**：不再是悬浮岛，而是融入背景的柔和条

---

## 任务清单

### Task 1: 全局样式重写 (globals.css)

**Files:**
- Modify: `src/app/globals.css`

**Step 1: 重新定义颜色系统**
```css
/* 全新温暖治愈系配色 */
--coral: #FF8A7A;           /* 主色：暖珊瑚 */
--coral-soft: #FFB5A8;      /* 柔和珊瑚 */
--cream: #FFF8F5;           /* 奶油白背景 */
--peach: #FFE8E0;           /* 桃子色 */
--warm-brown: #8B6B61;      /* 暖棕色文字 */
--mint-cream: #E8F5F0;      /* 薄荷奶油（辅助） */

/* 心情色系 - 温暖版本 */
--mood-happy: #FFD166;      /* 温暖黄 */
--mood-peaceful: #A8D8EA;   /* 平静蓝（柔和） */
--mood-neutral: #FFE5B8;     /* 一般暖黄 */
--mood-sad: #B8D4E8;        /* 难过柔蓝 */
--mood-bad: #D4D4D4;        /* 糟糕灰 */
```

**Step 2: 重写背景和基础样式**
```css
body {
  font-family: system-ui, -apple-system, 'PingFang SC', sans-serif;
  background: var(--cream);
  color: var(--warm-brown);
  min-height: 100vh;
}

.warm-gradient {
  background: linear-gradient(180deg, var(--cream) 0%, var(--peach) 100%);
}
```

**Step 3: 定义温暖卡片样式**
```css
.warm-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 2px 16px rgba(139, 107, 97, 0.08);
  border: 1px solid rgba(255, 181, 168, 0.2);
}
```

---

### Task 2: 首页日历完全重构 (Calendar.tsx)

**Files:**
- Modify: `src/components/Calendar.tsx`

**Design Changes:**
- 主色改为柔和珊瑚 `#FFB5A8`
- 卡片改为全宽、柔和阴影
- 日期格子用 emoji 大尺寸居中显示心情
- 月份切换按钮组重新设计
- 弹窗从底部滑出，更加沉浸

**Layout Concept:**
```
┌─────────────────────────────────┐
│         🌸 心情日记              │  ← 标题区：居中、温暖
│         记录每一天的美好           │
├─────────────────────────────────┤
│    ◀  2026年 4月  ▶             │  ← 月份切换：简洁
├─────────────────────────────────┤
│  日  一  二  三  四  五  六       │
│                              1   │
│  2   3   😊  5   6   7   8     │  ← 日期网格：emoji 居中
│  ...                             │
├─────────────────────────────────┤
│  📊 本月心情                     │  ← 统计：横向滚动
│  😊 开心  5   😢 难过  3        │
└─────────────────────────────────┘
```

---

### Task 3: 底部导航重新设计 (Navigation.tsx)

**Files:**
- Modify: `src/components/Navigation.tsx`

**Design Changes:**
- 不再是悬浮岛，而是底部柔和条
- 图标 + 文字纵向排列
- 选中态：图标放大 + 主色高亮
- 背景融入页面，不是遮罩

**Layout Concept:**
```
┌─────────────────────────────────┐
│                                 │
│         内容区域                 │
│                                 │
├─────────────────────────────────┤
│   🌸日记    💬聊天    🎨画板    │  ← 底部导航：横向排列
│                                 │     选中时文字变大
└─────────────────────────────────┘
```

---

### Task 4: 聊天页面全新设计 (ChatInterface.tsx)

**Files:**
- Modify: `src/components/ChatInterface.tsx`

**Design Changes:**
- 左侧知识库改为抽屉式
- 聊天气泡更圆润、柔和
- 用户消息：右侧、暖黄色渐变
- AI 消息：左侧、白色卡片
- 输入框更大、更柔和
- 空状态：温暖插画风格

---

### Task 5: 绘画板新设计 (DrawingBoard.tsx)

**Files:**
- Modify: `src/components/DrawingBoard.tsx`

**Design Changes:**
- 工具栏横向排列在顶部
- 颜色选择器改为圆角方块网格
- 画布边框更柔和
- 画廊改为瀑布流或横向滚动
- 整体更简洁、不拥挤

---

### Task 6: 个人资料页新设计 (ProfileForm.tsx)

**Files:**
- Modify: `src/components/ProfileForm.tsx`

**Design Changes:**
- 头像区域更大、更突出
- 表单分组清晰
- 性别选择改为胶囊按钮组
- 保存状态更柔和
- 背景装饰更温暖

---

### Task 7: Tailwind 配置更新 (tailwind.config.js)

**Files:**
- Modify: `tailwind.config.js`

**Update:**
- 添加完整 coral 色系
- 添加 warm-gray 色系
- 添加 mood 色系
- 自定义圆角 radius
- 扩展 boxShadow

---

## 执行顺序

1. **globals.css** - 设计系统基础
2. **tailwind.config.js** - Tailwind 扩展
3. **Calendar.tsx** - 首页（用户最常用）
4. **Navigation.tsx** - 导航（全局影响）
5. **ChatInterface.tsx** - 聊天页
6. **DrawingBoard.tsx** - 画板页
7. **ProfileForm.tsx** - 个人资料页

---

## 验收标准

- [ ] 整体视觉从"冷淡 Apple 风"变为"温暖治愈风"
- [ ] 颜色统一使用珊瑚粉 + 奶油白系
- [ ] 圆角全部加圆润 (20px+)
- [ ] 卡片阴影柔和、不突兀
- [ ] 动效缓慢自然，不突兀
- [ ] 所有页面风格统一

---

## 提交记录

每完成一个任务提交一次：
```
git commit -m "refactor: redesign [component] with warm healing style"
```
