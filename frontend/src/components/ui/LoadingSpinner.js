import React from 'react';

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 mx-auto mb-4"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
        </div>
        <div className="text-lg text-gray-600 dark:text-gray-400 font-medium">{message}</div>
        <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">Please wait...</div>
      </div>
    </div>
  );
} 