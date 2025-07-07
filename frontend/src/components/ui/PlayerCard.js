import React, { useMemo } from 'react';
import TickerHeatMap from './TickerHeatMap';
import HabitCard from './HabitCard';
import MoodIndicator from './MoodIndicator';
import HabitChart from './HabitChart';

export default function PlayerCard({ 
  player, 
  isSelected, 
  onSelect, 
  onUpdateHabit,
  onBuyShares,
  onSellShares,
  isDarkMode = false
}) {
  const portfolioChange = useMemo(() => {
    if (!player.habits || player.habits.length === 0) return 0;
    
    const totalPages = player.habits.reduce((sum, habit) => sum + (habit.pages || 0), 0);
    const avgPages = totalPages / player.habits.length;
    
    // Calculate change based on recent activity vs average
    const recentHabits = player.habits.slice(-7); // Last 7 days
    const recentPages = recentHabits.reduce((sum, habit) => sum + (habit.pages || 0), 0);
    const recentAvg = recentPages / recentHabits.length;
    
    if (avgPages === 0) return 0;
    return ((recentAvg - avgPages) / avgPages) * 100;
  }, [player.habits]);

  const totalPages = useMemo(() => 
    player.habits?.reduce((sum, h) => sum + (h.pages || 0), 0) || 0, 
    [player.habits]
  );

  const streakDays = useMemo(() => 
    player.habits?.filter(h => h.pages > 0).length || 0, 
    [player.habits]
  );

  const recentActivity = useMemo(() => {
    const recent = player.habits?.slice(-1)[0];
    return recent ? recent.pages : 0;
  }, [player.habits]);

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-200 ${
        isSelected 
          ? 'border-blue-500 shadow-lg' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">{player.name}</h2>
          <MoodIndicator portfolioPct={portfolioChange} size="text-xl" />
        </div>
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
            <div className="text-sm font-bold text-blue-600">{totalPages}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Pages</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
            <div className="text-sm font-bold text-green-600">{streakDays}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Days</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
            <div className="text-sm font-bold text-purple-600">{recentActivity}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Today</div>
          </div>
        </div>
      </div>

      {/* Habit Tickers - Mobile Optimized */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <TickerHeatMap 
            symbol="READ" 
            changePct={portfolioChange} 
            onClick={() => onUpdateHabit(player.id)}
          />
          <TickerHeatMap 
            symbol="EXER" 
            changePct={portfolioChange * 0.8} 
            onClick={() => onUpdateHabit(player.id)}
          />
        </div>

        {/* Habit Cards - Simplified for Mobile */}
        <div className="space-y-3">
          <div 
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            onClick={() => onUpdateHabit(player.id)}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📖</span>
              <div>
                <div className="font-medium">Reading Progress</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{totalPages} pages total</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-blue-600">{Math.min((player.habits?.length || 0) * 10, 100)}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Complete</div>
            </div>
          </div>

          <div 
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            onClick={() => onUpdateHabit(player.id)}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💪</span>
              <div>
                <div className="font-medium">Exercise Streak</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{streakDays} days active</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-green-600">{Math.min(streakDays * 5, 100)}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Consistent</div>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={() => onUpdateHabit(player.id)}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          Add Progress
        </button>
      </div>

      {/* Chart Section - Collapsible for Mobile */}
      {player.habits && player.habits.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <div className="p-4">
            <HabitChart data={player.habits} isDarkMode={isDarkMode} />
          </div>
        </div>
      )}
    </div>
  );
} 