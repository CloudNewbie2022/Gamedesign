const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory store for players and social data
// Player type definition (for reference)
// type Player = {
//   id: string;
//   name: string;
//   avatar: string;
//   habitHistory: { date: string; pages: number; book?: string; }[];
//   shares: { purchaseDate: string; purchasePrice: number; amount: number; }[];
//   cash: number;
//   following: string[];
//   followers: string[];
//   storygraphUsername?: string;
// };

let players = [
  { 
    id: 'p1', 
    name: 'Alice Reader', 
    avatar: '📚',
    habitHistory: [], 
    shares: [], 
    cash: 1000,
    following: ['p2'],
    followers: [],
    storygraphUsername: ''
  },
  { 
    id: 'p2', 
    name: 'Bob Bookworm', 
    avatar: '📖',
    habitHistory: [], 
    shares: [], 
    cash: 1000,
    following: [],
    followers: ['p1'],
    storygraphUsername: ''
  }
];

// Social posts store
let posts = [
  {
    id: 'post1',
    playerId: 'p1',
    content: 'Just finished 50 pages of "The Great Gatsby" today! 📚',
    timestamp: new Date().toISOString(),
    likes: ['p2'],
    comments: [
      { id: 'c1', playerId: 'p2', content: 'Great choice! Love that book.', timestamp: new Date().toISOString() }
    ],
    book: 'The Great Gatsby',
    pages: 50
  }
];

// Book data cache (from StoryGraph API)
let booksCache = {};

// Helper: calculate price (pages read of last entry)
function getCurrentPrice(player) {
  const hist = player.habitHistory;
  // Ensure minimum price of 1 to prevent zero-price exploit
  const lastPages = hist.length ? hist[hist.length - 1].pages : 0;
  return Math.max(lastPages, 1);
}

// Helper function to define endpoints
function defineEndpoint(path, method, handler) {
  app[method](path, handler);
}

// Update habit data
defineEndpoint('/update-habit', 'post', (req, res) => {
  const { playerId, date, pages, book, createPost } = req.body;
  
  // Input validation
  if (!playerId || !date || pages === undefined || pages === null) {
    return res.status(400).send('Missing required fields: playerId, date, pages');
  }
  
  const parsedPages = parseInt(pages, 10);
  if (isNaN(parsedPages) || parsedPages < 0) {
    return res.status(400).send('Pages must be a non-negative number');
  }
  
  const player = players.find(p => p.id === playerId);
  if (!player) return res.status(404).send('Player not found');
  
  // Check for existing entry on the same date
  const existingEntryIndex = player.habitHistory.findIndex(h => h.date === date);
  
  if (existingEntryIndex !== -1) {
    // Update existing entry by adding pages (allows multiple reading sessions per day)
    player.habitHistory[existingEntryIndex].pages += parsedPages;
    if (book) player.habitHistory[existingEntryIndex].book = book;
  } else {
    // Create new entry for new date
    player.habitHistory.push({ date, pages: parsedPages, book: book || '' });
  }
  
  // Create social post if requested
  if (createPost) {
    const postContent = book 
      ? `Just read ${parsedPages} pages of "${book}" today! 📚`
      : `Read ${parsedPages} pages today! Keep the momentum going! 📖`;
    
    const newPost = {
      id: `post_${Date.now()}`,
      playerId,
      content: postContent,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
      book: book || '',
      pages: parsedPages
    };
    
    posts.unshift(newPost); // Add to beginning of array
  }
  
  res.json(player);
});

// Buy shares
defineEndpoint('/buy', 'post', (req, res) => {
  const { playerId, amount } = req.body;
  
  // Input validation
  if (!playerId || amount === undefined || amount === null) {
    return res.status(400).send('Missing required fields: playerId, amount');
  }
  
  const parsedAmount = parseInt(amount, 10);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).send('Amount must be a positive number');
  }
  
  const player = players.find(p => p.id === playerId);
  if (!player) return res.status(404).send('Player not found');
  
  const price = getCurrentPrice(player);
  const cost = price * parsedAmount;
  
  if (player.cash < cost) {
    return res.status(400).send(`Insufficient cash. Cost: $${cost}, Available: $${player.cash}`);
  }
  
  player.cash -= cost;
  player.shares.push({ 
    purchaseDate: new Date().toISOString(), 
    purchasePrice: price, 
    amount: parsedAmount 
  });
  res.json(player);
});

