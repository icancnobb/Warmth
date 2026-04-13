import AppShell from '@/components/app-shell'
import DrawingBoard from '@/features/draw/drawing-board'

export default function DrawPage() {
  return (
    <AppShell
      title="Canvas"
      subtitle="Release emotion with simple sketching tools and save snapshots."
    >
      <DrawingBoard />
    </AppShell>
  )
}
