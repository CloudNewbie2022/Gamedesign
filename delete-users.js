const fs = require('fs').promises;
const path = require('path');

async function deleteAllUsers() {
  try {
    const usersDir = path.join(__dirname, 'userManager', 'users');
    
    // Check if users directory exists
    try {
      await fs.access(usersDir);
    } catch (error) {
      console.log('✅ No users directory found - no accounts to delete');
      return;
    }
    
    // Get all user files
    const files = await fs.readdir(usersDir);
    const userFiles = files.filter(file => file.endsWith('.json'));
    
    if (userFiles.length === 0) {
      console.log('✅ No user accounts found to delete');
      return;
    }
    
    console.log(`🗑️ Found ${userFiles.length} user account(s) to delete:`);
    
    // Delete each user file
    for (const file of userFiles) {
      const filePath = path.join(usersDir, file);
      await fs.unlink(filePath);
      const username = file.replace('.json', '').replace(/_/g, '');
      console.log(`   ❌ Deleted account: ${username}`);
    }
    
    console.log(`\n✅ Successfully deleted ${userFiles.length} user account(s)`);
    console.log('🔄 You can now register new accounts with the fixed password storage');
    
  } catch (error) {
    console.error('❌ Error deleting users:', error);
  }
}

deleteAllUsers(); 