// Sell shares
defineEndpoint('/sell', 'post', (req, res) => {
  const { playerId, shareIndex } = req.body;
  
  // Input validation
  if (!playerId || shareIndex === undefined || shareIndex === null) {
    return res.status(400).send('Missing required fields: playerId, shareIndex');
  }
  
  const parsedIndex = parseInt(shareIndex, 10);
  if (isNaN(parsedIndex) || parsedIndex < 0) {
    return res.status(400).send('ShareIndex must be a non-negative number');
  }
  
  const player = players.find(p => p.id === playerId);
  if (!player) return res.status(404).send('Player not found');
  
  if (parsedIndex >= player.shares.length) {
    return res.status(400).send(`Invalid share index. Player has ${player.shares.length} shares`);
  }
  
  const share = player.shares[parsedIndex];
  const price = getCurrentPrice(player);
  const revenue = price * share.amount;
  
  player.cash += revenue;
  player.shares.splice(parsedIndex, 1);
  res.json(player);
});

// Get all player data
app.get('/players', (req, res) => res.json(players));

// Social endpoints

// Get social feed
defineEndpoint('/feed', 'get', (req, res) => {
  const { playerId } = req.query;
  
  if (!playerId) {
    return res.json(posts); // Return all posts if no player specified
  }
  
  const player = players.find(p => p.id === playerId);
  if (!player) return res.status(404).send('Player not found');
  
  // Filter posts from player and people they follow
  const relevantPlayerIds = [playerId, ...player.following];
  const filteredPosts = posts.filter(post => relevantPlayerIds.includes(post.playerId));
  
  // Add player info to posts
  const enrichedPosts = filteredPosts.map(post => ({
    ...post,
    player: players.find(p => p.id === post.playerId)
  }));
  
  res.json(enrichedPosts);
});

// Create a post
defineEndpoint('/posts', 'post', (req, res) => {
  const { playerId, content, book, pages } = req.body;
  
  if (!playerId || !content) {
    return res.status(400).send('Missing required fields: playerId, content');
  }
  
  const player = players.find(p => p.id === playerId);
  if (!player) return res.status(404).send('Player not found');
  
  const newPost = {
    id: `post_${Date.now()}`,
    playerId,
    content,
    timestamp: new Date().toISOString(),
    likes: [],
    comments: [],
    book: book || '',
    pages: pages || 0
  };
  
  posts.unshift(newPost);
  res.json(newPost);
});

// Like/unlike a post
defineEndpoint('/posts/:postId/like', 'post', (req, res) => {
  const { postId } = req.params;
  const { playerId } = req.body;
  
  if (!playerId) {
    return res.status(400).send('Missing required field: playerId');
  }
  
  const post = posts.find(p => p.id === postId);
  if (!post) return res.status(404).send('Post not found');
  
  const likeIndex = post.likes.indexOf(playerId);
  if (likeIndex === -1) {
    // Add like
    post.likes.push(playerId);
  } else {
    // Remove like
    post.likes.splice(likeIndex, 1);
  }
  
  res.json(post);
});

// Comment on a post
defineEndpoint('/posts/:postId/comment', 'post', (req, res) => {
  const { postId } = req.params;
  const { playerId, content } = req.body;
  
  if (!playerId || !content) {
    return res.status(400).send('Missing required fields: playerId, content');
  }
  
  const post = posts.find(p => p.id === postId);
  if (!post) return res.status(404).send('Post not found');
  
  const newComment = {
    id: `comment_${Date.now()}`,
    playerId,
    content,
    timestamp: new Date().toISOString()
  };
  
  post.comments.push(newComment);
  res.json(post);
});

