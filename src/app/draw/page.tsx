import DrawingBoard from '@/components/DrawingBoard'

export const metadata = {
  title: '绘画板 - 心情日记',
  description: '自由绘画，创作你的作品',
}

export default function DrawPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <DrawingBoard />
    </main>
  )
}
