const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const puppeteer = require('puppeteer');
require('dotenv').config();

// Import user management modules
const UserStorage = require('./userManager/userStorage');
const UserValidation = require('./userManager/userValidation');
const PasswordReset = require('./userManager/passwordReset');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Initialize user management
const userStorage = new UserStorage();
const userValidation = new UserValidation();
const passwordReset = new PasswordReset();

// Initialize storage on startup
userStorage.initialize();

// Clean up expired reset tokens every 5 minutes
setInterval(() => {
  passwordReset.cleanupExpiredTokens();
}, 5 * 60 * 1000);

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

// Middleware to check if game is unlocked
const requireGameUnlocked = async (req, res, next) => {
  try {
    const user = await userStorage.loadUser(req.user.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.gameLocked) {
      return res.status(403).json({ 
        error: 'Game is locked', 
        message: 'Please provide your reading statistics to unlock the game',
        gameLocked: true,
        requiresStats: true
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in requireGameUnlocked middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper: calculate price (pages read of last entry)
function getCurrentPrice(user) {
  const hist = user.habitHistory;
  return hist.length ? hist[hist.length - 1].pages : 0;
}

// Helper: calculate user's reading statistics
function calculateReadingStats(user) {
  if (!user.readingStats || !user.readingStats.dailyPages) {
    return {
      avgPagesPerMonth: 0,
      avgBooksPerMonth: 0,
      totalPagesRead: 0,
      totalBooksRead: 0
    };
  }
  
  const dailyPages = user.readingStats.dailyPages;
  const totalPages = dailyPages.reduce((sum, pages) => sum + (pages || 0), 0);
  const avgPagesPerDay = totalPages / dailyPages.length;
  const avgPagesPerMonth = avgPagesPerDay * 30;
  const avgBooksPerMonth = user.readingStats.booksRead / (dailyPages.length / 30);
  
  return {
    avgPagesPerMonth: Math.round(avgPagesPerMonth * 10) / 10,
    avgBooksPerMonth: Math.round(avgBooksPerMonth * 10) / 10,
    totalPagesRead: totalPages,
    totalBooksRead: user.readingStats.booksRead || 0
  };
}

// Helper function to define endpoints
function defineEndpoint(path, method, handler) {
  app[method](path, handler);
}

// Get available genres for registration
app.get('/genres', (req, res) => {
  res.json(userValidation.getValidGenres());
});

// Register new user
app.post('/register', async (req, res) => {
  try {
    const { name, username, password, email, favoriteGenre } = req.body;
    
    // Validate registration data
    const validation = await userValidation.validateRegistration({
      name, username, password, email, favoriteGenre
    });
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        errors: validation.errors,
        warnings: validation.warnings
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user object
    const newUser = userValidation.createUserObject({
      name, username, password: hashedPassword, email, favoriteGenre
    });
    
    // Save user to encrypted storage
    const saved = await userStorage.saveUser(newUser);
    if (!saved) {
      return res.status(500).json({ error: 'Failed to save user' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ 
      id: newUser.id, 
      username: newUser.username 
    }, JWT_SECRET, { expiresIn: '24h' });
    
    // Return sanitized user data
    const userData = userValidation.sanitizeUserData(newUser);
    
    console.log(`👤 New user registered: ${username} (${name}) - ${favoriteGenre} reader`);
    
    res.status(201).json({
      message: 'Account created successfully! Please provide reading statistics to unlock the game.',
      user: userData,
      token,
      gameLocked: true,
      warnings: validation.warnings
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
    
    // Load user from storage
    const user = await userStorage.loadUser(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Update last login
    await userStorage.updateUser(username, {
      lastLogin: new Date().toISOString()
    });
    
    // Generate JWT token
    const token = jwt.sign({ 
      id: user.id, 
      username: user.username 
    }, JWT_SECRET, { expiresIn: '24h' });
    
    // Return sanitized user data
    const userData = userValidation.sanitizeUserData(user);
    
    console.log(`🔓 User logged in: ${username} (${user.name}) - Game ${user.gameLocked ? 'locked' : 'unlocked'}`);
    
    res.json({
      message: user.gameLocked ? 'Login successful. Please provide reading statistics to unlock the game.' : 'Login successful',
      user: userData,
      token,
      gameLocked: user.gameLocked
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await userStorage.loadUser(req.user.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userValidation.sanitizeUserData(user);
    res.json(userData);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
app.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, favoriteGenre, bio, avatar } = req.body;
    
    // Validate profile update data
    const validation = await userValidation.validateProfileUpdate(req.user.username, {
      name, email, favoriteGenre
    });
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        errors: validation.errors,
        warnings: validation.warnings
      });
    }
    
    // Update user
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (favoriteGenre !== undefined) updates.favoriteGenre = favoriteGenre;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    
    const success = await userStorage.updateUser(req.user.username, updates);
    if (!success) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }
    
    // Load updated user
    const updatedUser = await userStorage.loadUser(req.user.username);
    const userData = userValidation.sanitizeUserData(updatedUser);
    
    console.log(`📝 Profile updated for ${req.user.username}`);
    
    res.json({
      message: 'Profile updated successfully',
      user: userData,
      warnings: validation.warnings
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request password reset
app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const result = await passwordReset.createResetRequest(email);
    res.json(result);
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password with token
app.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    
    const result = await passwordReset.resetPassword(token, newPassword);
    res.json(result);
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password (for logged-in users)
app.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    const validation = userValidation.validatePasswordChange(currentPassword, newPassword, confirmPassword);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        errors: validation.errors
      });
    }
    
    const result = await passwordReset.changePassword(req.user.username, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game status (locked/unlocked)
app.get('/game-status', authenticateToken, async (req, res) => {
  try {
    const user = await userStorage.loadUser(req.user.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const stats = calculateReadingStats(user);
    
    res.json({
      gameLocked: user.gameLocked,
      readingStats: user.readingStats,
      calculatedStats: stats,
      requiresStats: user.gameLocked
    });
  } catch (error) {
    console.error('Error getting game status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import reading statistics and unlock game
app.post('/import-stats', authenticateToken, async (req, res) => {
  try {
    const { booksRead, pagesRead, dailyPages } = req.body;
    
    if (!Array.isArray(dailyPages) || dailyPages.length < 90) {
      return res.status(400).json({ 
        error: 'Must provide at least 90 days of dailyPages.',
        message: 'Please provide 90 days of reading data to unlock the game'
      });
    }
    
    const user = await userStorage.loadUser(req.user.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Update user stats
    const updates = {
      readingStats: {
        booksRead: Number(booksRead) || 0,
        pagesRead: Number(pagesRead) || 0,
        dailyPages: dailyPages.map(x => Number(x) || 0)
      },
      lastStatsUpdate: new Date().toISOString(),
      gameLocked: false
    };
    
    // Calculate averages
    const stats = calculateReadingStats({
      ...user,
      readingStats: updates.readingStats
    });
    updates.avgPagesPerMonth = stats.avgPagesPerMonth;
    updates.avgBooksPerMonth = stats.avgBooksPerMonth;
    updates.totalPagesRead = stats.totalPagesRead;
    updates.totalBooksRead = stats.totalBooksRead;
    
    // Save updated user
    const success = await userStorage.updateUser(req.user.username, updates);
    if (!success) {
      return res.status(500).json({ error: 'Failed to update user stats' });
    }
    
    console.log(`📊 User ${user.username} (${user.name}) unlocked game with ${stats.avgPagesPerMonth} pages/month average`);
    
    // Load updated user
    const updatedUser = await userStorage.loadUser(req.user.username);
    const userData = userValidation.sanitizeUserData(updatedUser);
    
    res.json({ 
      message: 'Reading statistics imported successfully! Game is now unlocked.',
      user: userData,
      gameLocked: false,
      stats: updates.readingStats,
      calculatedStats: stats
    });
  } catch (error) {
    console.error('Error importing stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (for trading - returns basic info only) - REQUIRES GAME UNLOCKED
app.get('/users', authenticateToken, requireGameUnlocked, async (req, res) => {
  try {
    const allUsers = await userStorage.loadAllUsers();
    const userList = allUsers
      .filter(u => !u.gameLocked && u.username !== req.user.username) // Only show unlocked users, exclude self
      .map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        favoriteGenre: user.favoriteGenre,
        currentPrice: getCurrentPrice(user),
        createdAt: user.createdAt,
        avgPagesPerMonth: user.avgPagesPerMonth,
        avgBooksPerMonth: user.avgBooksPerMonth,
        avatar: user.avatar
      }));
    res.json(userList);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset user data for testing - REQUIRES GAME UNLOCKED
app.post('/reset', authenticateToken, requireGameUnlocked, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  user.habitHistory = [];
  user.shares = [];
  user.cash = 1000;
  
  console.log(`🔄 User ${user.username} reset to initial state`);
  const { password: _, ...userData } = user;
  res.json({ message: 'User reset successfully', user: userData });
});

// Update habit data - REQUIRES GAME UNLOCKED
app.post('/update-habit', authenticateToken, requireGameUnlocked, (req, res) => {
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

// Buy shares in another user - REQUIRES GAME UNLOCKED
app.post('/buy', authenticateToken, requireGameUnlocked, (req, res) => {
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
    
    // Check if target user has unlocked their game
    if (targetUser.gameLocked) {
      return res.status(400).json({ error: 'Cannot buy shares in a user who has not unlocked their game.' });
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

// Sell shares - REQUIRES GAME UNLOCKED
app.post('/sell', authenticateToken, requireGameUnlocked, (req, res) => {
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

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const allUsers = await userStorage.loadAllUsers();
    const lockedUsers = allUsers.filter(u => u.gameLocked).length;
    const unlockedUsers = allUsers.filter(u => !u.gameLocked).length;
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      users: allUsers.length,
      lockedUsers,
      unlockedUsers,
      storage: 'encrypted_file_system'
    });
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      error: 'Storage system error'
    });
  }
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
  console.log(`🚀 Rally Reader Server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /genres - Get available genres for registration`);
  console.log(`   POST /register - Register new user (Name, Username, Password, Email, Favorite Genre)`);
  console.log(`   POST /login - Login user`);
  console.log(`   GET  /profile - Get user profile`);
  console.log(`   PUT  /profile - Update user profile`);
  console.log(`   POST /forgot-password - Request password reset`);
  console.log(`   POST /reset-password - Reset password with token`);
  console.log(`   POST /change-password - Change password (authenticated)`);
  console.log(`   GET  /game-status - Check if game is locked/unlocked`);
  console.log(`   POST /import-stats - Import reading stats and unlock game`);
  console.log(`   GET  /users - Get all users for trading (Requires game unlocked)`);
  console.log(`   POST /reset - Reset user data for testing (Requires game unlocked)`);
  console.log(`   POST /update-habit - Update reading habit (Requires game unlocked)`);
  console.log(`   POST /buy - Buy shares in another user (Requires game unlocked)`);
  console.log(`   POST /sell - Sell shares (Requires game unlocked)`);
  console.log(`   POST /import-storygraph - Import StoryGraph stats`);
  console.log(`\n🔒 Game Locking System:`);
  console.log(`   - New users start with game locked`);
  console.log(`   - Must provide 90 days of reading data to unlock`);
  console.log(`   - All trading features require unlocked game`);
  console.log(`\n🔐 Security Features:`);
  console.log(`   - Encrypted user data storage`);
  console.log(`   - Password reset functionality`);
  console.log(`   - Comprehensive input validation`);
  console.log(`   - JWT authentication`);
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