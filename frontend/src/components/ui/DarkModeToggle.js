import React from 'react';
import { useTheme } from './ThemeProvider';

export default function DarkModeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 touch-manipulation"
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? (
        <span className="text-xl sm:text-2xl">☀️</span>
      ) : (
        <span className="text-xl sm:text-2xl">🌙</span>
      )}
    </button>
  );
} 