// Follow/unfollow a player
defineEndpoint('/follow', 'post', (req, res) => {
  const { playerId, targetPlayerId } = req.body;
  
  if (!playerId || !targetPlayerId) {
    return res.status(400).send('Missing required fields: playerId, targetPlayerId');
  }
  
  if (playerId === targetPlayerId) {
    return res.status(400).send('Cannot follow yourself');
  }
  
  const player = players.find(p => p.id === playerId);
  const targetPlayer = players.find(p => p.id === targetPlayerId);
  
  if (!player) return res.status(404).send('Player not found');
  if (!targetPlayer) return res.status(404).send('Target player not found');
  
  const followingIndex = player.following.indexOf(targetPlayerId);
  const followerIndex = targetPlayer.followers.indexOf(playerId);
  
  if (followingIndex === -1) {
    // Add follow
    player.following.push(targetPlayerId);
    targetPlayer.followers.push(playerId);
  } else {
    // Remove follow
    player.following.splice(followingIndex, 1);
    targetPlayer.followers.splice(followerIndex, 1);
  }
  
  res.json({ player, targetPlayer });
});

// StoryGraph integration endpoints

// Connect StoryGraph account
defineEndpoint('/storygraph/connect', 'post', (req, res) => {
  const { playerId, username } = req.body;
  
  if (!playerId || !username) {
    return res.status(400).send('Missing required fields: playerId, username');
  }
  
  const player = players.find(p => p.id === playerId);
  if (!player) return res.status(404).send('Player not found');
  
  player.storygraphUsername = username;
  res.json({ message: 'StoryGraph account connected successfully', player });
});

// Search books (mock StoryGraph API)
defineEndpoint('/books/search', 'get', (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).send('Missing search query');
  }
  
  // Mock book data (in real implementation, this would call StoryGraph API)
  const mockBooks = [
    {
      id: '1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      pages: 180,
      cover: '📚',
      rating: 4.2,
      description: 'A classic American novel about the Jazz Age.'
    },
    {
      id: '2', 
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      pages: 376,
      cover: '🐦',
      rating: 4.5,
      description: 'A powerful story of racial injustice and childhood innocence.'
    },
    {
      id: '3',
      title: 'Pride and Prejudice',
      author: 'Jane Austen', 
      pages: 432,
      cover: '💕',
      rating: 4.3,
      description: 'A romantic novel about Elizabeth Bennet and Mr. Darcy.'
    },
    {
      id: '4',
      title: '1984',
      author: 'George Orwell',
      pages: 328,
      cover: '👁️',
      rating: 4.4,
      description: 'A dystopian novel about totalitarian surveillance.'
    }
  ];
  
  const filteredBooks = mockBooks.filter(book => 
    book.title.toLowerCase().includes(query.toLowerCase()) ||
    book.author.toLowerCase().includes(query.toLowerCase())
  );
  
  res.json(filteredBooks);
});

// Get StoryGraph user data
defineEndpoint('/storygraph/user/:username', 'get', async (req, res) => {
  const { username } = req.params;
  
  try {
    // For now, we'll use enhanced mock data that simulates real StoryGraph data
    // In a real implementation, you would:
    // 1. Use StoryGraph's RSS feed if available
    // 2. Implement web scraping (with permission)
    // 3. Use a third-party service that aggregates reading data
    // 4. Ask users to manually input their StoryGraph export data
    
    const enhancedMockData = {
      username,
      connected: true,
      lastSync: new Date().toISOString(),
      stats: {
        booksRead: Math.floor(Math.random() * 100) + 20,
        pagesRead: Math.floor(Math.random() * 15000) + 5000,
        averageRating: (Math.random() * 2 + 3).toFixed(1),
        readingStreak: Math.floor(Math.random() * 30) + 1
      },
      currentlyReading: [
        {
          id: 'cr1',
          title: 'The Seven Husbands of Evelyn Hugo',
          author: 'Taylor Jenkins Reid',
          progress: Math.floor(Math.random() * 80) + 10,
          totalPages: 400,
          startDate: '2024-01-10',
          coverUrl: '📚'
        },
        {
          id: 'cr2',
          title: 'Project Hail Mary',
          author: 'Andy Weir',
          progress: Math.floor(Math.random() * 60) + 5,
          totalPages: 496,
          startDate: '2024-01-05',
          coverUrl: '🚀'
        }
      ],
      recentlyFinished: [
        {
          id: 'rf1',
          title: 'Klara and the Sun',
          author: 'Kazuo Ishiguro',
          rating: 4,
          dateFinished: '2024-01-08',
          review: 'Beautiful and haunting story about AI consciousness.',
          coverUrl: '🤖'
        },
        {
          id: 'rf2',
          title: 'The Midnight Library',
          author: 'Matt Haig',
          rating: 5,
          dateFinished: '2024-01-03',
          review: 'Life-changing perspective on choices and regrets.',
          coverUrl: '🌙'
        },
        {
          id: 'rf3',
          title: 'Educated',
          author: 'Tara Westover',
          rating: 5,
          dateFinished: '2023-12-28',
          review: 'Incredible memoir about education and family.',
          coverUrl: '📖'
        }
      ],
      readingGoal: {
        year: 2024,
        target: Math.floor(Math.random() * 50) + 25,
        current: Math.floor(Math.random() * 30) + 10,
        onTrack: true
      },
      favoriteGenres: [
        { name: 'Literary Fiction', count: 15 },
        { name: 'Science Fiction', count: 12 },
        { name: 'Non-fiction', count: 8 },
        { name: 'Fantasy', count: 7 }
      ],
      readingMoods: [
        'Adventurous', 'Dark', 'Emotional', 'Hopeful', 'Mysterious'
      ]
    };
    
    // Cache the data
    booksCache[username] = enhancedMockData;
    
    res.json(enhancedMockData);
  } catch (error) {
    console.error('Error fetching StoryGraph data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch StoryGraph data',
      message: 'Please check your username and try again'
    });
  }
});

