import React from 'react';

const ICONS = {
  reading: '📖',
  exercise: '💪',
  meditation: '🧘',
  writing: '✍️',
  coding: '💻',
  music: '🎵',
  art: '🎨',
  cooking: '👨‍🍳',
  language: '🗣️',
  gaming: '🎮'
};

export default function HabitCard({ type, title, value, progress, onClick }) {
  // pick color from CSS var or use default
  const color = `var(--${type}-color, #3b82f6)`;
  
  return (
    <div 
      className="p-4 rounded-lg shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 border-2" 
      style={{ borderColor: color }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold" style={{ color }}>
          {ICONS[type] || '📋'} {title}
        </h3>
        {progress && (
          <div className="text-sm opacity-75">
            {progress}%
          </div>
        )}
      </div>
      <p className="text-lg">{value}</p>
      {progress && (
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300" 
            style={{ 
              width: `${Math.min(progress, 100)}%`, 
              backgroundColor: color 
            }}
          ></div>
        </div>
      )}
    </div>
  );
} 