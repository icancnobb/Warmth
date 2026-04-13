'use client'

import { FormEvent, useMemo, useState } from 'react'
import { usePersistentState } from '@/hooks/use-persistent-state'
import { craftWarmthReply } from './engine'
import { CHAT_HISTORY_KEY, type ChatMessage } from './types'

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function ChatPanel() {
  const [input, setInput] = useState('')
  const { state: messages, setState: setMessages, hydrated } = usePersistentState<ChatMessage[]>(
    CHAT_HISTORY_KEY,
    []
  )

  const ordered = useMemo(() => [...messages].sort((a, b) => a.createdAt - b.createdAt), [messages])

  function handleSend(event: FormEvent) {
    event.preventDefault()
    const prompt = input.trim()
    if (!prompt) {
      return
    }

    const userMessage: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: prompt,
      createdAt: Date.now(),
    }

    const assistantMessage: ChatMessage = {
      id: makeId(),
      role: 'assistant',
      content: craftWarmthReply(prompt),
      createdAt: Date.now() + 1,
    }

    setMessages([...messages, userMessage, assistantMessage])
    setInput('')
  }

  function clearConversation() {
    setMessages([])
  }

  return (
    <div className="stack">
      <section className="card stack">
        <h2>Warmth Chat</h2>
        <p className="muted">
          This rebuilt version uses a local response engine powered by your saved profile and journal data.
        </p>
        <form onSubmit={handleSend} className="stack">
          <textarea
            rows={4}
            value={input}
            placeholder="What is on your mind right now?"
            onChange={(event) => setInput(event.target.value)}
          />
          <div className="inline">
            <button type="submit">Send</button>
            <button type="button" className="secondary" onClick={clearConversation}>
              Clear
            </button>
          </div>
        </form>
        <p className="muted">{hydrated ? 'History persists in local storage.' : 'Loading chat history...'}</p>
      </section>

      <section className="card stack">
        <h3>Conversation</h3>
        {ordered.length === 0 ? (
          <p className="muted">No messages yet.</p>
        ) : (
          ordered.map((message) => (
            <article key={message.id} className="card" style={{ boxShadow: 'none' }}>
              <strong>{message.role === 'assistant' ? 'Warmth' : 'You'}</strong>
              <p>{message.content}</p>
            </article>
          ))
        )}
      </section>
    </div>
  )
}
