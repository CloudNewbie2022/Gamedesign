/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'reading-color': '#3b82f6',
        'exercise-color': '#10b981',
        'meditation-color': '#8b5cf6',
        'writing-color': '#f59e0b',
        'coding-color': '#ef4444',
        'music-color': '#ec4899',
        'art-color': '#06b6d4',
        'cooking-color': '#84cc16',
        'language-color': '#f97316',
        'gaming-color': '#6366f1'
      }
    },
  },
  plugins: [],
} 