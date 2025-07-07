import React from 'react';

export default function TickerHeatMap({ symbol, changePct, onClick }) {
  // clamp intensity 0–1
  const intensity = Math.min(Math.abs(changePct) / 10, 1);
  const bg = changePct >= 0
    ? `rgba(16, 185, 129, ${intensity})`   // green
    : `rgba(239, 68, 68, ${intensity})`;    // red

  return (
    <div 
      className="p-4 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shadow-md touch-manipulation" 
      style={{ backgroundColor: bg }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="font-bold text-lg sm:text-xl">{symbol}</div>
      <div className="text-sm sm:text-base opacity-90 font-medium">
        {changePct >= 0 ? '+' : ''}{changePct.toFixed(1)}%
      </div>
    </div>
  );
} 