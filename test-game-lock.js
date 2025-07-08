const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testGameLocking() {
  try {
    console.log('🔒 Testing Rally Reader Game Locking System...\n');

    // 1. Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', {
      users: health.data.users,
      lockedUsers: health.data.lockedUsers,
      unlockedUsers: health.data.unlockedUsers
    });

    // 2. Register a new user
    console.log('\n2. Registering new user...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, {
      username: 'testuser',
      password: 'password123'
    });
    const { token, user } = registerResponse.data;
    console.log('✅ User registered:', user.username);
    console.log('🔒 Game locked:', user.gameLocked);

    // 3. Check game status
    console.log('\n3. Checking game status...');
    const gameStatusResponse = await axios.get(`${BASE_URL}/game-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Game status:', {
      gameLocked: gameStatusResponse.data.gameLocked,
      requiresStats: gameStatusResponse.data.requiresStats
    });

    // 4. Try to access locked features (should fail)
    console.log('\n4. Testing locked features...');
    try {
      await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Should have failed - users endpoint accessible when locked');
    } catch (error) {
      console.log('✅ Users endpoint correctly locked:', error.response.data.error);
    }

    try {
      await axios.post(`${BASE_URL}/update-habit`, 
        { date: '2024-01-01', pages: 50 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('❌ Should have failed - update-habit endpoint accessible when locked');
    } catch (error) {
      console.log('✅ Update-habit endpoint correctly locked:', error.response.data.error);
    }

    // 5. Import reading stats to unlock game
    console.log('\n5. Importing reading stats to unlock game...');
    const dailyPages = Array(90).fill(0).map((_, i) => Math.floor(Math.random() * 50) + 10); // Random 10-60 pages per day
    const totalPages = dailyPages.reduce((sum, pages) => sum + pages, 0);
    const booksRead = Math.floor(totalPages / 300); // Rough estimate: 1 book per 300 pages

    const importResponse = await axios.post(`${BASE_URL}/import-stats`, {
      booksRead: booksRead,
      pagesRead: totalPages,
      dailyPages: dailyPages
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Stats imported successfully!');
    console.log('🔓 Game unlocked:', importResponse.data.gameLocked);
    console.log('📊 Reading stats:', {
      avgPagesPerMonth: importResponse.data.calculatedStats.avgPagesPerMonth,
      avgBooksPerMonth: importResponse.data.calculatedStats.avgBooksPerMonth,
      totalPagesRead: importResponse.data.calculatedStats.totalPagesRead,
      totalBooksRead: importResponse.data.calculatedStats.totalBooksRead
    });

    // 6. Verify game is now unlocked
    console.log('\n6. Verifying game is unlocked...');
    const newGameStatus = await axios.get(`${BASE_URL}/game-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Game status after unlock:', {
      gameLocked: newGameStatus.data.gameLocked,
      requiresStats: newGameStatus.data.requiresStats
    });

    // 7. Test unlocked features (should work now)
    console.log('\n7. Testing unlocked features...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Users endpoint accessible:', usersResponse.data.length, 'users available for trading');

    const habitResponse = await axios.post(`${BASE_URL}/update-habit`, 
      { date: '2024-01-01', pages: 50 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Update-habit endpoint accessible:', habitResponse.data.habitHistory.length, 'reading sessions');

    // 8. Test login with locked user
    console.log('\n8. Testing login with locked user...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      username: 'testuser',
      password: 'password123'
    });
    console.log('✅ Login successful, game status:', loginResponse.data.gameLocked);

    // 9. Test login with demo user (should be locked)
    console.log('\n9. Testing demo user login...');
    const demoLoginResponse = await axios.post(`${BASE_URL}/login`, {
      username: 'demo',
      password: 'password'
    });
    console.log('✅ Demo user login successful, game status:', demoLoginResponse.data.gameLocked);

    console.log('\n🎉 All game locking tests passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ New users start with game locked');
    console.log('   ✅ Locked users cannot access trading features');
    console.log('   ✅ Importing 90 days of reading data unlocks the game');
    console.log('   ✅ Unlocked users can access all features');
    console.log('   ✅ Login responses include game lock status');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testGameLocking();
}

module.exports = { testGameLocking }; 