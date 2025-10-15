'use client';
import { useRef, useState } from 'react';

export default function SimpleCanvasTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{x: number, y: number} | null>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log('Start drawing at:', x, y);
    setIsDrawing(true);
    setLastPoint({ x, y });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Draw line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setLastPoint({ x, y });
  };

  const stopDrawing = () => {
    console.log('Stop drawing');
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Simple Canvas Drawing Test</h2>
      <p className="mb-4">Try drawing on the canvas below. This tests if basic canvas drawing works.</p>
      
      <div className="border-2 border-gray-300 inline-block">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="bg-white cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
      
      <div className="mt-4">
        <button 
          onClick={clearCanvas}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Canvas
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Drawing: {isDrawing ? 'Yes' : 'No'}</p>
        <p>Last Point: {lastPoint ? `(${lastPoint.x.toFixed(0)}, ${lastPoint.y.toFixed(0)})` : 'None'}</p>
      </div>
    </div>
  );
}