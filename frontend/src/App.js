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
  
  // Social features state
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [newComment, setNewComment] = useState({});
  
  // Book tracking state
  const [selectedBook, setSelectedBook] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [createPost, setCreatePost] = useState(false);
  
  // StoryGraph state
  const [storygraphUsername, setStorygraphUsername] = useState('');
  const [storygraphData, setStorygraphData] = useState(null);
  const [csvData, setCsvData] = useState('');

  // Fetch players and posts
  useEffect(() => {
    fetchPlayers();
    fetchPosts();
  }, []);

  // Load StoryGraph data for current player
  useEffect(() => {
    const current = players.find(p => p.id === selected);
    if (current && current.storygraphUsername) {
      setStorygraphUsername(current.storygraphUsername);
      fetchStorygraphData(current.storygraphUsername);
    }
  }, [selected, players]);

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

  // Fetch social posts
  const fetchPosts = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/feed?playerId=${selected}`);
      setPosts(res.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  // Search books
  const searchBooks = async (query) => {
    try {
      const res = await axios.get(`http://localhost:4000/books/search?query=${encodeURIComponent(query)}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Error searching books:', err);
    }
  };

  // Fetch StoryGraph data
  const fetchStorygraphData = async (username) => {
    try {
      const res = await axios.get(`http://localhost:4000/storygraph/user/${username}`);
      setStorygraphData(res.data);
    } catch (err) {
      console.error('Error fetching StoryGraph data:', err);
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
        pages: parseInt(pages, 10),
        book: selectedBook,
        createPost: createPost
      });
      setPages('');
      setSelectedBook('');
      setCreatePost(false);
      await fetchPlayers();
      if (createPost) {
        await fetchPosts();
      }
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

  // Social functions
  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    
    try {
      await axios.post('http://localhost:4000/posts', {
        playerId: selected,
        content: newPost
      });
      setNewPost('');
      await fetchPosts();
    } catch (err) {
      setError('Failed to create post');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      await axios.post(`http://localhost:4000/posts/${postId}/like`, {
        playerId: selected
      });
      await fetchPosts();
    } catch (err) {
      setError('Failed to like post');
    }
  };

  const handleComment = async (postId) => {
    const comment = newComment[postId];
    if (!comment || !comment.trim()) return;
    
    try {
      await axios.post(`http://localhost:4000/posts/${postId}/comment`, {
        playerId: selected,
        content: comment
      });
      setNewComment({ ...newComment, [postId]: '' });
      await fetchPosts();
    } catch (err) {
      setError('Failed to add comment');
    }
  };

  const handleFollow = async (targetPlayerId) => {
    try {
      await axios.post('http://localhost:4000/follow', {
        playerId: selected,
        targetPlayerId
      });
      await fetchPlayers();
      await fetchPosts();
    } catch (err) {
      setError('Failed to follow/unfollow user');
    }
  };

  // StoryGraph functions
  const handleConnectStorygraph = async () => {
    if (!storygraphUsername.trim()) {
      setError('Please enter your StoryGraph username');
      return;
    }
    
    try {
      setLoading(true);
      await axios.post('http://localhost:4000/storygraph/connect', {
        playerId: selected,
        username: storygraphUsername
      });
      await fetchPlayers();
      await fetchStorygraphData(storygraphUsername);
    } catch (err) {
      setError('Failed to connect StoryGraph account');
    } finally {
      setLoading(false);
    }
  };

  // Book search handler
  const handleBookSearch = async () => {
    if (bookSearch.trim()) {
      await searchBooks(bookSearch);
    }
  };

  // Sync StoryGraph data
  const handleSyncStorygraph = async () => {
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:4000/storygraph/sync', {
        playerId: selected
      });
      await fetchPlayers();
      await fetchStorygraphData(current.storygraphUsername);
      setError(''); // Clear any previous errors
      // Show success message
      setTimeout(() => {
        setError(''); // This will work as a success message too
      }, 3000);
    } catch (err) {
      setError(err.response?.data || 'Failed to sync StoryGraph data');
    } finally {
      setLoading(false);
    }
  };

  // Import CSV data
  const handleImportCsv = async () => {
    if (!csvData.trim()) {
      setError('Please paste your StoryGraph CSV data');
      return;
    }
    
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:4000/storygraph/import', {
        playerId: selected,
        csvData: csvData
      });
      await fetchPlayers();
      setCsvData('');
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err.response?.data || 'Failed to import CSV data');
    } finally {
      setLoading(false);
    }
  };

  const current = players.find(p => p.id === selected) || { 
    habitHistory: [], 
    shares: [], 
    cash: 0, 
    following: [], 
    followers: [],
    avatar: '📚',
    name: 'Unknown Player',
    storygraphUsername: ''
  };

  // Data for chart
  const chartData = {
    labels: current.habitHistory.map(h => h.date),
    datasets: [{
      label: 'Pages Read',
      data: current.habitHistory.map(h => h.pages),
      fill: false,
      borderColor: '#4f46e5',
      backgroundColor: '#4f46e5',
      tension: 0.1
    }]
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    nav: {
      display: 'flex',
      backgroundColor: 'white',
      borderBottom: '1px solid #e2e8f0',
      overflowX: 'auto'
    },
    tab: {
      padding: '12px 24px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      borderBottom: '3px solid transparent',
      fontSize: '14px',
      fontWeight: '500',
      whiteSpace: 'nowrap'
    },
    activeTab: {
      borderBottomColor: '#4f46e5',
      color: '#4f46e5'
    },
    content: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0'
    },
    button: {
      backgroundColor: '#4f46e5',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      marginBottom: '10px'
    }
  };

  const renderDashboard = () => (
    <div>
      <div style={styles.card}>
        <h2 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '24px', marginRight: '10px' }}>{current.avatar}</span>
          {current.name}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#166534' }}>Cash</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>
              ${current.cash.toFixed(2)}
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#1d4ed8' }}>Stock Price</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1d4ed8' }}>
              ${current.habitHistory.length > 0 ? Math.max(current.habitHistory[current.habitHistory.length - 1].pages, 1) : 1}
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#92400e' }}>Total Pages</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#92400e' }}>
              {current.habitHistory.reduce((sum, h) => sum + h.pages, 0)}
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fce7f3', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#be185d' }}>Followers</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#be185d' }}>
              {current.followers.length}
            </p>
          </div>
        </div>

        {current.habitHistory.length > 0 ? (
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', border: '2px dashed #d1d5db' }}>
            <p style={{ margin: 0, color: '#6b7280' }}>📊 No reading history yet. Start tracking your reading to see the chart!</p>
          </div>
        )}
      </div>

      {/* Reading Entry */}
      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>📚 Track Your Reading</h3>
        
        {/* Book Search */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
            Search for a book (optional)
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              style={styles.input}
              placeholder="Search books..."
              value={bookSearch}
              onChange={e => setBookSearch(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleBookSearch()}
            />
            <button onClick={handleBookSearch} style={styles.button}>Search</button>
          </div>
          
          {searchResults.length > 0 && (
            <div style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: '6px' }}>
              {searchResults.map(book => (
                <div 
                  key={book.id} 
                  onClick={() => {
                    setSelectedBook(book.title);
                    setSearchResults([]);
                    setBookSearch('');
                  }}
                  style={{ 
                    padding: '10px', 
                    borderBottom: '1px solid #e5e7eb', 
                    cursor: 'pointer',
                    ':hover': { backgroundColor: '#f9fafb' }
                  }}
                >
                  <strong>{book.title}</strong> by {book.author}
                  <br />
                  <small style={{ color: '#6b7280' }}>{book.pages} pages • ⭐ {book.rating}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedBook && (
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#ecfdf5', borderRadius: '6px', border: '1px solid #10b981' }}>
            <strong>Selected Book:</strong> {selectedBook}
            <button 
              onClick={() => setSelectedBook('')}
              style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
              Pages read today
            </label>
            <input
              type="number"
              style={styles.input}
              placeholder="Enter pages read..."
              value={pages}
              onChange={e => setPages(e.target.value)}
              disabled={loading}
              min="0"
            />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={createPost} 
                onChange={e => setCreatePost(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Share to social feed
            </label>
            <button onClick={handleUpdateHabit} disabled={loading} style={styles.button}>
              {loading ? 'Updating...' : 'Update Reading'}
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio */}
      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>💼 Your Portfolio</h3>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="number"
            style={{ ...styles.input, flex: 1 }}
            placeholder="Shares to buy"
            value={shares}
            onChange={e => setShares(e.target.value)}
            disabled={loading}
            min="1"
          />
          <button onClick={handleBuy} disabled={loading} style={styles.button}>
            Buy Shares
          </button>
        </div>

        {current.shares.length > 0 ? (
          <>
            <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
              <strong>Portfolio Summary:</strong><br />
              Total Shares: {current.shares.reduce((sum, s) => sum + s.amount, 0)}<br />
              Current Value: ${current.shares.reduce((sum, s) => {
                const currentPrice = current.habitHistory.length > 0 ? Math.max(current.habitHistory[current.habitHistory.length - 1].pages, 1) : 1;
                return sum + (s.amount * currentPrice);
              }, 0).toFixed(2)}
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {current.shares.map((s, i) => {
                const currentPrice = current.habitHistory.length > 0 ? Math.max(current.habitHistory[current.habitHistory.length - 1].pages, 1) : 1;
                const currentValue = s.amount * currentPrice;
                const profitLoss = currentValue - (s.amount * s.purchasePrice);
                return (
                  <div key={i} style={{ 
                    padding: '15px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div><strong>{s.amount} shares</strong> @ ${s.purchasePrice}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {new Date(s.purchaseDate).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '14px' }}>
                        Current Value: ${currentValue.toFixed(2)} 
                        <span style={{ color: profitLoss >= 0 ? '#10b981' : '#ef4444', marginLeft: '10px', fontWeight: 'bold' }}>
                          ({profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)})
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSell(i)} 
                      disabled={loading} 
                      style={{ ...styles.button, backgroundColor: '#ef4444' }}
                    >
                      Sell
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', border: '2px dashed #d1d5db' }}>
            <p style={{ margin: 0, color: '#6b7280' }}>💰 No shares owned yet. Buy some shares to start trading!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSocialFeed = () => (
    <div>
      {/* Create Post */}
      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>✍️ Create a Post</h3>
        <textarea
          style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
          placeholder="Share your reading progress, book recommendations, or thoughts..."
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
        />
        <button onClick={handleCreatePost} style={styles.button}>
          Post
        </button>
      </div>

      {/* Posts Feed */}
      <div>
        {posts.map(post => (
          <div key={post.id} style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px', marginRight: '10px' }}>
                {post.player?.avatar || '📚'}
              </span>
              <div>
                <strong>{post.player?.name || 'Unknown User'}</strong>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {new Date(post.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            
            <p style={{ margin: '10px 0' }}>{post.content}</p>
            
            {post.book && (
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '6px', 
                marginBottom: '10px',
                border: '1px solid #0ea5e9'
              }}>
                📖 <strong>{post.book}</strong>
                {post.pages > 0 && <span> • {post.pages} pages</span>}
              </div>
            )}

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <button 
                onClick={() => handleLikePost(post.id)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: post.likes.includes(selected) ? '#ef4444' : '#6b7280'
                }}
              >
                ❤️ {post.likes.length}
              </button>
              <span style={{ color: '#6b7280' }}>💬 {post.comments.length}</span>
            </div>

            {/* Comments */}
            {post.comments.map(comment => {
              const commenter = players.find(p => p.id === comment.playerId);
              return (
                <div key={comment.id} style={{ 
                  marginTop: '10px', 
                  paddingLeft: '20px', 
                  borderLeft: '2px solid #e2e8f0' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{commenter?.avatar || '📚'}</span>
                    <strong style={{ fontSize: '14px' }}>{commenter?.name || 'Unknown'}</strong>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {new Date(comment.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>{comment.content}</p>
                </div>
              );
            })}

            {/* Add Comment */}
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              <input
                style={{ ...styles.input, margin: 0, flex: 1 }}
                placeholder="Add a comment..."
                value={newComment[post.id] || ''}
                onChange={e => setNewComment({ ...newComment, [post.id]: e.target.value })}
                onKeyPress={e => e.key === 'Enter' && handleComment(post.id)}
              />
              <button 
                onClick={() => handleComment(post.id)} 
                style={{ ...styles.button, fontSize: '12px' }}
              >
                Comment
              </button>
            </div>
          </div>
        ))}
        
        {posts.length === 0 && (
          <div style={{ ...styles.card, textAlign: 'center', padding: '40px' }}>
            <p style={{ margin: 0, color: '#6b7280' }}>
              🌟 No posts yet. Be the first to share your reading journey!
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPeople = () => (
    <div>
      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>👥 Find People</h3>
        <div style={{ display: 'grid', gap: '15px' }}>
          {players.filter(p => p.id !== selected).map(player => (
            <div key={player.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '15px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>{player.avatar}</span>
                <div>
                  <strong>{player.name}</strong>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {player.habitHistory.reduce((sum, h) => sum + h.pages, 0)} total pages • 
                    {player.followers.length} followers
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleFollow(player.id)}
                style={{
                  ...styles.button,
                  backgroundColor: current.following.includes(player.id) ? '#6b7280' : '#4f46e5'
                }}
              >
                {current.following.includes(player.id) ? 'Unfollow' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStoryGraph = () => (
    <div>
      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>📈 StoryGraph Integration</h3>
        
        {!current.storygraphUsername ? (
          <div>
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#fef3c7', 
              borderRadius: '8px', 
              border: '1px solid #f59e0b',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 10px 0' }}>💡 How to Connect StoryGraph</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                Since StoryGraph doesn't have a public API, you can connect in two ways:
              </p>
              <ol style={{ fontSize: '14px', margin: '0', paddingLeft: '20px' }}>
                <li>Enter your username to see demo data</li>
                <li>Export your StoryGraph data as CSV and import it below</li>
              </ol>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                StoryGraph Username
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  style={{ ...styles.input, margin: 0, flex: 1 }}
                  placeholder="Enter your StoryGraph username"
                  value={storygraphUsername}
                  onChange={e => setStorygraphUsername(e.target.value)}
                />
                <button onClick={handleConnectStorygraph} disabled={loading} style={styles.button}>
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>📊 Import CSV Data</h4>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
                Export your reading data from StoryGraph and paste it here:
              </p>
              <textarea
                style={{ ...styles.input, minHeight: '120px', fontFamily: 'monospace', fontSize: '12px' }}
                placeholder="Paste your StoryGraph CSV data here...&#10;Format: Title, Author, Date Read, Rating, ...&#10;&#10;Example:&#10;&quot;The Great Gatsby&quot;,&quot;F. Scott Fitzgerald&quot;,&quot;2024-01-15&quot;,4"
                value={csvData}
                onChange={e => setCsvData(e.target.value)}
              />
              <button 
                onClick={handleImportCsv} 
                disabled={loading || !csvData.trim()} 
                style={{ ...styles.button, backgroundColor: '#059669' }}
              >
                {loading ? 'Importing...' : 'Import CSV Data'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#ecfdf5', 
              borderRadius: '8px', 
              border: '1px solid #10b981',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>✅ Connected to StoryGraph</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  @{current.storygraphUsername}
                  {storygraphData?.lastSync && (
                    <span> • Last sync: {new Date(storygraphData.lastSync).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleSyncStorygraph} 
                  disabled={loading}
                  style={{ ...styles.button, fontSize: '12px' }}
                >
                  {loading ? 'Syncing...' : '🔄 Sync'}
                </button>
                <button 
                  onClick={() => {
                    const player = players.find(p => p.id === selected);
                    if (player) {
                      player.storygraphUsername = '';
                      setStorygraphUsername('');
                      setStorygraphData(null);
                    }
                  }}
                  style={{ ...styles.button, backgroundColor: '#6b7280', fontSize: '12px' }}
                >
                  Disconnect
                </button>
              </div>
            </div>

            {storygraphData && (
              <div>
                {/* Stats Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>Books Read</h4>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                      {storygraphData.stats?.booksRead || storygraphData.booksRead || 0}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#ecfdf5', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>Pages Read</h4>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                      {storygraphData.stats?.pagesRead?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>Avg Rating</h4>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                      ⭐ {storygraphData.stats?.averageRating || 'N/A'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fce7f3', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>Reading Goal</h4>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                      {storygraphData.readingGoal?.current || 0}/{storygraphData.readingGoal?.target || 0}
                    </p>
                    <div style={{ 
                      width: '100%', 
                      height: '4px', 
                      backgroundColor: '#e2e8f0', 
                      borderRadius: '2px',
                      marginTop: '5px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${Math.min(100, (storygraphData.readingGoal?.current || 0) / (storygraphData.readingGoal?.target || 1) * 100)}%`, 
                        height: '100%', 
                        backgroundColor: '#be185d',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Currently Reading */}
                {storygraphData.currentlyReading && storygraphData.currentlyReading.length > 0 && (
                  <div style={{ marginBottom: '25px' }}>
                    <h4 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center' }}>
                      📖 Currently Reading ({storygraphData.currentlyReading.length})
                    </h4>
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {storygraphData.currentlyReading.map((book, i) => (
                        <div key={book.id || i} style={{ 
                          padding: '20px', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '12px',
                          backgroundColor: '#fafafa'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'start', gap: '15px' }}>
                            <span style={{ fontSize: '32px' }}>{book.coverUrl || '📚'}</span>
                            <div style={{ flex: 1 }}>
                              <h5 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{book.title}</h5>
                              <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '14px' }}>
                                by {book.author}
                              </p>
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ 
                                  width: '100%', 
                                  height: '8px', 
                                  backgroundColor: '#e2e8f0', 
                                  borderRadius: '4px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{ 
                                    width: `${book.progress}%`, 
                                    height: '100%', 
                                    backgroundColor: '#4f46e5',
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                                  <small style={{ color: '#6b7280' }}>
                                    {book.progress}% complete
                                  </small>
                                  <small style={{ color: '#6b7280' }}>
                                    {Math.round(book.totalPages * book.progress / 100)}/{book.totalPages} pages
                                  </small>
                                </div>
                              </div>
                              {book.startDate && (
                                <small style={{ color: '#6b7280' }}>
                                  Started: {new Date(book.startDate).toLocaleDateString()}
                                </small>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recently Finished */}
                {storygraphData.recentlyFinished && storygraphData.recentlyFinished.length > 0 && (
                  <div style={{ marginBottom: '25px' }}>
                    <h4 style={{ margin: '0 0 15px 0' }}>📚 Recently Finished</h4>
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {storygraphData.recentlyFinished.slice(0, 5).map((book, i) => (
                        <div key={book.id || i} style={{ 
                          padding: '15px', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>{book.coverUrl || '📖'}</span>
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{book.title}</div>
                              <div style={{ color: '#6b7280', fontSize: '12px' }}>by {book.author}</div>
                              {book.review && (
                                <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '5px', fontStyle: 'italic' }}>
                                  "{book.review.substring(0, 100)}{book.review.length > 100 ? '...' : ''}"
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ marginBottom: '5px' }}>
                              {'⭐'.repeat(book.rating)}
                            </div>
                            <small style={{ color: '#6b7280' }}>
                              {new Date(book.dateFinished).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Favorite Genres */}
                {storygraphData.favoriteGenres && storygraphData.favoriteGenres.length > 0 && (
                  <div style={{ marginBottom: '25px' }}>
                    <h4 style={{ margin: '0 0 15px 0' }}>📊 Favorite Genres</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {storygraphData.favoriteGenres.map((genre, i) => (
                        <div key={i} style={{
                          padding: '8px 12px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '20px',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span style={{ fontWeight: 'bold' }}>{genre.name}</span>
                          <span style={{ 
                            backgroundColor: '#4f46e5', 
                            color: 'white', 
                            borderRadius: '10px', 
                            padding: '2px 6px', 
                            fontSize: '12px' 
                          }}>
                            {genre.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reading Moods */}
                {storygraphData.readingMoods && storygraphData.readingMoods.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 15px 0' }}>🎭 Reading Moods</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {storygraphData.readingMoods.map((mood, i) => (
                        <span key={i} style={{
                          padding: '6px 12px',
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #10b981',
                          borderRadius: '16px',
                          fontSize: '13px',
                          color: '#065f46'
                        }}>
                          {mood}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '28px' }}>📚 ReadStock</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <select 
              value={selected} 
              onChange={e => setSelected(e.target.value)} 
              disabled={loading}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: '1px solid rgba(255,255,255,0.3)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '14px'
              }}
            >
              {players.map(p => (
                <option key={p.id} value={p.id} style={{ color: 'black' }}>
                  {p.avatar} {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div style={{ 
          position: 'fixed', 
          top: '80px', 
          right: '20px', 
          zIndex: 1000,
          padding: '10px 20px', 
          backgroundColor: '#3b82f6', 
          color: 'white',
          borderRadius: '6px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          Loading...
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div style={{ 
          position: 'fixed', 
          top: '80px', 
          right: '20px', 
          zIndex: 1000,
          padding: '10px 20px', 
          backgroundColor: '#ef4444', 
          color: 'white',
          borderRadius: '6px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {error}
          <button 
            onClick={() => setError('')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              fontSize: '16px',
              padding: '0'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav style={styles.nav}>
        {[
          { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
          { id: 'social', label: '🌟 Social Feed', icon: '🌟' },
          { id: 'people', label: '👥 People', icon: '👥' },
          { id: 'storygraph', label: '📈 StoryGraph', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            style={{
              ...styles.tab,
              ...(currentTab === tab.id ? styles.activeTab : {})
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div style={styles.content}>
        {currentTab === 'dashboard' && renderDashboard()}
        {currentTab === 'social' && renderSocialFeed()}
        {currentTab === 'people' && renderPeople()}
        {currentTab === 'storygraph' && renderStoryGraph()}
      </div>
    </div>
  );
}

export default App;
