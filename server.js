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
  return hist.length ? hist[hist.length - 1].pages : 0;
}

// Helper function to define endpoints
function defineEndpoint(path, method, handler) {
  app[method](path, handler);
}

// Update habit data
defineEndpoint('/update-habit', 'post', (req, res) => {
  const { playerId, date, pages } = req.body;
  const player = players.find(p => p.id === playerId);
  if (!player) return res.status(404).send('Player not found');
  player.habitHistory.push({ date, pages });
  res.json(player);
});

// Buy shares
defineEndpoint('/buy', 'post', (req, res) => {
  const { playerId, amount } = req.body;
  const player = players.find(p => p.id === playerId);
  if (!player) return res.status(404).send('Player not found');
  const price = getCurrentPrice(player);
  const cost = price * amount;
  if (player.cash < cost) return res.status(400).send('Insufficient cash');
  player.cash -= cost;
  player.shares.push({ purchaseDate: new Date().toISOString(), purchasePrice: price, amount });
  res.json(player);
});

// Sell shares
defineEndpoint('/sell', 'post', (req, res) => {
  const { playerId, shareIndex } = req.body;
  const player = players.find(p => p.id === playerId);
  if (!player) return res.status(404).send('Player not found');
  const share = player.shares[shareIndex];
  if (!share) return res.status(400).send('Share not found');
  const price = getCurrentPrice(player);
  const revenue = price * share.amount;
  player.cash += revenue;
  player.shares.splice(shareIndex, 1);
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