import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

function App() {
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState('p1');
  const [pages, setPages] = useState('');
  const [shares, setShares] = useState('');

  // Fetch players
  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    const res = await axios.get('http://localhost:4000/players');
    setPlayers(res.data);
  };

  const handleUpdateHabit = async () => {
    await axios.post('http://localhost:4000/update-habit', {
      playerId: selected,
      date: new Date().toISOString().split('T')[0],
      pages: parseInt(pages, 10)
    });
    setPages('');
    fetchPlayers();
  };

  const handleBuy = async () => {
    await axios.post('http://localhost:4000/buy', { playerId: selected, amount: parseInt(shares, 10) });
    setShares('');
    fetchPlayers();
  };

  const handleSell = async (index) => {
    await axios.post('http://localhost:4000/sell', { playerId: selected, shareIndex: index });
    fetchPlayers();
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
      <label>
        Select Player:
        <select value={selected} onChange={e => setSelected(e.target.value)}>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <div style={{ marginTop: 20 }}>
        <h2>Cash: ${current.cash}</h2>
        <Line data={chartData} />
      </div>
      <div style={{ marginTop: 20 }}>
        <input
          type="number"
          placeholder="Pages read today"
          value={pages}
          onChange={e => setPages(e.target.value)}
        />
        <button onClick={handleUpdateHabit}>Update Habit</button>
      </div>
      <div style={{ marginTop: 20 }}>
        <input
          type="number"
          placeholder="Shares to buy"
          value={shares}
          onChange={e => setShares(e.target.value)}
        />
        <button onClick={handleBuy}>Buy Shares</button>
      </div>
      <div style={{ marginTop: 20 }}>
        <h3>Your Shares</h3>
        <ul>
          {current.shares.map((s, i) => (
            <li key={i}>
              Bought {s.amount} @ {s.purchasePrice} on {s.purchaseDate}
              <button onClick={() => handleSell(i)}>Sell</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
