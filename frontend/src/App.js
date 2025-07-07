import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

function App() {
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState('p1');
  const [pages, setPages] = useState('');
  const [shares, setShares] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch players
  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('http://localhost:4000/players');
      setPlayers(res.data);
    } catch (err) {
      setError('Failed to load players. Please check if the server is running.');
      console.error('Error fetching players:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHabit = async () => {
    if (!pages || isNaN(parseInt(pages, 10)) || parseInt(pages, 10) < 0) {
      setError('Please enter a valid number of pages (0 or greater)');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await axios.post('http://localhost:4000/update-habit', {
        playerId: selected,
        date: new Date().toISOString().split('T')[0],
        pages: parseInt(pages, 10)
      });
      setPages('');
      await fetchPlayers();
    } catch (err) {
      setError(err.response?.data || 'Failed to update habit. Please try again.');
      console.error('Error updating habit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!shares || isNaN(parseInt(shares, 10)) || parseInt(shares, 10) <= 0) {
      setError('Please enter a valid number of shares (greater than 0)');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await axios.post('http://localhost:4000/buy', { 
        playerId: selected, 
        amount: parseInt(shares, 10) 
      });
      setShares('');
      await fetchPlayers();
    } catch (err) {
      setError(err.response?.data || 'Failed to buy shares. Please try again.');
      console.error('Error buying shares:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async (index) => {
    try {
      setLoading(true);
      setError('');
      await axios.post('http://localhost:4000/sell', { 
        playerId: selected, 
        shareIndex: index 
      });
      await fetchPlayers();
    } catch (err) {
      setError(err.response?.data || 'Failed to sell shares. Please try again.');
      console.error('Error selling shares:', err);
    } finally {
      setLoading(false);
    }
  };

  const current = players.find(p => p.id === selected) || { habitHistory: [], shares: [], cash: 0 };

  // Data for chart
  const chartData = {
    labels: current.habitHistory.map(h => h.date),
    datasets: [{
      label: 'Pages Read',
      data: current.habitHistory.map(h => h.pages),
      fill: false,
      tension: 0.1
    }]
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Habit Stock Game</h1>
      
      {/* Loading indicator */}
      {loading && (
        <div style={{ padding: '10px', backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '4px', marginBottom: '10px' }}>
          Loading...
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div style={{ padding: '10px', backgroundColor: '#ffebee', border: '1px solid #f44336', borderRadius: '4px', marginBottom: '10px', color: '#d32f2f' }}>
          {error}
          <button 
            onClick={() => setError('')} 
            style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}
      
      <label>
        Select Player:
        <select value={selected} onChange={e => setSelected(e.target.value)} disabled={loading}>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <div style={{ marginTop: 20 }}>
        <h2>Cash: ${current.cash.toFixed(2)}</h2>
        <h3>Current Stock Price: ${current.habitHistory.length > 0 ? Math.max(current.habitHistory[current.habitHistory.length - 1].pages, 1) : 1}</h3>
        {current.habitHistory.length > 0 ? (
          <Line data={chartData} />
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            No reading history yet. Start tracking your reading to see the chart!
          </div>
        )}
      </div>
      <div style={{ marginTop: 20 }}>
        <input
          type="number"
          placeholder="Pages read today"
          value={pages}
          onChange={e => setPages(e.target.value)}
          disabled={loading}
          min="0"
        />
        <button onClick={handleUpdateHabit} disabled={loading}>
          Update Habit
        </button>
      </div>
      <div style={{ marginTop: 20 }}>
        <input
          type="number"
          placeholder="Shares to buy"
          value={shares}
          onChange={e => setShares(e.target.value)}
          disabled={loading}
          min="1"
        />
        <button onClick={handleBuy} disabled={loading}>
          Buy Shares
        </button>
      </div>
      <div style={{ marginTop: 20 }}>
        <h3>Your Shares</h3>
        {current.shares.length > 0 ? (
          <>
            <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
              <strong>Portfolio Summary:</strong><br />
              Total Shares: {current.shares.reduce((sum, s) => sum + s.amount, 0)}<br />
              Current Value: ${current.shares.reduce((sum, s) => {
                const currentPrice = current.habitHistory.length > 0 ? Math.max(current.habitHistory[current.habitHistory.length - 1].pages, 1) : 1;
                return sum + (s.amount * currentPrice);
              }, 0).toFixed(2)}
            </div>
            <ul>
              {current.shares.map((s, i) => {
                const currentPrice = current.habitHistory.length > 0 ? Math.max(current.habitHistory[current.habitHistory.length - 1].pages, 1) : 1;
                const currentValue = s.amount * currentPrice;
                const profitLoss = currentValue - (s.amount * s.purchasePrice);
                return (
                  <li key={i} style={{ marginBottom: '5px' }}>
                    Bought {s.amount} @ ${s.purchasePrice} on {new Date(s.purchaseDate).toLocaleDateString()}
                    <br />
                    <small>
                      Current Value: ${currentValue.toFixed(2)} 
                      <span style={{ color: profitLoss >= 0 ? 'green' : 'red', marginLeft: '10px' }}>
                        ({profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)})
                      </span>
                    </small>
                    <button onClick={() => handleSell(i)} disabled={loading} style={{ marginLeft: '10px' }}>
                      Sell
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            No shares owned yet. Buy some shares to start trading!
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
