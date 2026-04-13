import AppShell from '@/components/app-shell'
import JournalPanel from '@/features/journal/journal-panel'

export default function JournalPage() {
  return (
    <AppShell
      title="Journal"
      subtitle="Track mood and daily notes with one focused record per date."
    >
      <JournalPanel />
    </AppShell>
  )
}
