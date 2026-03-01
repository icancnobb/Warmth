'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { KnowledgeItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[\s\n\r,.!?;:()（）【】""''""''、，。!?；：]/).filter(w => w.length > 0);
}

function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  tokens.forEach(token => {
    tf.set(token, (tf.get(token) || 0) + 1);
  });
  tokens.forEach(token => {
    tf.set(token, tf.get(token)! / tokens.length);
  });
  return tf;
}

function computeIDF(documents: string[]): Map<string, number> {
  const idf = new Map<string, number>();
  const N = documents.length;
  const docsWithTerm = new Map<string, number>();
  
  documents.forEach(doc => {
    const tokens = [...new Set(tokenize(doc))];
    tokens.forEach(token => {
      docsWithTerm.set(token, (docsWithTerm.get(token) || 0) + 1);
    });
  });
  
  docsWithTerm.forEach((count, term) => {
    idf.set(term, Math.log((N + 1) / (count + 1)) + 1);
  });
  
  return idf;
}

function cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  vec1.forEach((val, term) => {
    norm1 += val * val;
    if (vec2.has(term)) {
      dotProduct += val * vec2.get(term)!;
    }
  });
  
  vec2.forEach(val => {
    norm2 += val * val;
  });
  
  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

export default function ChatInterface() {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadKnowledge();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadKnowledge = async () => {
    const items = await db.knowledge.toArray();
    setKnowledgeItems(items);
  };

  const handleAddManual = async () => {
    if (!title.trim() || !content.trim()) return;
    await db.knowledge.add({
      id: uuidv4(),
      title: title.trim(),
      content: content.trim(),
      source: 'manual',
      createdAt: Date.now(),
    });
    setTitle('');
    setContent('');
    setShowAddForm(false);
    loadKnowledge();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    let text = '';
    if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      text = await file.text();
    } else if (file.name.endsWith('.pdf')) {
      alert('PDF解析需要服务器端支持，请先转换为txt格式');
      return;
    }
    
    await db.knowledge.add({
      id: uuidv4(),
      title: file.name,
      content: text,
      source: 'file',
      fileName: file.name,
      createdAt: Date.now(),
    });
    loadKnowledge();
  };

  const handleDelete = async (id: string) => {
    await db.knowledge.delete(id);
    loadKnowledge();
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { id: uuidv4(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const answer = await getAnswer(input);
    const assistantMessage: Message = { id: uuidv4(), role: 'assistant', content: answer };
    setMessages(prev => [...prev, assistantMessage]);
  };

  const getAnswer = async (query: string): Promise<string> => {
    const documents = await db.knowledge.toArray();
    if (documents.length === 0) {
      return '知识库为空，请先添加知识内容。';
    }

    const contents = documents.map(d => d.content);
    const idf = computeIDF(contents);
    const queryTokens = tokenize(query);
    const queryTF = computeTF(queryTokens);
    const queryVec = new Map<string, number>();
    
    queryTF.forEach((val, term) => {
      queryVec.set(term, val * (idf.get(term) || 1));
    });

    let bestDoc = '';
    let bestScore = 0;

    documents.forEach(doc => {
      const docTokens = tokenize(doc.content);
      const docTF = computeTF(docTokens);
      const docVec = new Map<string, number>();
      
      docTF.forEach((val, term) => {
        docVec.set(term, val * (idf.get(term) || 1));
      });
      
      const score = cosineSimilarity(queryVec, docVec);
      if (score > bestScore) {
        bestScore = score;
        bestDoc = doc.content;
      }
    });

    if (bestScore < 0.1 || !bestDoc) {
      return '知识库中没有相关信息。';
    }

    const sentences = bestDoc.split(/[。！？\n]/).filter(s => s.trim().length > 0);
    const relevantSentences = sentences.filter(s => 
      tokenize(query).some(t => tokenize(s).includes(t))
    );
    
    return relevantSentences.length > 0 
      ? relevantSentences.slice(0, 3).join('。') + '。'
      : bestDoc.slice(0, 200) + '...';
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen">
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg mb-3">知识库</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {showAddForm ? '取消' : '添加知识'}
          </button>
        </div>

        {showAddForm && (
          <div className="p-4 border-b bg-gray-50">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="标题"
              className="w-full px-3 py-2 border rounded-lg mb-2"
            />
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="内容"
              className="w-full px-3 py-2 border rounded-lg mb-2 h-24"
            />
            <button
              onClick={handleAddManual}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg mb-2"
            >
              添加
            </button>
            <div className="text-center text-gray-500 text-sm mb-2">或</div>
            <input
              type="file"
              accept=".txt,.md,.pdf"
              onChange={handleFileUpload}
              className="w-full text-sm"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2">
          {knowledgeItems.map(item => (
            <div key={item.id} className="p-3 bg-gray-50 rounded-lg mb-2 group">
              <div className="flex justify-between items-start">
                <div className="font-medium text-sm truncate flex-1">{item.title}</div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-500 opacity-0 group-hover:opacity-100 text-sm"
                >
                  删除
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1 truncate">{item.source}</div>
            </div>
          ))}
          {knowledgeItems.length === 0 && (
            <div className="text-center text-gray-400 py-8">暂无知识内容</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h1 className="font-bold text-xl">AI 聊天</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="输入问题..."
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button
              onClick={handleClearChat}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              清空
            </button>
            <button
              onClick={handleSend}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
