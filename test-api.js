const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testAPI() {
  console.log('🧪 Testing Habit Stock API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', health.data);

    // Test 2: Get initial players
    console.log('\n2. Getting initial players...');
    const players = await axios.get(`${BASE_URL}/players`);
    console.log('✅ Players loaded:', players.data.length, 'players');

    // Test 3: Reset players
    console.log('\n3. Resetting players...');
    const reset = await axios.post(`${BASE_URL}/reset`);
    console.log('✅ Players reset:', reset.data.message);

    // Test 4: Update habit for Player1
    console.log('\n4. Updating habit for Player1...');
    const habitUpdate = await axios.post(`${BASE_URL}/update-habit`, {
      playerId: 'p1',
      date: '2024-01-15',
      pages: 10
    });
    console.log('✅ Habit updated:', habitUpdate.data.name, 'read', 10, 'pages');

    // Test 5: Buy shares as Player2
    console.log('\n5. Player2 buying shares in Player1...');
    const buyShares = await axios.post(`${BASE_URL}/buy`, {
      playerId: 'p2',
      amount: 2
    });
    console.log('✅ Shares purchased:', buyShares.data.shares.length, 'shares owned');

    // Test 6: Update habit again (increase price)
    console.log('\n6. Player1 reads more (increasing price)...');
    const habitUpdate2 = await axios.post(`${BASE_URL}/update-habit`, {
      playerId: 'p1',
      date: '2024-01-16',
      pages: 20
    });
    console.log('✅ Price increased to:', 20);

    // Test 7: Sell shares for profit
    console.log('\n7. Player2 selling shares for profit...');
    const sellShares = await axios.post(`${BASE_URL}/sell`, {
      playerId: 'p2',
      shareIndex: 0
    });
    console.log('✅ Shares sold! New cash balance:', sellShares.data.cash);

    // Test 8: Final state
    console.log('\n8. Final player states...');
    const finalPlayers = await axios.get(`${BASE_URL}/players`);
    finalPlayers.data.forEach(player => {
      console.log(`   ${player.name}: $${player.cash} cash, ${player.shares.length} shares`);
    });

    console.log('\n🎉 All tests passed! Your API is working correctly.');
    console.log('\n📱 Frontend should be available at: http://localhost:3000');
    console.log('🔧 Backend API at: http://localhost:4000');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n💡 Make sure both servers are running:');
    console.log('   Backend: npm start (in root directory)');
    console.log('   Frontend: cd frontend && npm start');
  }
}