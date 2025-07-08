# Rally Reader - Stock Market Reading Game

A gamified reading platform where users' reading habits become tradable stocks with a sophisticated class-based pricing system and game locking mechanism.

## 🔒 Game Locking System

### Overview
The game is locked by default for all new users. Users must provide their reading statistics (90 days of daily reading data) before they can access any trading features.

### How It Works
1. **New User Registration**: All new users start with `gameLocked: true`
2. **Statistics Requirement**: Users must provide at least 90 days of daily reading data
3. **Game Unlock**: Once stats are imported, the game unlocks and all features become available
4. **Trading Protection**: Users cannot buy shares in other users who haven't unlocked their game

### User States
- **🔒 Locked**: Cannot access trading features, must import reading stats
- **🔓 Unlocked**: Full access to all game features

## 🎮 Game Mechanics

### Core Concept
- Each user is represented as a "company" with 100 shares
- Reading sessions increase share price using a curved formula
- Shareholders earn dividends when users log reading
- Users are classified into 7 tiers based on 30-day reading average

### Class System
1. **Nano** (0-50 pages/month) - Low volatility, small dividends
2. **Micro** (50-100 pages/month) - Growing potential
3. **Penny** (100-200 pages/month) - Moderate growth
4. **SmallCap** (200-350 pages/month) - Steady performer
5. **MidCap** (350-600 pages/month) - Strong growth
6. **LargeCap** (600-900 pages/month) - High value
7. **BlueChip** (900+ pages/month) - Premium stock

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

### 3. Test the Game Locking System
```bash
npm test
```

## 📊 API Endpoints

### Authentication & Game Status
- `POST /register` - Create new account (Game locked by default)
- `POST /login` - User login (Returns game lock status)
- `GET /profile` - Get user profile
- `GET /game-status` - Check if game is locked/unlocked

### Game Unlocking
- `POST /import-stats` - Import reading stats and unlock game
- `POST /import-storygraph` - Import StoryGraph stats

### Game Features (Requires Unlocked Game)
- `GET /users` - Get all users for trading
- `POST /update-habit` - Log reading session
- `POST /buy` - Buy shares in another user
- `POST /sell` - Sell shares
- `POST /reset` - Reset user data for testing

### Utility
- `GET /health` - Health check with lock statistics

## 🔧 Example Usage

### Register and Check Lock Status
```bash
# Register new user
curl -X POST http://localhost:4000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"reader1","password":"password123"}'

# Check game status
curl -X GET http://localhost:4000/game-status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Unlock Game with Reading Stats
```bash
# Import 90 days of reading data
curl -X POST http://localhost:4000/import-stats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "booksRead": 12,
    "pagesRead": 3600,
    "dailyPages": [25, 30, 15, 40, ...] // 90 days of data
  }'
```

### Access Trading Features (After Unlock)
```bash
# Get available users for trading
curl -X GET http://localhost:4000/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Log reading session
curl -X POST http://localhost:4000/update-habit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"date":"2024-01-01","pages":50}'
```

## 🧪 Testing

### Run Game Locking Tests
```bash
npm test
```

This will test:
- User registration with game locked
- Attempting to access locked features
- Importing reading stats to unlock game
- Verifying unlocked features work
- Login responses include lock status

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:4000/health

# Test registration
curl -X POST http://localhost:4000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password"}'
```

## 📋 User Data Structure

### Locked User
```json
{
  "id": "user123",
  "username": "reader1",
  "gameLocked": true,
  "readingStats": null,
  "avgPagesPerMonth": 0,
  "avgBooksPerMonth": 0,
  "totalPagesRead": 0,
  "totalBooksRead": 0,
  "cash": 1000,
  "habitHistory": [],
  "shares": []
}
```

### Unlocked User
```json
{
  "id": "user123",
  "username": "reader1",
  "gameLocked": false,
  "readingStats": {
    "booksRead": 12,
    "pagesRead": 3600,
    "dailyPages": [25, 30, 15, ...]
  },
  "avgPagesPerMonth": 120.5,
  "avgBooksPerMonth": 4.0,
  "totalPagesRead": 3600,
  "totalBooksRead": 12,
  "lastStatsUpdate": "2024-01-01T00:00:00.000Z",
  "cash": 1000,
  "habitHistory": [...],
  "shares": [...]
}
```

## 🔒 Security Features

- **Game Locking**: Prevents access to trading without reading stats
- **Trading Protection**: Cannot buy shares in locked users
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: All endpoints validate required data
- **Error Handling**: Comprehensive error responses

## 🚀 Next Steps

1. **Frontend Integration**: Build React frontend with lock status UI
2. **Database Persistence**: Replace in-memory storage with database
3. **Real-time Updates**: Add WebSocket support for live updates
4. **Advanced Analytics**: Enhanced reading insights and trends
5. **Social Features**: Following, leaderboards, achievements
6. **Mobile App**: React Native mobile application

## 📝 License

MIT License - see LICENSE file for details
