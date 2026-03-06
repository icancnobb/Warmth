'use client'

import { useEffect, useRef, useState } from 'react'
import { db } from '@/lib/db'
import { Artwork } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const COLORS = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A']

export default function DrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(5)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    loadArtworks()
  }, [])

  const loadArtworks = async () => { const items = await db.artworks.orderBy('createdAt').reverse().toArray(); setArtworks(items) }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    ctx.beginPath(); ctx.moveTo(x, y); setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    ctx.strokeStyle = color; ctx.lineWidth = brushSize; ctx.lineTo(x, y); ctx.stroke()
  }

  const stopDrawing = () => setIsDrawing(false)
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const saveArtwork = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const imageData = canvas.toDataURL('image/png')
    await db.artworks.add({ id: uuidv4(), imageData, createdAt: Date.now() })
    loadArtworks()
  }

  const deleteArtwork = async (id: string) => { await db.artworks.delete(id); loadArtworks(); setSelectedArtwork(null) }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 pt-14 pb-20 overflow-auto">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50" />

      <div className="max-w-6xl mx-auto p-4">
        {/* 头部卡片 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-100/50 border border-white/60 p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-purple-200/50">🎨</div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">绘画板</h1>
              <p className="text-xs text-gray-500">释放你的创造力</p>
            </div>
          </div>
        
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">颜色</span>
              <div className="flex gap-1">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${color === c ? 'border-pink-400 ring-2 ring-pink-200' : 'border-gray-200'}`} style={{ backgroundColor: c }} />
                ))}
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-7 h-7 cursor-pointer rounded-full border-0" />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">粗细</span>
              <input type="range" min="1" max="50" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-24 accent-pink-500" />
              <span className="text-xs text-gray-600 w-8">{brushSize}px</span>
            </div>
            
            <div className="flex gap-2 ml-auto">
              <button onClick={clearCanvas} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-600 transition-all hover:scale-105">清空</button>
              <button onClick={saveArtwork} className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-green-200 hover:scale-105 transition-all">保存作品</button>
            </div>
          </div>
        </div>

        {/* 画布 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-100/50 border border-white/60 p-1 mb-6 overflow-hidden">
          <canvas ref={canvasRef} width={800} height={450} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} className="w-full cursor-crosshair touch-none rounded-2xl" style={{ maxHeight: '50vh' }} />
        </div>

        {/* 作品画廊 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-100/50 border border-white/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🖼️</span>
            <h2 className="font-bold text-gray-800">我的作品</h2>
            <span className="text-xs text-gray-400">({artworks.length})</span>
          </div>
          
          {artworks.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {artworks.map(art => (
                <div key={art.id} className="relative group cursor-pointer" onClick={() => setSelectedArtwork(art)}>
                  <img src={art.imageData} alt="作品" className="w-full aspect-square object-cover rounded-xl border-2 border-white shadow-md hover:shadow-xl transition-all hover:scale-105" />
                  <button onClick={e => { e.stopPropagation(); deleteArtwork(art.id) }} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-sm">×</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <span className="text-5xl block mb-3">🎨</span>
              <p className="text-sm">还没有作品</p>
              <p className="text-xs mt-1">开始创作你的第一幅画吧</p>
            </div>
          )}
        </div>
      </div>

      {/* 预览弹窗 */}
      {selectedArtwork && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedArtwork(null)}>
          <div className="bg-white rounded-3xl p-2 shadow-2xl max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={selectedArtwork.imageData} alt="预览" className="max-w-full max-h-[80vh] rounded-2xl" />
            <div className="flex justify-end gap-2 mt-3 px-2">
              <button onClick={() => { const link = document.createElement('a'); link.download = 'artwork.png'; link.href = selectedArtwork.imageData; link.click() }} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition-all">下载</button>
              <button onClick={() => setSelectedArtwork(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-all">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
