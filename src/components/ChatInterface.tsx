'use client'

import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { v4 as uuidv4 } from 'uuid'
import { parsePdfFile, isValidFileType } from '@/lib/pdf'

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[\s\n\r,.!?;:()（）【】""''""''、，。!?；：]/).filter(w => w.length > 0)
}

function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  tokens.forEach(token => { tf.set(token, (tf.get(token) || 0) + 1) })
  tokens.forEach(token => { tf.set(token, tf.get(token)! / tokens.length) })
  return tf
}

function computeIDF(documents: string[]): Map<string, number> {
  const idf = new Map<string, number>()
  const N = documents.length
  const docsWithTerm = new Map<string, number>()
  documents.forEach(doc => {
    const tokens = [...new Set(tokenize(doc))]
    tokens.forEach(token => { docsWithTerm.set(token, (docsWithTerm.get(token) || 0) + 1) })
  })
  docsWithTerm.forEach((count, term) => { idf.set(term, Math.log((N + 1) / (count + 1)) + 1) })
  return idf
}

function cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
  let dotProduct = 0, norm1 = 0, norm2 = 0
  vec1.forEach((val, term) => {
    norm1 += val * val
    if (vec2.has(term)) dotProduct += val * vec2.get(term)!
  })
  vec2.forEach(val => { norm2 += val * val })
  if (norm1 === 0 || norm2 === 0) return 0
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
}

