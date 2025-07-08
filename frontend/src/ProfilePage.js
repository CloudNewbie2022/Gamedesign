import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';

const ProfilePage = ({ playerId, currentUserId, onBack }) => {
  const [profileData, setProfileData] = useState(null);
  const [playerFeed, setPlayerFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProfileData();
    fetchPlayerFeed();
  }, [playerId]);

  const fetchProfileData = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/players/${playerId}`);
      setProfileData(res.data);
    } catch (err) {
      console.error('Error fetching profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerFeed = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/players/${playerId}/feed`);
      setPlayerFeed(res.data);
    } catch (err) {
      console.error('Error fetching player feed:', err);
    }
  };

  const handleFollow = async () => {
    try {
      await axios.post('http://localhost:4000/follow', {
        playerId: currentUserId,
        targetPlayerId: playerId
      });
      await fetchProfileData();
    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  if (loading || !profileData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading profile...</h2>
      </div>
    );
  }

  // Chart data for reading history
  const chartData = {
    labels: profileData.habitHistory.slice(-30).map(h => new Date(h.date).toLocaleDateString()),
    datasets: [{
      label: 'Pages Read',
      data: profileData.habitHistory.slice(-30).map(h => h.pages),
      fill: true,
      borderColor: '#4f46e5',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      tension: 0.1
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: true,
        text: 'Reading Progress (Last 30 Days)'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const styles = {
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '20px'
    },
    header: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      padding: '30px',
      color: 'white',
      marginBottom: '20px',
      position: 'relative'
    },
    backButton: {
      position: 'absolute',
      top: '20px',
      left: '20px',
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 12px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px'
    },
    profileInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    },
    avatar: {
      fontSize: '64px'
    },
    details: {
      flex: 1
    },
    name: {
      fontSize: '32px',
      fontWeight: 'bold',
      margin: '0 0 5px 0'
    },
    username: {
      fontSize: '18px',
      opacity: 0.9,
      margin: '0 0 15px 0'
    },
    followButton: {
      padding: '12px 24px',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '8px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    statsOverview: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '20px'
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      textAlign: 'center'
    },
    statValue: {
      fontSize: '28px',
      fontWeight: 'bold',
      margin: '0 0 5px 0'
    },
    statLabel: {
      fontSize: '14px',
      color: '#6b7280',
      margin: 0
    },
    nav: {
      display: 'flex',
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '4px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    tab: {
      flex: 1,
      padding: '12px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    },
    activeTab: {
      backgroundColor: '#4f46e5',
      color: 'white'
    },
    content: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    chartContainer: {
      height: '300px',
      marginBottom: '20px'
    },
    favoriteBooks: {
      display: 'grid',
      gap: '10px'
    },
    bookItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px'
    },
    post: {
      padding: '15px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      marginBottom: '15px'
    },
    postHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px'
    },
    postTime: {
      fontSize: '12px',
      color: '#6b7280',
      marginLeft: '10px'
    },
    recentActivity: {
      display: 'grid',
      gap: '15px'
    },
    activityItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px'
    }
  };

  const renderOverview = () => (
    <div>
      <div style={styles.chartContainer}>
        {profileData.habitHistory.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280' }}>
            No reading data available
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3>📚 Favorite Books</h3>
          <div style={styles.favoriteBooks}>
            {profileData.favoriteBooks.length > 0 ? (
              profileData.favoriteBooks.map((item, index) => (
                <div key={index} style={styles.bookItem}>
                  <span>{item.book}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{item.pages} pages</span>
                </div>
              ))
            ) : (
              <p style={{ color: '#6b7280', textAlign: 'center' }}>No favorite books yet</p>
            )}
          </div>
        </div>

        <div>
          <h3>🎯 Recent Activity</h3>
          <div style={styles.recentActivity}>
            {profileData.recentActivity.recentHabits.map((habit, index) => (
              <div key={index} style={styles.activityItem}>
                <span style={{ fontSize: '20px' }}>📖</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500' }}>Read {habit.pages} pages</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {new Date(habit.date).toLocaleDateString()}
                    {habit.book && ` • ${habit.book}`}
                  </div>
                </div>
              </div>
            ))}
            {profileData.recentActivity.recentHabits.length === 0 && (
              <p style={{ color: '#6b7280', textAlign: 'center' }}>No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeed = () => (
    <div>
      {playerFeed.length > 0 ? (
        playerFeed.map(post => (
          <div key={post.id} style={styles.post}>
            <div style={styles.postHeader}>
              <span style={{ fontSize: '20px', marginRight: '10px' }}>{profileData.avatar}</span>
              <strong>{profileData.name}</strong>
              <span style={styles.postTime}>
                {new Date(post.timestamp).toLocaleString()}
              </span>
            </div>
            <p style={{ margin: '10px 0' }}>{post.content}</p>
            {post.book && (
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '6px',
                border: '1px solid #0ea5e9'
              }}>
                📖 <strong>{post.book}</strong>
                {post.pages > 0 && <span> • {post.pages} pages</span>}
              </div>
            )}
            <div style={{ marginTop: '10px', color: '#6b7280', fontSize: '14px' }}>
              ❤️ {post.likes.length} • 💬 {post.comments.length}
            </div>
          </div>
        ))
      ) : (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
          <p>📝</p>
          <p>No posts yet</p>
        </div>
      )}
    </div>
  );

  const renderStats = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={styles.statCard}>
          <h4>📊 Reading Statistics</h4>
          <div style={{ textAlign: 'left' }}>
            <p><strong>Total Pages:</strong> {profileData.stats.totalPages}</p>
            <p><strong>Average Pages/Day:</strong> {Math.round(profileData.stats.averagePages)}</p>
            <p><strong>Current Streak:</strong> {profileData.stats.readingStreak} days</p>
            <p><strong>Books Read:</strong> {profileData.stats.booksRead}</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <h4>💰 Stock Information</h4>
          <div style={{ textAlign: 'left' }}>
            <p><strong>Current Price:</strong> ${profileData.stats.currentPrice}</p>
            <p><strong>Total Portfolio Value:</strong> ${profileData.stats.totalValue.toFixed(2)}</p>
            <p><strong>Shares Outstanding:</strong> {profileData.shares.reduce((sum, share) => sum + share.amount, 0)}</p>
            <p><strong>Cash Available:</strong> ${profileData.cash.toFixed(2)}</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <h4>👥 Social Information</h4>
          <div style={{ textAlign: 'left' }}>
            <p><strong>Followers:</strong> {profileData.stats.followersCount}</p>
            <p><strong>Following:</strong> {profileData.stats.followingCount}</p>
            <p><strong>Posts:</strong> {playerFeed.length}</p>
            <p><strong>Member Since:</strong> {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          ← Back
        </button>
        <div style={styles.profileInfo}>
          <span style={styles.avatar}>{profileData.avatar}</span>
          <div style={styles.details}>
            <h1 style={styles.name}>{profileData.name}</h1>
            <p style={styles.username}>@{profileData.name.toLowerCase().replace(' ', '')}</p>
            {playerId !== currentUserId && (
              <button style={styles.followButton} onClick={handleFollow}>
                {profileData.followers.includes(currentUserId) ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={styles.statsOverview}>
        <div style={styles.statCard}>
          <p style={{...styles.statValue, color: '#059669'}}>{profileData.stats.totalPages}</p>
          <p style={styles.statLabel}>Total Pages Read</p>
        </div>
        <div style={styles.statCard}>
          <p style={{...styles.statValue, color: '#dc2626'}}>${profileData.stats.currentPrice}</p>
          <p style={styles.statLabel}>Current Stock Price</p>
        </div>
        <div style={styles.statCard}>
          <p style={{...styles.statValue, color: '#7c3aed'}}>{profileData.stats.readingStreak}</p>
          <p style={styles.statLabel}>Reading Streak (days)</p>
        </div>
        <div style={styles.statCard}>
          <p style={{...styles.statValue, color: '#ea580c'}}>{profileData.stats.followersCount}</p>
          <p style={styles.statLabel}>Followers</p>
        </div>
      </div>

      <div style={styles.nav}>
        <button 
          style={{
            ...styles.tab,
            ...(activeTab === 'overview' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          style={{
            ...styles.tab,
            ...(activeTab === 'feed' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('feed')}
        >
          📝 Posts
        </button>
        <button 
          style={{
            ...styles.tab,
            ...(activeTab === 'stats' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('stats')}
        >
          📈 Statistics
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'feed' && renderFeed()}
        {activeTab === 'stats' && renderStats()}
      </div>
    </div>
  );
};

export default ProfilePage;