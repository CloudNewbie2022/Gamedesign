# Habit Stock Tracker

A gamified habit tracking application that treats your daily habits like stocks in a portfolio. Track your reading progress, exercise routines, and other habits with beautiful visualizations and real-time mood indicators.

## Features

### 🎯 Core Components

- **TickerHeatMap**: Visual stock-like tickers showing habit performance with color-coded intensity
- **HabitCard**: Individual habit cards with progress bars and icons
- **MoodIndicator**: Emotional feedback based on portfolio performance
- **PlayerCard**: Complete player profiles with charts and statistics
- **Dark Mode**: Seamless theme switching with persistent preferences

### 📊 Visual Elements

- **Stock-like Interface**: Habits are displayed as stock tickers with green/red color coding
- **Progress Charts**: Interactive line charts showing habit progress over time
- **Mood System**: Emoji-based mood indicators that change based on performance
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile devices

### 🎮 Gamification Features

- **Portfolio Performance**: Track overall habit performance like a stock portfolio
- **Streak Tracking**: Monitor consecutive days of habit completion
- **Performance Metrics**: Calculate percentage changes and trends
- **Multi-Player Support**: Track multiple players/participants

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Start the backend server (in a separate terminal):
```bash
cd ..
node server.js
```

The application will be available at `http://localhost:3000`

## Usage

### Adding Habit Progress

1. Click on any player card to select them
2. Click on the habit tickers or cards to add progress
3. Enter the number of pages read (or other metric)
4. Click "Add Progress" to save

### Understanding the Interface

- **Green Tickers**: Positive performance (above average)
- **Red Tickers**: Below average performance
- **Intensity**: Color intensity indicates how far above/below average
- **Mood Indicator**: Overall emotional state based on recent performance

### Dark Mode

Click the sun/moon icon in the top-right corner to toggle between light and dark themes. Your preference is automatically saved.

## Component Architecture

```
src/
├── components/
│   ├── HabitTracker.js          # Main application component
│   └── ui/
│       ├── TickerHeatMap.js     # Stock-like habit tickers
│       ├── HabitCard.js         # Individual habit cards
│       ├── MoodIndicator.js     # Emotional feedback
│       ├── PlayerCard.js        # Player profiles
│       ├── HabitChart.js        # Progress charts
│       ├── ThemeProvider.js     # Dark/light mode management
│       └── DarkModeToggle.js    # Theme toggle button
```

## Customization

### Adding New Habit Types

1. Update the `ICONS` object in `HabitCard.js`
2. Add corresponding CSS variables in `index.css`
3. Update the Tailwind config colors if needed

### Styling

The application uses Tailwind CSS for styling. Custom colors and themes can be modified in:
- `tailwind.config.js` - Color definitions
- `src/index.css` - CSS variables and base styles

## API Integration

The application connects to a backend API at `http://localhost:4000` with the following endpoints:

- `GET /players` - Fetch all players and their habit data
- `POST /update-habit` - Add new habit progress for a player

## Technologies Used

- **React 19** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Interactive charts and graphs
- **Axios** - HTTP client for API calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
