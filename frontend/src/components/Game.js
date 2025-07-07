import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './Game.css';
import ImportStats from './ImportStats';
import '../components/ImportStats.css';

const Game = ({ user, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [pages, setPages] = useState('');
  const [shares, setShares] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [importStats, setImportStats] = useState(user.stats || null);

  // Fetch users for trading
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:4000/users');
      setUsers(res.data);
      // Set first other user as default target
      const otherUsers = res.data.filter(u => u.id !== user.id);
      if (otherUsers.length > 0 && !selectedTarget) {
        setSelectedTarget(otherUsers[0].id);
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch users. Please try again.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHabit = async () => {
    if (loading || isLocked) return;
    if (!pages || pages <= 0) {
      setError('Please enter a valid number of pages');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await axios.post('http://localhost:4000/update-habit', {
        date: new Date().toISOString().split('T')[0],
        pages: parseInt(pages, 10)
      });
      setPages('');
      await fetchUsers();
      setSuccess('Habit updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setIsLocked(true);
      setTimeout(() => setIsLocked(false), 10000);
    } catch (err) {
      setError('Failed to update habit. Please try again.');
      console.error('Error updating habit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNoRead = async () => {
    if (loading || isLocked) return;
    try {
      setLoading(true);
      setError('');
      await axios.post('http://localhost:4000/update-habit', {
        date: new Date().toISOString().split('T')[0],
        pages: 0
      });
      setPages('');
      await fetchUsers();
      setSuccess("Marked as didn't read for today!");
      setTimeout(() => setSuccess(''), 3000);
      setIsLocked(true);
      setTimeout(() => setIsLocked(false), 10000);
    } catch (err) {
      setError('Failed to mark no-read. Please try again.');
      console.error('Error marking no-read:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (loading) return;
    if (!selectedTarget) {
      setError('Please select a user to buy shares from.');
      return;
    }
    if (!shares || shares <= 0) {
      setError('Please enter a valid number of shares');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await axios.post('http://localhost:4000/buy', {
        targetUserId: selectedTarget,
        amount: parseInt(shares, 10)
      });
      setShares('');
      await fetchUsers();
      setSuccess('Shares purchased successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to purchase shares. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async (index) => {
    try {
      setLoading(true);
      setError('');
      await axios.post('http://localhost:4000/sell', { 
        shareIndex: index 
      });
      await fetchUsers();
      setSuccess('Shares sold successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to sell shares. Please try again.');
      console.error('Error selling shares:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    onLogout();
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await axios.post('http://localhost:4000/reset');
      await fetchUsers();
      setSuccess('Game reset successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to reset game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentUser = users.find(u => u.id === user.id) || user;
  const targetUser = users.find(u => u.id === selectedTarget);

  // Chart configuration
  const chartData = {
    labels: currentUser.habitHistory?.map(h => h.date) || [],
    datasets: [{
      label: 'Pages Read',
      data: currentUser.habitHistory?.map(h => h.pages) || [],
      fill: false,
      borderColor: '#61dafb',
      backgroundColor: 'rgba(97, 218, 251, 0.1)',
      tension: 0.4,
      pointBackgroundColor: '#61dafb',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#ffffff',
          font: {
            size: 14
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#b0b0b0'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#b0b0b0'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  // Save imported stats to backend
  const handleImportSave = async (stats) => {
    setImportMsg('');
    try {
      const res = await axios.post('http://localhost:4000/import-stats', stats, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setImportStats(res.data.stats);
      setImportMsg('Stats imported successfully!');
      setShowImport(false);
    } catch (err) {
      setImportMsg(err.response?.data?.error || 'Failed to import stats.');
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="game-container">
        <div className="loading">Loading Habit Stock Game...</div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <header className="game-header">
        <div className="header-left">
          <h1>Habit Stock Game</h1>
          <p>Welcome, {user.username}!</p>
        </div>
        <div className="header-right">
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <main className="main-content">
        <section className="cash-chart">
          <h2>Your Portfolio: ${currentUser.cash || 0}</h2>
          <div className="chart-wrapper">
            {currentUser.habitHistory && currentUser.habitHistory.length > 0 ? (
              <Line data={chartData} options={chartOptions} height={300} />
            ) : (
              <div style={{ 
                height: '300px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#b0b0b0'
              }}>
                No habit data yet. Start reading to see your progress!
              </div>
            )}
          </div>
        </section>

        <section className="actions">
          <div className="action-group">
            <h3>Update Your Reading Habit</h3>
            <input
              className="action-input"
              type="number"
              placeholder="Pages read today"
              value={pages}
              onChange={e => setPages(e.target.value)}
              disabled={loading || isLocked}
            />
            <button 
              className="action-button" 
              onClick={handleUpdateHabit}
              disabled={loading || isLocked}
            >
              {loading ? 'Updating...' : isLocked ? 'Locked' : 'Update Habit'}
            </button>
            <button
              className="no-read-button"
              onClick={handleNoRead}
              disabled={loading || isLocked}
            >
              {loading ? '...' : isLocked ? 'Locked' : "Didn't Read Today"}
            </button>
          </div>
          
          <div className="action-group">
            <h3>Trade Shares</h3>
            <select 
              className="action-select"
              value={selectedTarget}
              onChange={e => setSelectedTarget(e.target.value)}
              disabled={loading}
            >
              <option value="">Select a user to trade with</option>
              {users.filter(u => u.id !== user.id).map(u => (
                <option key={u.id} value={u.id}>
                  {u.username} (Price: ${u.currentPrice || 0})
                </option>
              ))}
            </select>
            <input
              className="action-input"
              type="number"
              placeholder="Shares to buy"
              value={shares}
              onChange={e => setShares(e.target.value)}
              disabled={loading || !selectedTarget}
            />
            <button 
              className="action-button" 
              onClick={handleBuy}
              disabled={loading || !selectedTarget}
            >
              {loading ? 'Buying...' : 'Buy Shares'}
            </button>
          </div>

          <div className="action-group">
            <button 
              className="reset-button" 
              onClick={handleReset}
              disabled={loading}
            >
              {loading ? 'Resetting...' : '🔄 Reset Game'}
            </button>
          </div>
        </section>
      </main>

      <section className="shares-list">
        <h3>Your Shares</h3>
        {currentUser.shares && currentUser.shares.length > 0 ? (
          <ul>
            {currentUser.shares.map((s, i) => (
              <li key={i}>
                <div className="share-info">
                  <span className="share-amount">{s.amount} shares</span>
                  <span className="share-price">in {s.targetUsername}</span>
                  <span className="share-price">@ ${s.purchasePrice}</span>
                  <div className="share-date">
                    {new Date(s.purchaseDate).toLocaleDateString()}
                  </div>
                </div>
                <button 
                  className="sell-button" 
                  onClick={() => handleSell(i)}
                  disabled={loading}
                >
                  Sell
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            color: '#b0b0b0', 
            padding: '2rem' 
          }}>
            No shares owned yet. Buy some shares to start trading!
          </div>
        )}
      </section>

      <div style={{marginBottom: 16}}>
        <button onClick={() => setShowImport(true)} style={{background:'#4fa8d1',color:'#fff'}}>Import Stats</button>
        {importMsg && <div style={{color: importMsg.includes('success') ? 'green' : 'red'}}>{importMsg}</div>}
      </div>
      {showImport && <ImportStats onSave={handleImportSave} />}
      {importStats && (
        <div className="imported-stats-summary" style={{background:'#fff',color:'#222',borderRadius:8,padding:16,margin:'1em 0'}}>
          <h3>Your Imported Stats</h3>
          <div>Books Read: <b>{importStats.booksRead}</b></div>
          <div>Pages Read: <b>{importStats.pagesRead}</b></div>
          <div>Daily Pages (last 7): <b>{importStats.dailyPages.slice(-7).join(', ')}</b></div>
        </div>
      )}
    </div>
  );
};

export default Game; 