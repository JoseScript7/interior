'use client';

import { useRef, useState } from 'react';

interface Props {
  beforeUrl: string;
  afterUrl: string;
}

export function BeforeAfterSlider({ beforeUrl, afterUrl }: Props) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video overflow-hidden rounded-xl select-none cursor-ew-resize"
      onMouseMove={(e) => e.buttons === 1 && handleMove(e.clientX)}
      onClick={(e) => handleMove(e.clientX)}
    >
      <img src={beforeUrl} alt="Before" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img src={afterUrl} alt="After" className="h-full w-full object-cover" style={{ width: `${10000 / position}%`, maxWidth: 'none' }} />
      </div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center text-xs">↔</div>
      </div>
      <span className="absolute top-2 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">After</span>
      <span className="absolute top-2 right-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">Before</span>
    </div>
  );
}
