const crypto = require('crypto');
const UserStorage = require('./userStorage');

class PasswordReset {
  constructor() {
    this.userStorage = new UserStorage();
    this.resetTokens = new Map(); // In production, use Redis or database
    this.tokenExpiry = 15 * 60 * 1000; // 15 minutes
  }

  // Generate reset token
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create password reset request
  async createResetRequest(email) {
    try {
      // Find user by email
      const allUsers = await this.userStorage.loadAllUsers();
      const user = allUsers.find(u => u.email === email);
      
      if (!user) {
        return { success: false, message: 'No account found with this email address' };
      }

      // Generate reset token
      const resetToken = this.generateResetToken();
      const expiryTime = Date.now() + this.tokenExpiry;

      // Store reset token
      this.resetTokens.set(resetToken, {
        username: user.username,
        email: user.email,
        expiry: expiryTime
      });

      // In a real application, you would send this via email
      console.log(`🔑 Password reset token for ${email}: ${resetToken}`);
      console.log(`⏰ Token expires at: ${new Date(expiryTime).toLocaleString()}`);

      return {
        success: true,
        message: 'Password reset instructions sent to your email',
        resetToken: resetToken, // In production, don't return this
        expiry: expiryTime
      };
    } catch (error) {
      console.error('Error creating reset request:', error);
      return { success: false, message: 'Failed to create reset request' };
    }
  }

  // Verify reset token
  verifyResetToken(token) {
    const resetData = this.resetTokens.get(token);
    
    if (!resetData) {
      return { valid: false, message: 'Invalid reset token' };
    }

    if (Date.now() > resetData.expiry) {
      this.resetTokens.delete(token);
      return { valid: false, message: 'Reset token has expired' };
    }

    return { valid: true, username: resetData.username, email: resetData.email };
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      const verification = this.verifyResetToken(token);
      
      if (!verification.valid) {
        return { success: false, message: verification.message };
      }

      // Validate new password
      if (!newPassword || newPassword.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters long' };
      }

      // Hash new password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      const success = await this.userStorage.updateUser(verification.username, {
        password: hashedPassword,
        lastPasswordChange: new Date().toISOString()
      });

      if (success) {
        // Remove used token
        this.resetTokens.delete(token);
        
        console.log(`🔐 Password reset successful for ${verification.username}`);
        
        return {
          success: true,
          message: 'Password has been reset successfully'
        };
      } else {
        return { success: false, message: 'Failed to update password' };
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      return { success: false, message: 'Failed to reset password' };
    }
  }

  // Change password (for logged-in users)
  async changePassword(username, currentPassword, newPassword) {
    try {
      const user = await this.userStorage.loadUser(username);
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify current password
      const bcrypt = require('bcryptjs');
      const validCurrentPassword = await bcrypt.compare(currentPassword, user.password);
      
      if (!validCurrentPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Validate new password
      if (!newPassword || newPassword.length < 6) {
        return { success: false, message: 'New password must be at least 6 characters long' };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      const success = await this.userStorage.updateUser(username, {
        password: hashedPassword,
        lastPasswordChange: new Date().toISOString()
      });

      if (success) {
        console.log(`🔐 Password changed successfully for ${username}`);
        return { success: true, message: 'Password changed successfully' };
      } else {
        return { success: false, message: 'Failed to update password' };
      }
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, message: 'Failed to change password' };
    }
  }

  // Clean up expired tokens
  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, data] of this.resetTokens.entries()) {
      if (now > data.expiry) {
        this.resetTokens.delete(token);
      }
    }
  }

  // Get reset token info (for debugging)
  getResetTokenInfo(token) {
    const resetData = this.resetTokens.get(token);
    if (!resetData) {
      return null;
    }
    
    return {
      username: resetData.username,
      email: resetData.email,
      expiry: resetData.expiry,
      expired: Date.now() > resetData.expiry
    };
  }

  // Get all active reset tokens (for admin purposes)
  getAllResetTokens() {
    const tokens = [];
    for (const [token, data] of this.resetTokens.entries()) {
      tokens.push({
        token: token,
        username: data.username,
        email: data.email,
        expiry: data.expiry,
        expired: Date.now() > data.expiry
      });
    }
    return tokens;
  }
}

module.exports = PasswordReset; 