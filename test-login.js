const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testLoginSystem() {
  try {
    console.log('🧪 Testing Habit Stock Game Login System\n');

    // Test 1: Health check
    console.log('1. Testing health check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(`✅ Health check passed: ${JSON.stringify(health.data)}\n`);

    // Test 2: Register new user
    console.log('2. Registering new user...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, {
      username: 'testuser',
      password: 'password123'
    });
    console.log(`✅ User registered: ${registerResponse.data.user.username}\n`);

    // Test 3: Login with new user
    console.log('3. Logging in with new user...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      username: 'testuser',
      password: 'password123'
    });
    console.log(`✅ Login successful: ${loginResponse.data.user.username}\n`);

    // Test 4: Get user profile with token
    console.log('4. Getting user profile...');
    const token = loginResponse.data.token;
    const profileResponse = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Profile retrieved: $${profileResponse.data.cash} cash\n`);

    // Test 5: Get all users for trading
    console.log('5. Getting all users for trading...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Users loaded: ${usersResponse.data.length} users\n`);

    // Test 6: Update habit
    console.log('6. Updating reading habit...');
    const habitResponse = await axios.post(`${BASE_URL}/update-habit`, {
      date: new Date().toISOString().split('T')[0],
      pages: 15
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Habit updated: ${habitResponse.data.habitHistory.length} entries\n`);

    console.log('🎉 All tests passed! Login system is working correctly.\n');
    console.log('📱 Frontend should be available at: http://localhost:3000');
    console.log('🔧 Backend API at: http://localhost:4000');
    console.log('\n💡 Demo account: username: "demo", password: "password"');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n💡 Make sure both servers are running:');
    console.log('   Backend: npm start (in root directory)');
    console.log('   Frontend: cd frontend && npm start');
  }
}

testLoginSystem(); 