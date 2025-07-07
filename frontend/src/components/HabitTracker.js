import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import ThemeProvider, { useTheme } from './ui/ThemeProvider';
import DarkModeToggle from './ui/DarkModeToggle';
import PlayerCard from './ui/PlayerCard';
import TickerHeatMap from './ui/TickerHeatMap';
import HabitCard from './ui/HabitCard';
import MoodIndicator from './ui/MoodIndicator';
import LoadingSpinner from './ui/LoadingSpinner';
import EmptyState from './ui/EmptyState';

function HabitTrackerContent() {
  const { isDarkMode } = useTheme();
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitData, setNewHabitData] = useState({ pages: '', type: 'reading' });
  const [activeTab, setActiveTab] = useState('overview'); // overview, players, stats

  // Memoized calculations
  const overallMood = useMemo(() => {
    if (players.length === 0) return 0;
    
    const totalChange = players.reduce((sum, player) => {
      if (!player.habits || player.habits.length === 0) return sum;
      
      const totalPages = player.habits.reduce((s, h) => s + (h.pages || 0), 0);
      const avgPages = totalPages / player.habits.length;
      const recentHabits = player.habits.slice(-7);
      const recentPages = recentHabits.reduce((s, h) => s + (h.pages || 0), 0);
      const recentAvg = recentPages / recentHabits.length;
      
      if (avgPages === 0) return sum;
      return sum + ((recentAvg - avgPages) / avgPages) * 100;
    }, 0);
    
    return totalChange / players.length;
  }, [players]);

  const totalPages = useMemo(() => 
    players.reduce((sum, player) => 
      sum + (player.habits?.reduce((s, h) => s + (h.pages || 0), 0) || 0), 0
    ), [players]
  );

  const maxStreak = useMemo(() => 
    Math.max(...players.map(player => 
      player.habits?.filter(h => h.pages > 0).length || 0
    )), [players]
  );

  // Callbacks for better performance
  const fetchPlayers = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const res = await axios.get('http://localhost:4000/players');
      setPlayers(res.data);
      if (res.data.length > 0 && !selectedPlayer) {
        setSelectedPlayer(res.data[0].id);
      }
    } catch (err) {
      setError('Failed to fetch players.');
    } finally {
      setLoading(false);
    }
  }, [selectedPlayer]);

  const handleUpdateHabit = useCallback((playerId) => {
    setShowAddHabit(true);
    setSelectedPlayer(playerId);
  }, []);

  const handleAddHabit = useCallback(async () => {
    if (!newHabitData.pages || !selectedPlayer) return;
    
    try {
      setError('');
      setLoading(true);
      await axios.post('http://localhost:4000/update-habit', {
        playerId: selectedPlayer,
        date: new Date().toISOString().split('T')[0],
        pages: parseInt(newHabitData.pages, 10)
      });
      setNewHabitData({ pages: '', type: 'reading' });
      setShowAddHabit(false);
      fetchPlayers();
    } catch (err) {
      setError('Error updating habit.');
    } finally {
      setLoading(false);
    }
  }, [newHabitData.pages, selectedPlayer, fetchPlayers]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  if (loading) {
    return <LoadingSpinner message="Loading Habit Tracker..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Habit Stock
              </h1>
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-xs opacity-75">Mood:</span>
                <MoodIndicator portfolioPct={overallMood} size="text-lg" />
              </div>
            </div>
            <DarkModeToggle />
          </div>
          
          {/* Mobile Mood Indicator */}
          <div className="sm:hidden flex items-center justify-center mt-2">
            <span className="text-xs opacity-75 mr-2">Overall Mood:</span>
            <MoodIndicator portfolioPct={overallMood} size="text-lg" />
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'players'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Players ({players.length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'stats'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Stats
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 mx-4 mt-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Content Area */}
      <main className="px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-blue-600">{players.length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Players</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-green-600">{totalPages}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Pages</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-purple-600">{maxStreak}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Streak</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {players.slice(0, 3).map((player) => {
                  const recentHabits = player.habits?.slice(-3) || [];
                  return (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {recentHabits.length > 0 
                            ? `${recentHabits[recentHabits.length - 1].pages} pages today`
                            : 'No recent activity'
                          }
                        </div>
                      </div>
                      <button
                        onClick={() => handleUpdateHabit(player.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div className="space-y-4">
            {players.length === 0 ? (
              <EmptyState
                title="No Players Found"
                message="No players have been added yet. Check your backend server to ensure it's running and has player data."
                icon="👥"
              />
            ) : (
              players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isSelected={selectedPlayer === player.id}
                  onSelect={setSelectedPlayer}
                  onUpdateHabit={handleUpdateHabit}
                  isDarkMode={isDarkMode}
                />
              ))
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Reading Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Pages Read:</span>
                    <span className="font-bold">{totalPages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average per Player:</span>
                    <span className="font-bold">{players.length > 0 ? Math.round(totalPages / players.length) : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Longest Streak:</span>
                    <span className="font-bold">{maxStreak} days</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Overall Mood:</span>
                    <MoodIndicator portfolioPct={overallMood} size="text-lg" />
                  </div>
                  <div className="flex justify-between">
                    <span>Active Players:</span>
                    <span className="font-bold">{players.filter(p => p.habits?.length > 0).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Habits:</span>
                    <span className="font-bold">{players.reduce((sum, p) => sum + (p.habits?.length || 0), 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Habit Modal - Mobile Optimized */}
      {showAddHabit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-lg sm:rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add Habit Progress</h2>
              <button
                onClick={() => setShowAddHabit(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Pages Read</label>
                <input
                  type="number"
                  value={newHabitData.pages}
                  onChange={(e) => setNewHabitData({ ...newHabitData, pages: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-lg"
                  placeholder="Enter pages read"
                  autoFocus
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAddHabit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg disabled:opacity-50 font-medium"
                >
                  {loading ? 'Adding...' : 'Add Progress'}
                </button>
                <button
                  onClick={() => setShowAddHabit(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 py-3 px-4 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HabitTracker() {
  return (
    <ThemeProvider>
      <HabitTrackerContent />
    </ThemeProvider>
  );
} 