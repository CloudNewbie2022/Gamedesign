import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';

const ProfileFlipCard = ({ player, currentUserId, onProfileClick }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchProfileData();
  }, [player.id]);

  useEffect(() => {
    if (isFlipped && !conversation) {
      createOrGetConversation();
    }
  }, [isFlipped]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchProfileData = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/players/${player.id}`);
      setProfileData(res.data);
    } catch (err) {
      console.error('Error fetching profile data:', err);
    }
  };

  const createOrGetConversation = async () => {
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:4000/chat/conversations', {
        playerId1: currentUserId,
        playerId2: player.id
      });
      setConversation(res.data);
      await fetchMessages(res.data.id);
    } catch (err) {
      console.error('Error creating conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const res = await axios.get(`http://localhost:4000/chat/conversations/${conversationId}/messages?playerId=${currentUserId}`);
      setMessages(res.data);
      
      // Mark messages as read
      await axios.post('http://localhost:4000/chat/messages/read', {
        conversationId,
        playerId: currentUserId
      });
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    try {
      await axios.post('http://localhost:4000/chat/messages', {
        conversationId: conversation.id,
        senderId: currentUserId,
        content: newMessage
      });
      setNewMessage('');
      await fetchMessages(conversation.id);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Chart data for mini profile chart
  const chartData = profileData ? {
    labels: profileData.habitHistory.slice(-7).map(h => new Date(h.date).toLocaleDateString()),
    datasets: [{
      label: 'Pages',
      data: profileData.habitHistory.slice(-7).map(h => h.pages),
      fill: false,
      borderColor: '#4f46e5',
      backgroundColor: '#4f46e5',
      tension: 0.1,
      pointRadius: 2
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  };

  const cardStyles = {
    flipCard: {
      backgroundColor: 'transparent',
      width: '350px',
      height: '500px',
      perspective: '1000px',
      margin: '10px',
      cursor: 'pointer'
    },
    flipCardInner: {
      position: 'relative',
      width: '100%',
      height: '100%',
      textAlign: 'center',
      transition: 'transform 0.6s',
      transformStyle: 'preserve-3d',
      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
    },
    flipCardFront: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backfaceVisibility: 'hidden',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column'
    },
    flipCardBack: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backfaceVisibility: 'hidden',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      padding: '20px',
      transform: 'rotateY(180deg)',
      display: 'flex',
      flexDirection: 'column'
    },
    profileHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '15px',
      borderBottom: '2px solid #f1f5f9'
    },
    avatar: {
      fontSize: '48px',
      marginRight: '15px'
    },
    profileInfo: {
      textAlign: 'left',
      flex: 1
    },
    name: {
      fontSize: '20px',
      fontWeight: 'bold',
      margin: '0 0 5px 0',
      color: '#1f2937'
    },
    username: {
      fontSize: '14px',
      color: '#6b7280',
      margin: 0
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px',
      marginBottom: '20px'
    },
    statCard: {
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      padding: '15px',
      textAlign: 'center'
    },
    statValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '0 0 5px 0'
    },
    statLabel: {
      fontSize: '12px',
      color: '#6b7280',
      margin: 0
    },
    chartContainer: {
      height: '80px',
      marginBottom: '20px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      padding: '10px'
    },
    actionButtons: {
      display: 'flex',
      gap: '10px',
      marginTop: 'auto'
    },
    button: {
      flex: 1,
      padding: '12px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s ease'
    },
    primaryButton: {
      backgroundColor: '#4f46e5',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#e5e7eb',
      color: '#374151'
    },
    chatHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: '15px',
      borderBottom: '1px solid #e2e8f0',
      marginBottom: '15px'
    },
    chatTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      margin: 0
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      marginBottom: '15px',
      padding: '5px'
    },
    message: {
      marginBottom: '12px',
      display: 'flex',
      flexDirection: 'column'
    },
    messageOwn: {
      alignItems: 'flex-end'
    },
    messageOther: {
      alignItems: 'flex-start'
    },
    messageBubble: {
      maxWidth: '80%',
      padding: '8px 12px',
      borderRadius: '18px',
      fontSize: '14px',
      wordWrap: 'break-word'
    },
    messageBubbleOwn: {
      backgroundColor: '#4f46e5',
      color: 'white'
    },
    messageBubbleOther: {
      backgroundColor: '#f1f5f9',
      color: '#374151'
    },
    messageTime: {
      fontSize: '10px',
      color: '#9ca3af',
      marginTop: '2px'
    },
    chatInput: {
      display: 'flex',
      gap: '8px'
    },
    input: {
      flex: 1,
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '20px',
      fontSize: '14px',
      outline: 'none'
    },
    sendButton: {
      padding: '8px 16px',
      backgroundColor: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '14px'
    }
  };

  if (!profileData) {
    return (
      <div style={cardStyles.flipCard}>
        <div style={cardStyles.flipCardInner}>
          <div style={cardStyles.flipCardFront}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyles.flipCard} onClick={(e) => e.stopPropagation()}>
      <div style={cardStyles.flipCardInner}>
        {/* Front Side - Profile */}
        <div style={cardStyles.flipCardFront}>
          <div style={cardStyles.profileHeader}>
            <span style={cardStyles.avatar}>{player.avatar}</span>
            <div style={cardStyles.profileInfo}>
              <h3 
                style={cardStyles.name}
                onClick={() => onProfileClick && onProfileClick(player.id)}
              >
                {player.name}
              </h3>
              <p style={cardStyles.username}>@{player.name.toLowerCase().replace(' ', '')}</p>
            </div>
          </div>

          <div style={cardStyles.statsGrid}>
            <div style={cardStyles.statCard}>
              <p style={{...cardStyles.statValue, color: '#059669'}}>{profileData.stats.totalPages}</p>
              <p style={cardStyles.statLabel}>Total Pages</p>
            </div>
            <div style={cardStyles.statCard}>
              <p style={{...cardStyles.statValue, color: '#dc2626'}}>${profileData.stats.currentPrice}</p>
              <p style={cardStyles.statLabel}>Stock Price</p>
            </div>
            <div style={cardStyles.statCard}>
              <p style={{...cardStyles.statValue, color: '#7c3aed'}}>{profileData.stats.readingStreak}</p>
              <p style={cardStyles.statLabel}>Day Streak</p>
            </div>
            <div style={cardStyles.statCard}>
              <p style={{...cardStyles.statValue, color: '#ea580c'}}>{profileData.stats.followersCount}</p>
              <p style={cardStyles.statLabel}>Followers</p>
            </div>
          </div>

          {chartData && (
            <div style={cardStyles.chartContainer}>
              <Line data={chartData} options={chartOptions} />
            </div>
          )}

          <div style={cardStyles.actionButtons}>
            <button 
              style={{...cardStyles.button, ...cardStyles.secondaryButton}}
              onClick={() => onProfileClick && onProfileClick(player.id)}
            >
              📊 View Profile
            </button>
            <button 
              style={{...cardStyles.button, ...cardStyles.primaryButton}}
              onClick={handleFlip}
            >
              💬 Chat
            </button>
          </div>
        </div>

        {/* Back Side - Chat */}
        <div style={cardStyles.flipCardBack}>
          <div style={cardStyles.chatHeader}>
            <h3 style={cardStyles.chatTitle}>Chat with {player.name}</h3>
            <button 
              onClick={handleFlip}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ↩️
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              Loading chat...
            </div>
          ) : (
            <>
              <div style={cardStyles.messagesContainer}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '50px' }}>
                    <p>💬</p>
                    <p>Start a conversation!</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <div 
                      key={message.id}
                      style={{
                        ...cardStyles.message,
                        ...(message.senderId === currentUserId ? cardStyles.messageOwn : cardStyles.messageOther)
                      }}
                    >
                      <div style={{
                        ...cardStyles.messageBubble,
                        ...(message.senderId === currentUserId ? cardStyles.messageBubbleOwn : cardStyles.messageBubbleOther)
                      }}>
                        {message.content}
                      </div>
                      <span style={cardStyles.messageTime}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div style={cardStyles.chatInput}>
                <input
                  style={cardStyles.input}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button style={cardStyles.sendButton} onClick={sendMessage}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileFlipCard;