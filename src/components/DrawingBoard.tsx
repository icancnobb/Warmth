'use client';

import { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/db';
import { Artwork } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A',
];

export default function DrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    loadArtworks();
  }, []);

  const loadArtworks = async () => {
    const items = await db.artworks.orderBy('createdAt').reverse().toArray();
    setArtworks(items);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveArtwork = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const imageData = canvas.toDataURL('image/png');
    await db.artworks.add({
      id: uuidv4(),
      imageData,
      createdAt: Date.now(),
    });
    loadArtworks();
  };

  const deleteArtwork = async (id: string) => {
    await db.artworks.delete(id);
    loadArtworks();
    setSelectedArtwork(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">绘画板</h1>
        
        <div className="flex gap-4 mb-4 flex-wrap">
          <div className="flex gap-1">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-blue-500' : 'border-gray-300'}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-8 h-8 cursor-pointer"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">粗细:</span>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600">{brushSize}px</span>
          </div>
          
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            清空
          </button>
          <button
            onClick={saveArtwork}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            保存
          </button>
        </div>

        <div className="border rounded-lg overflow-hidden mb-6">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="cursor-crosshair"
          />
        </div>

        <div>
          <h2 className="font-bold mb-3">我的作品</h2>
          <div className="grid grid-cols-4 gap-4">
            {artworks.map(art => (
              <div
                key={art.id}
                className="relative group cursor-pointer"
                onClick={() => setSelectedArtwork(art)}
              >
                <img
                  src={art.imageData}
                  alt="作品"
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <button
                  onClick={e => {
                    e.stopPropagation();
                    deleteArtwork(art.id);
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
            {artworks.length === 0 && (
              <div className="col-span-4 text-center text-gray-400 py-8">
                暂无保存的作品
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedArtwork && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedArtwork(null)}
        >
          <img
            src={selectedArtwork.imageData}
            alt="作品预览"
            className="max-w-[90%] max-h-[90%] rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