// Sync reading progress from StoryGraph
defineEndpoint('/storygraph/sync', 'post', async (req, res) => {
  const { playerId } = req.body;
  
  try {
    const player = players.find(p => p.id === playerId);
    if (!player) return res.status(404).send('Player not found');
    
    if (!player.storygraphUsername) {
      return res.status(400).send('No StoryGraph account connected');
    }
    
    const storygraphData = booksCache[player.storygraphUsername];
    if (!storygraphData) {
      return res.status(404).send('StoryGraph data not found. Please reconnect your account.');
    }
    
    // Sync recently finished books to reading history
    const today = new Date().toISOString().split('T')[0];
    let totalNewPages = 0;
    
    storygraphData.recentlyFinished.forEach(book => {
      const finishDate = book.dateFinished;
      const existingEntry = player.habitHistory.find(h => h.date === finishDate);
      
      if (!existingEntry) {
        // Estimate pages read (could be improved with actual page data)
        const estimatedPages = Math.floor(Math.random() * 100) + 50;
        player.habitHistory.push({
          date: finishDate,
          pages: estimatedPages,
          book: book.title
        });
        totalNewPages += estimatedPages;
      }
    });
    
    // Update last sync time
    storygraphData.lastSync = new Date().toISOString();
    
    res.json({ 
      message: `Successfully synced ${totalNewPages} pages from StoryGraph`,
      player,
      newPages: totalNewPages
    });
    
  } catch (error) {
    console.error('Error syncing StoryGraph:', error);
    res.status(500).json({ error: 'Failed to sync StoryGraph data' });
  }
});

// Import StoryGraph CSV data
defineEndpoint('/storygraph/import', 'post', async (req, res) => {
  const { playerId, csvData } = req.body;
  
  try {
    const player = players.find(p => p.id === playerId);
    if (!player) return res.status(404).send('Player not found');
    
    // Parse CSV data (simplified - in real implementation, use a proper CSV parser)
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    let importedBooks = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= 3) {
        const title = values[0]?.replace(/"/g, '');
        const author = values[1]?.replace(/"/g, '');
        const dateRead = values[2]?.replace(/"/g, '');
        
        if (title && dateRead) {
          const existingEntry = player.habitHistory.find(h => h.date === dateRead);
          if (!existingEntry) {
            const estimatedPages = Math.floor(Math.random() * 200) + 100;
            player.habitHistory.push({
              date: dateRead,
              pages: estimatedPages,
              book: title
            });
            importedBooks++;
          }
        }
      }
    }
    
    res.json({ 
      message: `Successfully imported ${importedBooks} books from StoryGraph CSV`,
      player,
      importedCount: importedBooks
    });
    
  } catch (error) {
    console.error('Error importing StoryGraph CSV:', error);
    res.status(500).json({ error: 'Failed to import StoryGraph CSV data' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

/*
Next Steps:
1. Run: npm install
2. Start server: npm start
3. Build a React frontend that interacts with these endpoints.
*/ 