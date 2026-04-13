import AppShell from '@/components/app-shell'
import ChatPanel from '@/features/chat/chat-panel'

export default function ChatPage() {
  return (
    <AppShell
      title="Conversation"
      subtitle="Talk with Warmth using your journal and profile context."
    >
      <ChatPanel />
    </AppShell>
  )
}
