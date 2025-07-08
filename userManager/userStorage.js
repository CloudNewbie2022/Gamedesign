const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class UserStorage {
  constructor() {
    this.usersDir = path.join(__dirname, 'users');
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'your-encryption-key-change-in-production';
    this.algorithm = 'aes-256-cbc';
  }

  // Initialize storage directory
  async initialize() {
    try {
      await fs.mkdir(this.usersDir, { recursive: true });
      console.log('📁 User storage directory initialized');
    } catch (error) {
      console.error('Error initializing user storage:', error);
    }
  }

  // Encrypt data
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt data
  decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Get user file path
  getUserFilePath(username) {
    const safeUsername = username.replace(/[^a-zA-Z0-9]/g, '_');
    return path.join(this.usersDir, `${safeUsername}.json`);
  }

  // Save user to encrypted file
  async saveUser(user) {
    try {
      const userData = JSON.stringify(user);
      const encryptedData = this.encrypt(userData);
      const filePath = this.getUserFilePath(user.username);
      
      await fs.writeFile(filePath, encryptedData);
      console.log(`💾 User ${user.username} saved to encrypted storage`);
      return true;
    } catch (error) {
      console.error('Error saving user:', error);
      return false;
    }
  }

  // Load user from encrypted file
  async loadUser(username) {
    try {
      const filePath = this.getUserFilePath(username);
      const encryptedData = await fs.readFile(filePath, 'utf8');
      const decryptedData = this.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // User file doesn't exist
      }
      console.error('Error loading user:', error);
      return null;
    }
  }

  // Load all users (for admin purposes)
  async loadAllUsers() {
    try {
      const files = await fs.readdir(this.usersDir);
      const users = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const username = file.replace('.json', '').replace(/_/g, '');
          const user = await this.loadUser(username);
          if (user) {
            users.push(user);
          }
        }
      }
      
      return users;
    } catch (error) {
      console.error('Error loading all users:', error);
      return [];
    }
  }

  // Check if user exists
  async userExists(username) {
    const user = await this.loadUser(username);
    return user !== null;
  }

  // Update user
  async updateUser(username, updates) {
    try {
      const user = await this.loadUser(username);
      if (!user) {
        return false;
      }
      
      const updatedUser = { ...user, ...updates };
      return await this.saveUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  // Delete user
  async deleteUser(username) {
    try {
      const filePath = this.getUserFilePath(username);
      await fs.unlink(filePath);
      console.log(`🗑️ User ${username} deleted from storage`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Search users by criteria
  async searchUsers(criteria) {
    try {
      const allUsers = await this.loadAllUsers();
      return allUsers.filter(user => {
        for (const [key, value] of Object.entries(criteria)) {
          if (user[key] && user[key].toLowerCase().includes(value.toLowerCase())) {
            return true;
          }
        }
        return false;
      });
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const allUsers = await this.loadAllUsers();
      const stats = {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(u => !u.gameLocked).length,
        lockedUsers: allUsers.filter(u => u.gameLocked).length,
        usersByGenre: {},
        averagePagesPerMonth: 0,
        totalPagesRead: 0
      };

      // Calculate genre distribution
      allUsers.forEach(user => {
        if (user.favoriteGenre) {
          stats.usersByGenre[user.favoriteGenre] = (stats.usersByGenre[user.favoriteGenre] || 0) + 1;
        }
      });

      // Calculate reading statistics
      const unlockedUsers = allUsers.filter(u => !u.gameLocked);
      if (unlockedUsers.length > 0) {
        stats.averagePagesPerMonth = unlockedUsers.reduce((sum, u) => sum + (u.avgPagesPerMonth || 0), 0) / unlockedUsers.length;
        stats.totalPagesRead = unlockedUsers.reduce((sum, u) => sum + (u.totalPagesRead || 0), 0);
      }

      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  // Backup all users
  async backupUsers() {
    try {
      const allUsers = await this.loadAllUsers();
      const backupData = {
        timestamp: new Date().toISOString(),
        userCount: allUsers.length,
        users: allUsers
      };
      
      const backupPath = path.join(this.usersDir, `backup_${Date.now()}.json`);
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
      console.log(`💾 User backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error('Error creating backup:', error);
      return null;
    }
  }

  // Restore users from backup
  async restoreUsers(backupPath) {
    try {
      const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
      let restoredCount = 0;
      
      for (const user of backupData.users) {
        if (await this.saveUser(user)) {
          restoredCount++;
        }
      }
      
      console.log(`🔄 Restored ${restoredCount} users from backup`);
      return restoredCount;
    } catch (error) {
      console.error('Error restoring users:', error);
      return 0;
    }
  }
}

module.exports = UserStorage; 