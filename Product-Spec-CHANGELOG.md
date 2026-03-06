# Product-Spec-CHANGELOG.md

## 更新记录

### 2026-03-01

**版本**: 1.0.0

**新增功能**:
- 日历打卡：月历视图，支持5种心情+自定义
- AI聊天：基于本地TF-IDF知识库
- 绘画板：自由绘画，支持保存作品
- 个人资料：昵称、头像等个人信息

**技术栈**:
- Next.js 14 + Tailwind CSS
- IndexedDB (Dexie.js) 本地存储
- Canvas + Fabric.js 绘画

**确定的需求**:
- 数据全部本地存储（IndexedDB）
- 心情5种+自定义
- 知识库支持手动输入+文件上传
- 绘画作品保存到本地
