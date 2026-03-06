'use client'

import { useState, useEffect, useRef } from 'react'
import { db } from '@/lib/db'
import { KnowledgeItem } from '@/types'
import { v4 as uuidv4 } from 'uuid'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

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
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showKnowledge, setShowKnowledge] = useState(false)
  const [mounted, setMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true); loadKnowledge() }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadKnowledge = async () => { const items = await db.knowledge.toArray(); setKnowledgeItems(items) }

  const handleAddManual = async () => {
    if (!title.trim() || !content.trim()) return
    await db.knowledge.add({ id: uuidv4(), title: title.trim(), content: content.trim(), source: 'manual', createdAt: Date.now() })
    setTitle(''); setContent(''); setShowAddForm(false); loadKnowledge()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    let text = ''
    if (file.name.endsWith('.txt') || file.name.endsWith('.md')) { text = await file.text() }
    else if (file.name.endsWith('.pdf')) { alert('PDF需要转换格式'); return }
    await db.knowledge.add({ id: uuidv4(), title: file.name, content: text, source: 'file', fileName: file.name, createdAt: Date.now() })
    loadKnowledge()
  }

  const handleDelete = async (id: string) => { await db.knowledge.delete(id); loadKnowledge() }

  const handleSend = async () => {
    if (!input.trim()) return
    const userMessage: Message = { id: uuidv4(), role: 'user', content: input }
    setMessages(prev => [...prev, userMessage]); setInput(''); setIsTyping(true)
    const answer = await getAnswer(input)
    setIsTyping(false)
    const assistantMessage: Message = { id: uuidv4(), role: 'assistant', content: answer }
    setMessages(prev => [...prev, assistantMessage])
  }

  const getAnswer = async (query: string): Promise<string> => {
    const documents = await db.knowledge.toArray()
    if (documents.length === 0) return '知识库为空，请先添加知识内容。'
    const contents = documents.map(d => d.content)
    const idf = computeIDF(contents)
    const queryTokens = tokenize(query)
    const queryTF = computeTF(queryTokens)
    const queryVec = new Map<string, number>()
    queryTF.forEach((val, term) => { queryVec.set(term, val * (idf.get(term) || 1)) })
    let bestDoc = '', bestScore = 0
    documents.forEach(doc => {
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

  if (!mounted) return null

  return (
    <div className="fixed inset-0 pt-14 pb-20 flex flex-col">
      {/* 背景 */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50" />

      {/* 头部 */}
      <div className="px-4 py-3 border-b border-gray-100/50 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <h1 className="font-bold text-lg text-gray-800">AI 聊天</h1>
          </div>
          <button onClick={() => setShowKnowledge(!showKnowledge)} className="px-3 py-1.5 bg-white/80 rounded-xl text-sm text-gray-600 hover:bg-white transition-all shadow-sm">
            {showKnowledge ? '隐藏知识库' : '管理知识库'}
          </button>
        </div>
      </div>

      {/* 知识库面板 */}
      {showKnowledge && (
        <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100">
          <div className="p-4">
            {!showAddForm ? (
              <button onClick={() => setShowAddForm(true)} className="w-full px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-rose-200 transition-all text-sm font-medium">
                + 添加知识
              </button>
            ) : (
              <div className="space-y-3">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="标题" className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="内容..." className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-rose-300" />
                <div className="flex gap-2">
                  <button onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm">取消</button>
                  <button onClick={handleAddManual} className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm">保存</button>
                </div>
              </div>
            )}
          </div>
          {knowledgeItems.length > 0 && (
            <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
              {knowledgeItems.map(item => (
                <div key={item.id} className="flex-shrink-0 px-3 py-1.5 bg-gray-50 rounded-full text-xs text-gray-600">
                  {item.title}
                  <button onClick={() => handleDelete(item.id)} className="ml-1 text-rose-400">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="text-5xl mb-4">👋</span>
            <p className="text-sm">你好！有什么可以帮你的？</p>
            <p className="text-xs mt-2">基于你的知识库回答问题</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-br-md shadow-lg shadow-rose-200' : 'bg-white/80 backdrop-blur-sm text-gray-800 rounded-bl-md shadow-sm'}`}>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="px-4 py-3 border-t border-gray-100/50 bg-white/50 backdrop-blur-sm">
        <div className="flex gap-2 items-center">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="输入问题..." className="flex-1 px-5 py-3 bg-white/80 border-0 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm" />
          <button onClick={() => setMessages([])} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-all text-sm">清空</button>
          <button onClick={handleSend} className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-rose-200 hover:scale-105 active:scale-95 transition-all font-medium text-sm">发送</button>
        </div>
      </div>
    </div>
  )
}
