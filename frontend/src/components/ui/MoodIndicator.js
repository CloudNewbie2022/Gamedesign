import React from 'react';

export default function MoodIndicator({ portfolioPct, size = 'text-3xl' }) {
  let face = '😐';
  let description = 'Neutral';
  
  if (portfolioPct > 10) {
    face = '🤩';
    description = 'Excellent!';
  } else if (portfolioPct > 5) {
    face = '😃';
    description = 'Great!';
  } else if (portfolioPct > 0) {
    face = '🙂';
    description = 'Good';
  } else if (portfolioPct > -5) {
    face = '😐';
    description = 'Okay';
  } else if (portfolioPct > -10) {
    face = '😕';
    description = 'Could be better';
  } else {
    face = '😢';
    description = 'Needs improvement';
  }

  return (
    <div className="flex items-center space-x-2">
      <span className={size}>{face}</span>
      <span className="text-sm opacity-75">{description}</span>
    </div>
  );
} 