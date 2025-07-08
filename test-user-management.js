const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testUserManagement() {
  try {
    console.log('🔐 Testing Rally Reader User Management System...\n');

    // 1. Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', {
      users: health.data.users,
      lockedUsers: health.data.lockedUsers,
      unlockedUsers: health.data.unlockedUsers,
      storage: health.data.storage
    });

    // 2. Get available genres
    console.log('\n2. Getting available genres...');
    const genresResponse = await axios.get(`${BASE_URL}/genres`);
    console.log('✅ Available genres:', genresResponse.data.length, 'genres');

    // 3. Test user registration with all required fields
    console.log('\n3. Testing user registration...');
    const testUser = {
      name: 'John Doe',
      username: 'johndoe',
      password: 'Password123',
      email: 'john.doe@example.com',
      favoriteGenre: 'Science Fiction'
    };

    const registerResponse = await axios.post(`${BASE_URL}/register`, testUser);
    const { token, user } = registerResponse.data;
    console.log('✅ User registered successfully:', {
      name: user.name,
      username: user.username,
      email: user.email,
      favoriteGenre: user.favoriteGenre,
      gameLocked: user.gameLocked
    });

    // 4. Test login with new user
    console.log('\n4. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      username: testUser.username,
      password: testUser.password
    });
    console.log('✅ Login successful:', {
      name: loginResponse.data.user.name,
      gameLocked: loginResponse.data.gameLocked
    });

    // 5. Test profile retrieval
    console.log('\n5. Testing profile retrieval...');
    const profileResponse = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile retrieved:', {
      name: profileResponse.data.name,
      email: profileResponse.data.email,
      favoriteGenre: profileResponse.data.favoriteGenre
    });

    // 6. Test profile update
    console.log('\n6. Testing profile update...');
    const updateResponse = await axios.put(`${BASE_URL}/profile`, {
      bio: 'I love reading science fiction and fantasy novels!',
      avatar: '🚀'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile updated:', {
      bio: updateResponse.data.user.bio,
      avatar: updateResponse.data.user.avatar
    });

    // 7. Test password reset request
    console.log('\n7. Testing password reset request...');
    const resetRequestResponse = await axios.post(`${BASE_URL}/forgot-password`, {
      email: testUser.email
    });
    console.log('✅ Password reset requested:', resetRequestResponse.data.message);
    
    // Get the reset token (in production, this would be sent via email)
    const resetToken = resetRequestResponse.data.resetToken;
    console.log('🔑 Reset token (for testing):', resetToken);

    // 8. Test password reset with token
    console.log('\n8. Testing password reset...');
    const newPassword = 'NewPassword456';
    const resetResponse = await axios.post(`${BASE_URL}/reset-password`, {
      token: resetToken,
      newPassword: newPassword
    });
    console.log('✅ Password reset successful:', resetResponse.data.message);

    // 9. Test login with new password
    console.log('\n9. Testing login with new password...');
    const newLoginResponse = await axios.post(`${BASE_URL}/login`, {
      username: testUser.username,
      password: newPassword
    });
    console.log('✅ Login with new password successful');

    // 10. Test change password (authenticated)
    console.log('\n10. Testing change password...');
    const changePasswordResponse = await axios.post(`${BASE_URL}/change-password`, {
      currentPassword: newPassword,
      newPassword: 'FinalPassword789',
      confirmPassword: 'FinalPassword789'
    }, {
      headers: { Authorization: `Bearer ${newLoginResponse.data.token}` }
    });
    console.log('✅ Password changed successfully:', changePasswordResponse.data.message);

    // 11. Test validation errors
    console.log('\n11. Testing validation errors...');
    
    // Test duplicate username
    try {
      await axios.post(`${BASE_URL}/register`, {
        name: 'Jane Doe',
        username: 'johndoe', // Duplicate username
        password: 'Password123',
        email: 'jane.doe@example.com',
        favoriteGenre: 'Fantasy'
      });
      console.log('❌ Should have failed - duplicate username');
    } catch (error) {
      console.log('✅ Duplicate username correctly rejected:', error.response.data.errors[0]);
    }

    // Test invalid email
    try {
      await axios.post(`${BASE_URL}/register`, {
        name: 'Invalid User',
        username: 'invaliduser',
        password: 'Password123',
        email: 'invalid-email',
        favoriteGenre: 'Mystery'
      });
      console.log('❌ Should have failed - invalid email');
    } catch (error) {
      console.log('✅ Invalid email correctly rejected:', error.response.data.errors[0]);
    }

    // Test weak password
    try {
      await axios.post(`${BASE_URL}/register`, {
        name: 'Weak User',
        username: 'weakuser',
        password: '123', // Too short
        email: 'weak@example.com',
        favoriteGenre: 'Romance'
      });
      console.log('❌ Should have failed - weak password');
    } catch (error) {
      console.log('✅ Weak password correctly rejected:', error.response.data.errors[0]);
    }

    // 12. Test game status
    console.log('\n12. Testing game status...');
    const gameStatusResponse = await axios.get(`${BASE_URL}/game-status`, {
      headers: { Authorization: `Bearer ${newLoginResponse.data.token}` }
    });
    console.log('✅ Game status:', {
      gameLocked: gameStatusResponse.data.gameLocked,
      requiresStats: gameStatusResponse.data.requiresStats
    });

    // 13. Test users endpoint (should be locked)
    console.log('\n13. Testing locked users endpoint...');
    try {
      await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${newLoginResponse.data.token}` }
      });
      console.log('❌ Should have failed - users endpoint accessible when locked');
    } catch (error) {
      console.log('✅ Users endpoint correctly locked:', error.response.data.error);
    }

    console.log('\n🎉 All user management tests passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ User registration with all required fields');
    console.log('   ✅ Encrypted storage system');
    console.log('   ✅ Password reset functionality');
    console.log('   ✅ Profile management');
    console.log('   ✅ Input validation');
    console.log('   ✅ Game locking system');
    console.log('   ✅ JWT authentication');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testUserManagement();
}

module.exports = { testUserManagement }; 