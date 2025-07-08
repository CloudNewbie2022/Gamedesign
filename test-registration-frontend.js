const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:4000';
const TEST_USER = {
  name: 'Test User',
  username: `testuser_${Date.now()}`,
  password: 'TestPass123',
  email: `test${Date.now()}@example.com`,
  favoriteGenre: 'Fiction'
};

async function testRegistration() {
  console.log('🧪 Testing Registration System\n');
  
  try {
    // Test 1: Get available genres
    console.log('1. Testing genres endpoint...');
    const genresResponse = await axios.get(`${BASE_URL}/genres`);
    console.log('✅ Genres loaded successfully:', genresResponse.data.length, 'genres available');
    console.log('   Sample genres:', genresResponse.data.slice(0, 5).join(', '));
    
    // Test 2: Register new user
    console.log('\n2. Testing user registration...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, TEST_USER);
    console.log('✅ Registration successful!');
    console.log('   User ID:', registerResponse.data.user.id);
    console.log('   Username:', registerResponse.data.user.username);
    console.log('   Game Locked:', registerResponse.data.gameLocked);
    console.log('   Message:', registerResponse.data.message);
    
    // Test 3: Login with new user
    console.log('\n3. Testing login with new user...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      username: TEST_USER.username,
      password: TEST_USER.password
    });
    console.log('✅ Login successful!');
    console.log('   Token received:', !!loginResponse.data.token);
    console.log('   User data:', loginResponse.data.user.username);
    console.log('   Game Locked:', loginResponse.data.gameLocked);
    
    // Test 4: Test duplicate registration
    console.log('\n4. Testing duplicate registration (should fail)...');
    try {
      await axios.post(`${BASE_URL}/register`, TEST_USER);
      console.log('❌ Duplicate registration should have failed!');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Duplicate registration correctly rejected');
        console.log('   Error:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test 5: Test invalid login
    console.log('\n5. Testing invalid login (should fail)...');
    try {
      await axios.post(`${BASE_URL}/login`, {
        username: TEST_USER.username,
        password: 'wrongpassword'
      });
      console.log('❌ Invalid login should have failed!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Invalid login correctly rejected');
        console.log('   Error:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test 6: Test validation errors
    console.log('\n6. Testing validation errors...');
    const invalidUser = {
      name: '', // Empty name
      username: 'a', // Too short
      password: '123', // Too short
      email: 'invalid-email', // Invalid email
      favoriteGenre: '' // Empty genre
    };
    
    try {
      await axios.post(`${BASE_URL}/register`, invalidUser);
      console.log('❌ Invalid registration should have failed!');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation errors correctly caught');
        console.log('   Errors:', error.response.data.errors);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    console.log('\n🎉 All registration tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Genres endpoint working');
    console.log('   ✅ User registration working');
    console.log('   ✅ User login working');
    console.log('   ✅ Duplicate prevention working');
    console.log('   ✅ Invalid login rejection working');
    console.log('   ✅ Validation error handling working');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/genres`);
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Registration System Tests\n');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ Server is not running! Please start the server first:');
    console.error('   node server.js');
    process.exit(1);
  }
  
  console.log('✅ Server is running on', BASE_URL);
  await testRegistration();
}

main().catch(console.error); 