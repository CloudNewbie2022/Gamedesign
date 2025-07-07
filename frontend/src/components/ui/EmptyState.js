import React from 'react';

export default function EmptyState({ 
  title = "No Data Available", 
  message = "Start by adding some habit progress to see your data here.",
  icon = "📊",
  actionText,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
        {message}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
} 