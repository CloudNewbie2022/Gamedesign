import React, { useState, useEffect, createContext } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Game from './components/Game';
import ImportStats from './components/ImportStats';
import './App.css';

const Sidebar = ({ currentTab, setTab }) => (
  <div className="sidebar">
    <div className={`sidebar-tab${currentTab === 'portfolio' ? ' active' : ''}`} onClick={() => setTab('portfolio')}>Your Portfolio</div>
    <div className={`sidebar-tab${currentTab === 'import' ? ' active' : ''}`} onClick={() => setTab('import')}>Import Stats</div>
    <div className={`sidebar-tab${currentTab === 'readers' ? ' active' : ''}`} onClick={() => setTab('readers')}>Readers</div>
    <div className={`sidebar-tab${currentTab === 'rally' ? ' active' : ''}`} onClick={() => setTab('rally')}>Rally</div>
  </div>
);

export const DarkModeContext = createContext(false);

function Readers({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:4000/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setUsers(res.data);
      } catch (err) {
        setError('Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // For demo: just show usernames and a placeholder 30-day graph
  return (
    <div className="readers-tab">
      <h2>Readers (30 Day Cycle)</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="error">{error}</div>}
      <ul>
        {users.map(u => (
          <li key={u.id}>{u.username}</li>
        ))}
      </ul>
      {/* Placeholder for 30-day graph */}
      <div style={{marginTop: 24, background: '#fff', borderRadius: 8, padding: 16}}>
        <b>30-Day Reading Graph (Coming Soon)</b>
      </div>
    </div>
  );
}

function Rally() {
  return (
    <div className="rally-tab">
      <h2>Rally</h2>
      <div>Feature coming soon!</div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('portfolio');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <DarkModeContext.Provider value={darkMode}>
      <div className={`app-container app-flex${darkMode ? ' dark' : ''}`}>
        <Sidebar currentTab={tab} setTab={setTab} />
        <div className="main-content-area">
          <div style={{textAlign:'right',marginBottom:16}}>
            <button onClick={() => setDarkMode(dm => !dm)} className="dark-toggle-btn">
              {darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
          </div>
          {tab === 'portfolio' && <Game user={user} onLogout={handleLogout} />}
          {tab === 'import' && <ImportStats onSave={() => setTab('portfolio')} />}
          {tab === 'readers' && <Readers user={user} />}
          {tab === 'rally' && <Rally />}
        </div>
      </div>
    </DarkModeContext.Provider>
  );
}

export default App;
