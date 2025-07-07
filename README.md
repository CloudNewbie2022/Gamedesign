# 📚 ReadStock - Social Reading Habit Tracker

A gamified reading habit tracker that combines social networking, stock market mechanics, and book discovery. Turn your reading progress into a trading game where your consistency drives your portfolio value!

## ✨ Features

### 🎯 Core Functionality
- **Habit Tracking**: Log daily reading progress with page counts and book titles
- **Stock Market Game**: Buy/sell shares where prices are based on your reading performance
- **Social Feed**: Share reading updates, achievements, and book recommendations
- **Book Discovery**: Search for books and track your reading journey

### 🌟 Social Features
- **Social Feed**: Post reading updates and engage with other readers
- **Following System**: Follow other readers and see their progress
- **Comments & Likes**: Interact with posts and build a reading community
- **Leaderboards**: Compare reading stats and portfolio performance

### 📈 StoryGraph Integration
- **Account Connection**: Link your StoryGraph profile (demo mode available)
- **Data Sync**: Import reading history and currently reading books
- **CSV Import**: Upload your StoryGraph export data
- **Reading Analytics**: View detailed stats, goals, and reading patterns

### 💼 Advanced Portfolio Features
- **Smart Pricing**: Minimum $1 stock price prevents exploitation
- **Portfolio Analytics**: Track profit/loss on individual positions
- **Reading Streaks**: Consistency bonuses affect stock performance
- **Multiple Sessions**: Add multiple reading sessions per day

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd readstock
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start the application**

   **Backend (Terminal 1):**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

   **Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## 📱 Usage Guide

### 📊 Dashboard
- View your cash balance, stock price, and total pages read
- Track reading progress with an interactive chart
- Monitor portfolio performance with profit/loss indicators

### 📚 Reading Tracker
- Search for books using the integrated book search
- Log daily reading with page counts
- Optionally share reading sessions to your social feed
- Track reading streaks and consistency

### 💰 Portfolio Management
- Buy shares when your reading performance is strong
- Sell shares to realize profits
- Monitor current portfolio value and individual position performance
- Stock prices are based on your recent reading activity (minimum $1)

### 🌟 Social Feed
- Create posts about your reading journey
- Like and comment on other users' posts
- Follow other readers to see their updates
- Share book recommendations and reviews

### 👥 People
- Discover other readers in the community
- Follow/unfollow users
- View reading stats and achievements

### 📈 StoryGraph Integration
- **Demo Mode**: Enter any username to see example data
- **CSV Import**: Export your StoryGraph data and paste it for real data import
- **Real-time Sync**: Connect your account for automatic data synchronization
- **Rich Analytics**: View reading goals, favorite genres, and reading moods

## 🔧 API Endpoints

### Reading Tracking
- `POST /update-habit` - Log reading progress
- `GET /players` - Get all players data

### Trading
- `POST /buy` - Buy shares
- `POST /sell` - Sell shares

### Social Features
- `GET /feed` - Get social feed
- `POST /posts` - Create a post
- `POST /posts/:id/like` - Like/unlike a post
- `POST /posts/:id/comment` - Comment on a post
- `POST /follow` - Follow/unfollow a user

### StoryGraph Integration
- `POST /storygraph/connect` - Connect StoryGraph account
- `GET /storygraph/user/:username` - Get user data
- `POST /storygraph/sync` - Sync reading progress
- `POST /storygraph/import` - Import CSV data

### Book Discovery
- `GET /books/search` - Search for books

## 🛠️ Technical Details

### Backend
- **Express.js** server with RESTful API
- **In-memory storage** (easily extensible to database)
- **CORS enabled** for frontend communication
- **Input validation** and error handling
- **Modular endpoint definitions**

### Frontend
- **React** with functional components and hooks
- **Chart.js** for reading progress visualization
- **Axios** for API communication
- **Modern CSS** with responsive design
- **Component-based architecture**

### Architecture
- **Separation of concerns** between frontend and backend
- **RESTful API design** for scalability
- **Error handling** at all levels
- **Responsive design** for mobile and desktop

## 🎯 Game Mechanics

### Stock Pricing Algorithm
```javascript
// Base price is pages read in last session, minimum $1
const stockPrice = Math.max(lastPagesRead, 1);
```

### Portfolio Calculation
- **Current Value**: `shares × current stock price`
- **Profit/Loss**: `current value - (shares × purchase price)`
- **Total Portfolio**: Sum of all positions

### Social Scoring
- Posts with book information get higher visibility
- Reading consistency affects engagement algorithms
- Community interaction boosts profile visibility

## 🔮 Future Enhancements

### Planned Features
- **Real database integration** (MongoDB/PostgreSQL)
- **User authentication** and profiles
- **Advanced analytics** with reading insights
- **Book recommendations** based on reading history
- **Reading challenges** and achievements
- **Real StoryGraph API** integration (when available)
- **Mobile app** for iOS and Android
- **Export functionality** for personal data

### Technical Improvements
- **TypeScript** migration for better type safety
- **Unit tests** for critical business logic
- **Rate limiting** and security enhancements
- **Caching** for improved performance
- **WebSocket** for real-time features

## 🐛 Bug Fixes Implemented

1. **✅ Zero Stock Price Exploit**: Fixed minimum $1 stock price
2. **✅ Multiple Daily Entries**: Now aggregates same-day reading sessions
3. **✅ Network Error Handling**: Comprehensive error handling with user feedback
4. **✅ Input Validation**: Server and client-side validation for all inputs
5. **✅ Loading States**: Proper loading indicators and disabled states

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by the book tracking community
- Chart.js for beautiful data visualization
- The reading and indie book communities for inspiration

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section below
2. Open an issue on GitHub
3. Contact the development team

### Troubleshooting

**Backend won't start:**
- Check if port 4000 is available
- Verify Node.js version (v14+)
- Run `npm install` to ensure dependencies are installed

**Frontend won't connect:**
- Ensure backend is running on port 4000
- Check browser console for CORS errors
- Verify frontend is running on port 3000

**StoryGraph sync not working:**
- This is expected - real API integration requires StoryGraph partnership
- Use CSV import feature for real data
- Demo mode provides example of full functionality

---

**Happy Reading! 📚✨**
