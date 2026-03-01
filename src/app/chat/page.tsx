import ChatInterface from '@/components/ChatInterface'

export const metadata = {
  title: 'AI聊天 - 心情日记',
  description: '基于本地知识库的AI聊天助手',
}

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pb-16">
      <ChatInterface />
    </main>
  )
}
