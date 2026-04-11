'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { db } from '@/lib/db'
import { Artwork } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const COLORS = [
  '#5D4E47', '#FFFFFF', '#FF8A7A', '#FFB347', '#87CEEB',
  '#A8E6CF', '#DDA0DD', '#F5A8A8', '#FFD699', '#B8D4E8',
]

const MAX_HISTORY = 50

function get_pos(
  canvas: HTMLCanvasElement,
  client_x: number,
  client_y: number,
) {
  const rect = canvas.getBoundingClientRect()
  const scale_x = canvas.width / rect.width
  const scale_y = canvas.height / rect.height
  return {
    x: (client_x - rect.left) * scale_x,
    y: (client_y - rect.top) * scale_y,
  }
}

export default function DrawingBoard() {
  const canvas_ref = useRef<HTMLCanvasElement>(null)
  const container_ref = useRef<HTMLDivElement>(null)
  const [is_drawing, set_is_drawing] = useState(false)
  const [color, set_color] = useState('#5D4E47')
  const [brush_size, set_brush_size] = useState(8)
  const [is_eraser, set_is_eraser] = useState(false)
  const [can_undo, set_can_undo] = useState(false)
  const [can_redo, set_can_redo] = useState(false)
  const [artworks, set_artworks] = useState<Artwork[]>([])
  const [selected_artwork, set_selected_artwork] = useState<Artwork | null>(null)
  const [mounted, set_mounted] = useState(false)

  const history_ref = useRef<ImageData[]>([])
  const history_index_ref = useRef<number>(-1)

  const save_to_history = useCallback(() => {
    const canvas = canvas_ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const image_data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    history_ref.current = history_ref.current.slice(0, history_index_ref.current + 1)
    history_ref.current.push(image_data)
    if (history_ref.current.length > MAX_HISTORY) {
      history_ref.current.shift()
    }
    history_index_ref.current = history_ref.current.length - 1
    set_can_undo(history_index_ref.current > 0)
    set_can_redo(false)
  }, [])

  const init_canvas = useCallback(() => {
    const canvas = canvas_ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    history_ref.current = []
    history_index_ref.current = -1
    save_to_history()
  }, [save_to_history])

  useEffect(() => {
    set_mounted(true)
    load_artworks()
  }, [])

  useEffect(() => {
    const canvas = canvas_ref.current
    const container = container_ref.current
    if (!canvas || !container) return
    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = Math.max(rect.width * 0.66, 300) * dpr
    canvas.style.height = `${Math.max(rect.width * 0.66, 300)}px`
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(dpr, dpr)
    init_canvas()
  }, [])

  const load_artworks = async () => {
    const items = await db.artworks.orderBy('createdAt').reverse().toArray()
    set_artworks(items)
  }

  const start_drawing = (x: number, y: number) => {
    const canvas = canvas_ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = get_pos(canvas, x, y)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    set_is_drawing(true)
  }

  const draw_line = (x: number, y: number) => {
    if (!is_drawing) return
    const canvas = canvas_ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = get_pos(canvas, x, y)
    if (is_eraser) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
    }
    ctx.lineWidth = brush_size
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const stop_drawing = () => {
    if (is_drawing) {
      set_is_drawing(false)
      const canvas = canvas_ref.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.globalCompositeOperation = 'source-over'
      save_to_history()
    }
  }

  const undo = () => {
    if (history_index_ref.current <= 0) return
    history_index_ref.current--
    const ctx = canvas_ref.current?.getContext('2d')
    if (!ctx || !canvas_ref.current) return
    ctx.putImageData(history_ref.current[history_index_ref.current], 0, 0)
    set_can_undo(history_index_ref.current > 0)
    set_can_redo(history_index_ref.current < history_ref.current.length - 1)
  }

  const redo = () => {
    if (history_index_ref.current >= history_ref.current.length - 1) return
    history_index_ref.current++
    const ctx = canvas_ref.current?.getContext('2d')
    if (!ctx || !canvas_ref.current) return
    ctx.putImageData(history_ref.current[history_index_ref.current], 0, 0)
    set_can_undo(history_index_ref.current > 0)
    set_can_redo(history_index_ref.current < history_ref.current.length - 1)
  }

  const clear_canvas = () => {
    init_canvas()
  }

  const save_artwork = async () => {
    const canvas = canvas_ref.current
    if (!canvas) return
    const image_data = canvas.toDataURL('image/png')
    await db.artworks.add({ id: uuidv4(), imageData: image_data, createdAt: Date.now() })
    load_artworks()
  }

  const delete_artwork = async (id: string) => {
    await db.artworks.delete(id)
    load_artworks()
    set_selected_artwork(null)
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 pt-14 pb-20 overflow-auto">
      <div className="fixed inset-0 -z-10 bg-[var(--cream)]" />

      <div className="max-w-2xl mx-auto p-4">
        {/* 头部 */}
        <div className="bg-white dark:bg-[#2a2520] rounded-3xl p-5 mb-4 shadow-[0_4px_20px_rgba(93,78,71,0.06)] border-2 border-dashed border-[var(--handrawn-border)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFE8E0] to-[#FFD4C4] flex items-center justify-center text-2xl shadow-md border border-[#FFB5A8]/20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF8A7A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">自由画板</h1>
              <p className="text-xs text-[var(--text-muted)]">释放你的创意天赋</p>
            </div>
          </div>

          {/* 工具栏 */}
          <div className="space-y-4">
            {/* 颜色选择 */}
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2">🎨 画笔颜色</p>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => { set_color(c); set_is_eraser(false) }}
                    className={`w-8 h-8 rounded-xl transition-all hover:scale-110 ${color === c && !is_eraser ? 'ring-2 ring-[#FF8A7A] ring-offset-2 scale-110' : ''}`}
                    style={{ backgroundColor: c, boxShadow: c === '#FFFFFF' ? 'inset 0 0 0 1px #E8D4C8' : 'none' }}
                  />
                ))}
              </div>
            </div>

            {/* 粗细 */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs text-[var(--text-muted)] mb-2">✨ 画笔粗细</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="2"
                    max="30"
                    value={brush_size}
                    onChange={e => set_brush_size(Number(e.target.value))}
                    className="flex-1 accent-[#FF8A7A]"
                  />
                  <span className="text-sm text-[var(--text-secondary)] w-12 text-center bg-[var(--cream)] py-1 rounded-lg border border-dashed border-[var(--handrawn-border)]">
                    {brush_size}px
                  </span>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-2">
              <button onClick={undo} disabled={!can_undo} className="py-3 bg-[var(--cream)] text-[var(--text-secondary)] rounded-xl text-sm font-medium border border-dashed border-[var(--handrawn-border)] disabled:opacity-30 px-4">↩️</button>
              <button onClick={redo} disabled={!can_redo} className="py-3 bg-[var(--cream)] text-[var(--text-secondary)] rounded-xl text-sm font-medium border border-dashed border-[var(--handrawn-border)] disabled:opacity-30 px-4">↪️</button>
              <button onClick={() => set_is_eraser(!is_eraser)} className={`py-3 rounded-xl text-sm font-medium px-4 border ${is_eraser ? 'bg-[#FF8A7A] text-white border-[#FF8A7A]' : 'bg-[var(--cream)] text-[var(--text-secondary)] border-dashed border-[var(--handrawn-border)]'}`}>🧹 橡皮</button>
              <button onClick={clear_canvas} className="flex-1 py-3 bg-[var(--cream)] text-[var(--text-secondary)] rounded-xl text-sm font-medium border border-dashed border-[var(--handrawn-border)] hover:bg-[var(--peach)] transition-all">🗑️ 清空</button>
              <button onClick={save_artwork} className="flex-1 py-3 bg-gradient-to-r from-[#FF8A7A] to-[#FFB5A8] text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all">💾 保存</button>
            </div>
          </div>
        </div>

        {/* 画布 */}
        <div ref={container_ref} className="bg-white dark:bg-[#2a2520] rounded-3xl p-3 mb-6 shadow-[0_4px_20px_rgba(93,78,71,0.06)] border-2 border-dashed border-[var(--handrawn-border)] overflow-hidden">
          <canvas
            ref={canvas_ref}
            onMouseDown={e => start_drawing(e.clientX, e.clientY)}
            onMouseMove={e => draw_line(e.clientX, e.clientY)}
            onMouseUp={stop_drawing}
            onMouseLeave={stop_drawing}
            onTouchStart={e => { e.preventDefault(); const t = e.touches[0]; start_drawing(t.clientX, t.clientY) }}
            onTouchMove={e => { e.preventDefault(); const t = e.touches[0]; draw_line(t.clientX, t.clientY) }}
            onTouchEnd={e => { e.preventDefault(); stop_drawing() }}
            className="w-full cursor-crosshair touch-none rounded-2xl bg-white"
          />
        </div>

        {/* 作品画廊 */}
        <div className="bg-white dark:bg-[#2a2520] rounded-3xl p-5 shadow-[0_4px_20px_rgba(93,78,71,0.06)] border-2 border-dashed border-[var(--handrawn-border)]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🖼️</span>
            <h2 className="font-semibold text-[var(--text-primary)]">我的作品集</h2>
            <span className="text-xs text-[var(--text-muted)] bg-[var(--cream)] px-2 py-1 rounded-full border border-dashed border-[var(--handrawn-border)]">
              {artworks.length} 件
            </span>
          </div>

          {artworks.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {artworks.map(art => (
                <div
                  key={art.id}
                  className="relative group cursor-pointer"
                  onClick={() => set_selected_artwork(art)}
                >
                  <img
                    src={art.imageData}
                    alt="作品"
                    className="w-full aspect-square object-cover rounded-2xl border-2 border-dashed border-[#FFE8E0] shadow-sm group-hover:shadow-lg group-hover:scale-[1.02] transition-all"
                  />
                  <button
                    onClick={e => { e.stopPropagation(); delete_artwork(art.id) }}
                    className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-full text-[#FF8A7A] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-md hover:bg-[#FFE8E0] border border-dashed border-[#E8D4C8]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFE8E0] to-[#FFD4C4] flex items-center justify-center mx-auto mb-4 shadow-lg border-2 border-dashed border-[#FFB5A8]/30">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF8A7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                </svg>
              </div>
              <p className="text-[var(--text-secondary)] mb-1">还没有作品</p>
              <p className="text-[var(--text-muted)] text-sm">在画布上创作你的第一幅画吧</p>
            </div>
          )}
        </div>
      </div>

      {/* 预览弹窗 */}
      {selected_artwork && (
        <div
          className="fixed inset-0 bg-[rgba(93,78,71,0.25)] backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => set_selected_artwork(null)}
        >
          <div
            className="bg-white dark:bg-[#2a2520] rounded-3xl p-3 shadow-2xl max-w-sm w-full border-2 border-dashed border-[var(--handrawn-border)]"
            onClick={e => e.stopPropagation()}
          >
            <img src={selected_artwork.imageData} alt="预览" className="w-full rounded-2xl" />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  const link = document.createElement('a')
                  link.download = 'artwork.png'
                  link.href = selected_artwork.imageData
                  link.click()
                }}
                className="flex-1 py-3 bg-gradient-to-r from-[#8BC49E] to-[#A8E6CF] text-white rounded-xl text-sm font-medium"
              >
                📥 下载
              </button>
              <button
                onClick={() => set_selected_artwork(null)}
                className="flex-1 py-3 bg-[var(--handrawn-light)] text-[var(--text-secondary)] rounded-xl text-sm font-medium border border-dashed border-[var(--handrawn-border)]"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
