import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface Point { x: number; y: number }

interface Props {
  imageSrc: string;
  onCornersChange: (corners: [Point, Point, Point, Point]) => void;
}

export function PerspectiveCropper({ imageSrc, onCornersChange }: Props) {
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Corners in relative coordinates (0.0 to 1.0) based on the IMAGE dimensions
  // Order: Top-Left, Top-Right, Bottom-Right, Bottom-Left
  const [corners, setCorners] = useState<[Point, Point, Point, Point]>([
    { x: 0.1, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.9, y: 0.9 },
    { x: 0.1, y: 0.9 },
  ]);
  
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  useEffect(() => {
    onCornersChange(corners);
  }, [corners, onCornersChange]);

  const handlePointerDown = (idx: number, e: React.PointerEvent) => {
    e.preventDefault();
    setDraggingIdx(idx);
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (draggingIdx === null || !imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;
    
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    setCorners(prev => {
      const newCorners = [...prev] as [Point, Point, Point, Point];
      newCorners[draggingIdx] = { x, y };
      return newCorners;
    });
  }, [draggingIdx]);

  const handlePointerUp = useCallback(() => {
    setDraggingIdx(null);
  }, []);

  useEffect(() => {
    if (draggingIdx !== null) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingIdx, handlePointerMove, handlePointerUp]);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none touch-none bg-black">
      <div className="relative inline-block" style={{ maxWidth: '100%', maxHeight: '100%' }}>
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Crop Target"
          className="max-w-full max-h-[65vh] object-contain pointer-events-none shadow-2xl"
          draggable={false}
        />
        
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
          <polygon
            points={corners.map(c => `${c.x * 100}%,${c.y * 100}%`).join(' ')}
            fill="rgba(0, 229, 255, 0.15)"
            stroke="#00E5FF"
            strokeWidth="2"
          />
          {corners.map((c, i) => (
            <g key={i} className="pointer-events-auto cursor-move outline-none" style={{ touchAction: 'none' }} onPointerDown={(e) => handlePointerDown(i, e)}>
              <circle cx={`${c.x * 100}%`} cy={`${c.y * 100}%`} r="30" fill="transparent" />
              <circle cx={`${c.x * 100}%`} cy={`${c.y * 100}%`} r="10" fill="white" stroke="#00E5FF" strokeWidth="3" className="drop-shadow-lg" />
            </g>
          ))}
        </svg>
      </div>
      
      {draggingIdx !== null && (
         <div className="absolute top-4 left-4 right-4 text-center text-white text-[11px] font-bold bg-black/60 backdrop-blur p-3 rounded-xl pointer-events-none z-20 animate-in fade-in">
            Align corners exactly with the label edges to flatten it.
         </div>
      )}
    </div>
  );
}
