const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory store for 2 players
// Player type definition (for reference)
// type Player = {
//   id: string;
//   name: string;
//   habitHistory: { date: string; pages: number; }[];
//   shares: { purchaseDate: string; purchasePrice: number; amount: number; }[];
//   cash: number;
// };

let players = [
  { id: 'p1', name: 'Player1', habitHistory: [], shares: [], cash: 1000 },
  { id: 'p2', name: 'Player2', habitHistory: [], shares: [], cash: 1000 }
];

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
  const { playerId, date, pages } = req.body;
  
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
  } else {
    // Create new entry for new date
    player.habitHistory.push({ date, pages: parsedPages });
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

/*
Next Steps:
1. Run: npm install
2. Start server: npm start
3. Build a React frontend that interacts with these endpoints.
*/ 