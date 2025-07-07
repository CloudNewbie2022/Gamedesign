const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// JWT secret (in production, use environment variable)
const JWT_SECRET = 'your-secret-key-change-in-production';

// In-memory store for users and their game data
let users = [
  {
    id: 'user1',
    username: 'demo',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
    habitHistory: [],
    shares: [],
    cash: 1000,
    createdAt: new Date().toISOString()
  }
];

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper: calculate price (pages read of last entry)
function getCurrentPrice(user) {
  const hist = user.habitHistory;
  return hist.length ? hist[hist.length - 1].pages : 0;
}

// Helper function to define endpoints
function defineEndpoint(path, method, handler) {
  app[method](path, handler);
}

// Register new user
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if username already exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      habitHistory: [],
      shares: [],
      cash: 1000,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    // Generate JWT token
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '24h' });
    
    // Return user data without password
    const { password: _, ...userData } = newUser;
    
    res.status(201).json({
      message: 'User registered successfully',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Find user
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    
    // Return user data without password
    const { password: _, ...userData } = user;
    
    res.json({
      message: 'Login successful',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
app.get('/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { password: _, ...userData } = user;
  res.json(userData);
});

// Get all users (for trading - returns basic info only)
app.get('/users', authenticateToken, (req, res) => {
  const userList = users.map(user => ({
    id: user.id,
    username: user.username,
    currentPrice: getCurrentPrice(user),
    createdAt: user.createdAt
  }));
  res.json(userList);
});

// Reset user data for testing
app.post('/reset', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  user.habitHistory = [];
  user.shares = [];
  user.cash = 1000;
  
  console.log(`User ${user.username} reset to initial state`);
  const { password: _, ...userData } = user;
  res.json({ message: 'User reset successfully', user: userData });
});

// Update habit data
app.post('/update-habit', authenticateToken, (req, res) => {
  try {
    const { date, pages } = req.body;
    console.log(`Updating habit for ${req.user.username}: ${pages} pages on ${date}`);
    
    if (!date || pages === undefined) {
      return res.status(400).json({ error: 'Missing required fields: date, pages' });
    }
    
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.habitHistory.push({ date, pages: parseInt(pages, 10) });
    console.log(`Updated ${user.username}: ${pages} pages, new price: ${getCurrentPrice(user)}`);
    
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Buy shares in another user
app.post('/buy', authenticateToken, (req, res) => {
  try {
    const { targetUserId, amount } = req.body;
    console.log(`Buying shares for ${req.user.username}: ${amount} shares in user ${targetUserId}`);
    
    if (!targetUserId || amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields: targetUserId, amount' });
    }
    
    // Prevent self-purchase
    if (targetUserId === req.user.id) {
      return res.status(403).json({ error: 'You cannot buy your own stock.' });
    }
    
    const buyer = users.find(u => u.id === req.user.id);
    const targetUser = users.find(u => u.id === targetUserId);
    
    if (!buyer || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const price = getCurrentPrice(targetUser);
    const cost = price * parseInt(amount, 10);
    
    console.log(`Current price: ${price}, Cost: ${cost}, Available cash: ${buyer.cash}`);
    
    if (buyer.cash < cost) {
      return res.status(400).json({ 
        error: 'Insufficient cash', 
        required: cost, 
        available: buyer.cash 
      });
    }
    
    buyer.cash -= cost;
    buyer.shares.push({ 
      targetUserId,
      targetUsername: targetUser.username,
      purchaseDate: new Date().toISOString(), 
      purchasePrice: price, 
      amount: parseInt(amount, 10) 
    });
    
    console.log(`Purchase successful: ${amount} shares at ${price} each`);
    const { password: _, ...userData } = buyer;
    res.json(userData);
  } catch (error) {
    console.error('Error buying shares:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sell shares
app.post('/sell', authenticateToken, (req, res) => {
  try {
    const { shareIndex } = req.body;
    console.log(`Selling shares for ${req.user.username}: share index ${shareIndex}`);
    
    if (shareIndex === undefined) {
      return res.status(400).json({ error: 'Missing required field: shareIndex' });
    }
    
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const share = user.shares[shareIndex];
    if (!share) return res.status(400).json({ error: 'Share not found' });
    
    const targetUser = users.find(u => u.id === share.targetUserId);
    if (!targetUser) return res.status(400).json({ error: 'Target user not found' });
    
    const price = getCurrentPrice(targetUser);
    const revenue = price * share.amount;
    
    console.log(`Selling ${share.amount} shares at ${price} each, revenue: ${revenue}`);
    
    user.cash += revenue;
    user.shares.splice(shareIndex, 1);
    
    console.log(`Sale successful, new cash balance: ${user.cash}`);
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error('Error selling shares:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add or update user stats
app.post('/import-stats', authenticateToken, (req, res) => {
  try {
    const { booksRead, pagesRead, dailyPages } = req.body;
    if (!Array.isArray(dailyPages) || dailyPages.length < 90) {
      return res.status(400).json({ error: 'Must provide at least 90 days of dailyPages.' });
    }
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.stats = {
      booksRead: Number(booksRead) || 0,
      pagesRead: Number(pagesRead) || 0,
      dailyPages: dailyPages.map(x => Number(x) || 0)
    };
    res.json({ message: 'Stats updated', stats: user.stats });
  } catch (error) {
    console.error('Error importing stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    users: users.length 
  });
});

const getLastThreeMonths = () => {
  const now = new Date();
  let months = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return months.reverse(); // oldest to newest
};

app.post('/import-storygraph', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://app.thestorygraph.com/login');
    await page.type('input[name=email]', email);
    await page.type('input[name=password]', password);
    await page.click('button[type=submit]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
    // Auto-detect username from profile link
    const profileUrl = await page.evaluate(() => {
      const el = document.querySelector('a[href^="/users/"]');
      return el ? el.getAttribute('href') : null;
    });
    if (!profileUrl) throw new Error('Could not detect StoryGraph username');
    const sgUsername = profileUrl.split('/').pop();
    // Get last 3 months
    const months = getLastThreeMonths();
    let allStats = [];
    for (const { year, month } of months) {
      const url = `https://app.thestorygraph.com/stats/${sgUsername}?year=${year}&month=${month}`;
      await page.goto(url, { waitUntil: 'networkidle2' });
      // Try to extract the JSON from the page (adjust selector as needed)
      const json = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const s of scripts) {
          if (s.textContent.includes('monthStats')) {
            try {
              const match = s.textContent.match(/monthStats":(\{.*?\})/);
              if (match) {
                return JSON.parse(match[1]);
              }
            } catch (e) {}
          }
        }
        return null;
      });
      // If no JSON or no dailyPages, fill with 30 zeros
      if (!json || !Array.isArray(json.dailyPages) || json.dailyPages.length === 0) {
        allStats.push({
          totalBooks: 0,
          totalPages: 0,
          avgRating: 0,
          topReads: [],
          avgBookLength: 0,
          avgFinishDays: 0,
          dailyPages: Array(30).fill(0)
        });
      } else {
        // If dailyPages is less than 30, pad with zeros
        if (json.dailyPages.length < 30) {
          json.dailyPages = [...json.dailyPages, ...Array(30 - json.dailyPages.length).fill(0)];
        }
        allStats.push(json);
      }
    }
    await browser.close();
    // Merge stats
    const merged = {
      booksRead: allStats.reduce((sum, s) => sum + (s.totalBooks || 0), 0),
      pagesRead: allStats.reduce((sum, s) => sum + (s.totalPages || 0), 0),
      dailyPages: allStats.flatMap(s => s.dailyPages || []),
      avgRating: allStats.reduce((sum, s) => sum + (s.avgRating || 0), 0) / allStats.length,
      topReads: allStats.flatMap(s => s.topReads || []),
      avgBookLength: allStats.reduce((sum, s) => sum + (s.avgBookLength || 0), 0) / allStats.length,
      avgFinishDays: allStats.reduce((sum, s) => sum + (s.avgFinishDays || 0), 0) / allStats.length
    };
    res.json(merged);
  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: 'Failed to import from StoryGraph: ' + err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /register - Register new user`);
  console.log(`   POST /login - Login user`);
  console.log(`   GET  /profile - Get user profile`);
  console.log(`   GET  /users - Get all users for trading`);
  console.log(`   POST /reset - Reset user data for testing`);
  console.log(`   POST /update-habit - Update reading habit`);
  console.log(`   POST /buy - Buy shares in another user`);
  console.log(`   POST /sell - Sell shares`);
  console.log(`   POST /import-stats - Import user stats`);
  console.log(`   POST /import-storygraph - Import StoryGraph stats`);
});

/*
Next Steps:
1. Install additional dependencies: npm install bcryptjs jsonwebtoken puppeteer
2. Run: npm start
3. Test with: curl http://localhost:4000/health
4. Register: curl -X POST http://localhost:4000/register -H "Content-Type: application/json" -d '{"username":"test","password":"password"}'
5. Login: curl -X POST http://localhost:4000/login -H "Content-Type: application/json" -d '{"username":"test","password":"password"}'
6. Build a React frontend with login/register forms.
*/ 