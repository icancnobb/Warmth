'use client'

import { useEffect, useRef, useState } from 'react'
import { usePersistentState } from '@/hooks/use-persistent-state'
import { DRAW_ARTWORKS_KEY, type Artwork } from './types'

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

type Point = {
  x: number
  y: number
}

export default function DrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const drawingRef = useRef(false)

  const [color, setColor] = useState('#d6745f')
  const [lineWidth, setLineWidth] = useState(4)
  const { state: artworks, setState: setArtworks } = usePersistentState<Artwork[]>(DRAW_ARTWORKS_KEY, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#d6745f'
    ctx.lineWidth = 4
    contextRef.current = ctx
  }, [])

  useEffect(() => {
    if (!contextRef.current) {
      return
    }

    contextRef.current.strokeStyle = color
    contextRef.current.lineWidth = lineWidth
  }, [color, lineWidth])

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current
    if (!canvas) {
      return { x: 0, y: 0 }
    }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    }
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = contextRef.current
    if (!context) {
      return
    }

    const point = getPoint(event)
    drawingRef.current = true
    context.beginPath()
    context.moveTo(point.x, point.y)
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || !contextRef.current) {
      return
    }

    const point = getPoint(event)
    contextRef.current.lineTo(point.x, point.y)
    contextRef.current.stroke()
  }

  function stopDrawing() {
    if (!contextRef.current) {
      return
    }

    drawingRef.current = false
    contextRef.current.closePath()
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    const context = contextRef.current
    if (!canvas || !context) {
      return
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  function saveArtwork() {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const artwork: Artwork = {
      id: makeId(),
      imageData: canvas.toDataURL('image/png'),
      createdAt: Date.now(),
    }

    setArtworks([artwork, ...artworks])
  }

  function deleteArtwork(id: string) {
    setArtworks(artworks.filter((artwork) => artwork.id !== id))
  }

  return (
    <div className="stack">
      <section className="card stack">
        <h2>Sketch Board</h2>
        <div className="inline">
          <label className="inline" style={{ width: '100%' }}>
            <span>Color</span>
            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
          </label>
          <label className="inline" style={{ width: '100%' }}>
            <span>Width</span>
            <input
              type="range"
              min={1}
              max={24}
              value={lineWidth}
              onChange={(event) => setLineWidth(Number(event.target.value))}
            />
          </label>
        </div>
        <canvas
          ref={canvasRef}
          className="canvas"
          width={920}
          height={480}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />
        <div className="inline">
          <button type="button" onClick={saveArtwork}>
            Save snapshot
          </button>
          <button type="button" className="secondary" onClick={clearCanvas}>
            Clear canvas
          </button>
        </div>
      </section>

      <section className="card stack">
        <h3>Saved Gallery</h3>
        {artworks.length === 0 ? (
          <p className="muted">No saved artworks yet.</p>
        ) : (
          <div className="gallery">
            {artworks.map((artwork) => (
              <article key={artwork.id} className="gallery-item">
                <img src={artwork.imageData} alt="Saved sketch" />
                <button type="button" className="ghost" onClick={() => deleteArtwork(artwork.id)}>
                  Remove
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