export default function ChatInterface() {
  const { state, addChatMessage, clearChatMessages, addKnowledge, updateKnowledge, deleteKnowledge } = useApp()
  const { knowledge, chatMessages } = state
  const [input, setInput] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [showKnowledge, setShowKnowledge] = useState(false)
  const [mounted, setMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // TF-IDF 缓存
  const idfCacheRef = useRef<Map<string, number> | null>(null)
  const docsKeyRef = useRef<string>('')

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  const handleAddManual = async () => {
    if (!title.trim() || !content.trim()) return
    await addKnowledge({ id: uuidv4(), title: title.trim(), content: content.trim(), source: 'manual', createdAt: Date.now() })
    setTitle('')
    setContent('')
    setShowAddForm(false)
    invalidateCache()
  }

  const handleUpdateItem = async () => {
    if (!editingItem || !title.trim() || !content.trim()) return
    const item = knowledge.find(k => k.id === editingItem)
    if (!item) return
    await updateKnowledge({ ...item, title: title.trim(), content: content.trim() })
    setEditingItem(null)
    setTitle('')
    setContent('')
    invalidateCache()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!isValidFileType(file)) { alert('不支持的文件格式，请上传 .txt、.md 或 .pdf 文件'); return }
    try {
      let text = ''
      if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        text = await file.text()
      } else if (file.name.endsWith('.pdf')) {
        text = await parsePdfFile(file)
      }
      if (!text.trim()) { alert('无法从文件中提取文本内容'); return }
      await addKnowledge({ id: uuidv4(), title: file.name, content: text, source: 'file', fileName: file.name, createdAt: Date.now() })
      invalidateCache()
      alert('文件上传成功！')
    } catch (error) {
      console.error('File upload error:', error)
      alert('文件处理失败，请重试')
    }
  }

  const invalidateCache = () => {
    idfCacheRef.current = null
    docsKeyRef.current = ''
  }

  const getIDFCached = (documents: string[]): Map<string, number> => {
    const key = documents.map(d => d.slice(0, 100)).join('||')
    if (idfCacheRef.current && docsKeyRef.current === key) return idfCacheRef.current
    const idf = computeIDF(documents)
    idfCacheRef.current = idf
    docsKeyRef.current = key
    return idf
  }

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = { id: uuidv4(), role: 'user' as const, content: input, createdAt: Date.now() }
    await addChatMessage(userMsg)
    setInput('')
    setIsTyping(true)
    const answer = await getAnswer(input)
    setIsTyping(false)
    const assistantMsg = { id: uuidv4(), role: 'assistant' as const, content: answer, createdAt: Date.now() }
    await addChatMessage(assistantMsg)
  }

  const getAnswer = async (query: string): Promise<string> => {
    if (knowledge.length === 0) return '知识库为空，请先添加知识内容。'
    const contents = knowledge.map(d => d.content)
    const idf = getIDFCached(contents)
    const queryTokens = tokenize(query)
    const queryTF = computeTF(queryTokens)
    const queryVec = new Map<string, number>()
    queryTF.forEach((val, term) => { queryVec.set(term, val * (idf.get(term) || 1)) })
    let bestDoc = '', bestScore = 0
    knowledge.forEach(doc => {
      const docTokens = tokenize(doc.content)
      const docTF = computeTF(docTokens)
      const docVec = new Map<string, number>()
      docTF.forEach((val, term) => { docVec.set(term, val * (idf.get(term) || 1)) })
      const score = cosineSimilarity(queryVec, docVec)
      if (score > bestScore) { bestScore = score; bestDoc = doc.content }
    })
    if (bestScore < 0.1 || !bestDoc) return '知识库中没有相关信息。'
    const sentences = bestDoc.split(/[。！？\n]/).filter(s => s.trim().length > 0)
    const relevantSentences = sentences.filter(s => tokenize(query).some(t => tokenize(s).includes(t)))
    return relevantSentences.length > 0 ? relevantSentences.slice(0, 3).join('。') + '。' : bestDoc.slice(0, 200) + '...'
  }

  const startEdit = (id: string) => {
    const item = knowledge.find(k => k.id === id)
    if (!item) return
    setEditingItem(id)
    setTitle(item.title)
    setContent(item.content)
    setShowAddForm(true)
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 pt-14 pb-20 flex flex-col">
      <div className="fixed inset-0 -z-10 bg-[var(--cream)]" />

      {/* 头部 */}
      <div className="mx-3 mt-3 bg-white dark:bg-[#2a2520] rounded-2xl p-4 shadow-[0_4px_16px_rgba(93,78,71,0.06)] border-2 border-dashed border-[var(--handrawn-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FFE8E0] to-[#FFD4C4] flex items-center justify-center shadow-md border border-[#FFB5A8]/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF8A7A">
                <circle cx="8" cy="10" r="1.5"/>
                <circle cx="12" cy="10" r="1.5"/>
                <circle cx="16" cy="10" r="1.5"/>
                <path d="M9 15c1.5 1 3 1.5 6 1.5s4.5-.5 6-1.5" stroke="#FF8A7A" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="font-semibold text-[var(--text-primary)]">AI 陪伴</h1>
              <p className="text-xs text-[var(--text-muted)]">随时倾听你的心声</p>
            </div>
          </div>
          <button
            onClick={() => setShowKnowledge(!showKnowledge)}
            className="px-4 py-2 bg-[var(--cream)] rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--peach)] transition-all border border-dashed border-[var(--handrawn-border)]"
          >
            {showKnowledge ? '收起' : '📚 知识库'}
          </button>
        </div>
      </div>

      {/* 知识库面板 */}
      {showKnowledge && (
        <div className="mx-3 mt-2 bg-white dark:bg-[#2a2520] rounded-2xl p-4 shadow-[0_4px_16px_rgba(93,78,71,0.06)] border-2 border-dashed border-[var(--handrawn-border)]">
          {!showAddForm ? (
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAddForm(true); setEditingItem(null); setTitle(''); setContent('') }}
                className="flex-1 py-3 bg-gradient-to-r from-[#FF8A7A] to-[#FFB5A8] text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
              >
                ✨ 手动添加
              </button>
              <label className="flex-1 py-3 bg-[#E8F5F0] text-[#5D8B7B] rounded-xl hover:shadow-lg transition-all text-sm font-medium text-center cursor-pointer border border-dashed border-[#A8E6CF]/30">
                <input type="file" accept=".txt,.md,.pdf" onChange={handleFileUpload} className="hidden" />
                📄 文件上传
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="给这段知识起个名字..."
                className="w-full px-4 py-3 bg-[var(--cream)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] border border-[var(--handrawn-border)] focus:outline-none focus:border-[#FFB5A8]"
              />
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="写下你想记住的知识..."
                className="w-full px-4 py-3 bg-[var(--cream)] rounded-xl text-sm h-20 resize-none text-[var(--text-primary)] placeholder-[var(--text-muted)] border border-[var(--handrawn-border)] focus:outline-none focus:border-[#FFB5A8]"
              />
              <div className="flex gap-2">
                <button onClick={() => { setShowAddForm(false); setEditingItem(null); setTitle(''); setContent('') }} className="flex-1 py-2.5 bg-[var(--cream)] text-[var(--text-secondary)] rounded-xl text-sm border border-dashed border-[var(--handrawn-border)]">取消</button>
                <button onClick={editingItem ? handleUpdateItem : handleAddManual} className="flex-1 py-2.5 bg-gradient-to-r from-[#8BC49E] to-[#A8E6CF] text-white rounded-xl text-sm">✓ {editingItem ? '保存修改' : '保存'}</button>
              </div>
            </div>
          )}

          {knowledge.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {knowledge.map(item => (
                <div key={item.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--cream)] rounded-full text-xs text-[var(--text-secondary)] border border-dashed border-[var(--handrawn-border)]">
                  📝 {item.title}
                  <button onClick={() => startEdit(item.id)} className="text-[#87CEEB] hover:text-[#5BA8D4]">✏️</button>
                  <button onClick={() => { deleteKnowledge(item.id); invalidateCache() }} className="w-4 h-4 rounded-full bg-[var(--peach)] text-[#FF8A7A] hover:bg-[#FFD4C8] flex items-center justify-center text-xs font-bold">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFE8E0] to-[#FFD4C4] flex items-center justify-center mb-4 shadow-lg border-2 border-dashed border-[#FFB5A8]/30">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#FF8A7A">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <p className="text-[var(--text-secondary)] text-base mb-1 font-medium">你好呀！</p>
            <p className="text-[var(--text-muted)] text-sm">有什么想聊的，或者添加些知识库内容？</p>
          </div>
        )}

        {chatMessages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-br from-[#FF8A7A] to-[#FFB5A8] text-white shadow-lg rounded-br-md' : 'bg-white dark:bg-[#2a2520] text-[var(--text-primary)] shadow-md rounded-bl-md border-2 border-dashed border-[var(--handrawn-border)]'}`}>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#2a2520] px-5 py-3 rounded-2xl rounded-bl-md shadow-md border-2 border-dashed border-[var(--handrawn-border)]">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#FFB5A8] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2.5 h-2.5 bg-[#FFD4C8] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2.5 h-2.5 bg-[#FFE8E0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="px-4 py-3">
        <div className="bg-white dark:bg-[#2a2520] rounded-2xl p-2 flex gap-2 items-center shadow-[0_4px_16px_rgba(93,78,71,0.06)] border-2 border-dashed border-[var(--handrawn-border)]">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="说点什么..."
            className="flex-1 px-4 py-3 bg-[var(--cream)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          <button
            onClick={() => clearChatMessages()}
            className="px-3 py-3 bg-[var(--coral-pale)] hover:bg-[var(--peach)] rounded-xl text-[var(--text-muted)] transition-all text-sm border border-dashed border-[var(--handrawn-border)]"
          >
            🗑️
          </button>
          <button
            onClick={handleSend}
            className="px-5 py-3 bg-gradient-to-r from-[#FF8A7A] to-[#FFB5A8] text-white rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all font-medium text-sm"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}
