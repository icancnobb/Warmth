import DrawingBoard from '@/components/DrawingBoard'

export const metadata = {
  title: '绘画板 - 心情日记',
  description: '自由创作的绘画板',
}

export default function DrawPage() {
  return (
    <main className="min-h-screen">
      <DrawingBoard />
    </main>
  )
}
