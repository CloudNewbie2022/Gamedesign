const UserStorage = require('./userStorage');

class UserValidation {
  constructor() {
    this.userStorage = new UserStorage();
    this.validGenres = [
      'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
      'Romance', 'Thriller', 'Horror', 'Biography', 'History', 'Science',
      'Technology', 'Philosophy', 'Psychology', 'Self-Help', 'Business',
      'Cooking', 'Travel', 'Poetry', 'Drama', 'Comics', 'Children',
      'Young Adult', 'Classic', 'Contemporary', 'Literary Fiction'
    ];
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate username format
  validateUsername(username) {
    if (!username || username.length < 3 || username.length > 20) {
      return { valid: false, message: 'Username must be 3-20 characters long' };
    }
    
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
    }
    
    return { valid: true };
  }

  // Validate password strength
  validatePassword(password) {
    if (!password || password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    
    if (password.length > 128) {
      return { valid: false, message: 'Password must be less than 128 characters' };
    }
    
    // Optional: Add more password strength requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return { 
        valid: false, 
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
      };
    }
    
    return { valid: true };
  }

  // Validate name
  validateName(name) {
    if (!name || name.trim().length < 2) {
      return { valid: false, message: 'Name must be at least 2 characters long' };
    }
    
    if (name.length > 50) {
      return { valid: false, message: 'Name must be less than 50 characters' };
    }
    
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name)) {
      return { valid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }
    
    return { valid: true };
  }

  // Validate favorite genre
  validateFavoriteGenre(genre) {
    if (!genre) {
      return { valid: false, message: 'Please select a favorite genre' };
    }
    
    if (!this.validGenres.includes(genre)) {
      return { valid: false, message: 'Please select a valid genre from the list' };
    }
    
    return { valid: true };
  }

  // Get valid genres list
  getValidGenres() {
    return this.validGenres;
  }

  // Validate complete registration data
  async validateRegistration(data) {
    const errors = [];
    const warnings = [];

    // Required fields
    const requiredFields = ['name', 'username', 'password', 'email', 'favoriteGenre'];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    // Validate individual fields
    const nameValidation = this.validateName(data.name);
    if (!nameValidation.valid) {
      errors.push(nameValidation.message);
    }

    const usernameValidation = this.validateUsername(data.username);
    if (!usernameValidation.valid) {
      errors.push(usernameValidation.message);
    }

    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.push(passwordValidation.message);
    }

    const emailValidation = this.validateEmail(data.email);
    if (!emailValidation) {
      errors.push('Please enter a valid email address');
    }

    const genreValidation = this.validateFavoriteGenre(data.favoriteGenre);
    if (!genreValidation.valid) {
      errors.push(genreValidation.message);
    }

    // Check for existing users
    if (usernameValidation.valid) {
      const userExists = await this.userStorage.userExists(data.username);
      if (userExists) {
        errors.push('Username already exists');
      }
    }

    // Check for existing email (removed - allowing multiple accounts per email)
    // if (emailValidation) {
    //   const allUsers = await this.userStorage.loadAllUsers();
    //   const emailExists = allUsers.some(user => user.email === data.email);
    //   if (emailExists) {
    //     errors.push('Email address already registered');
    //   }
    // }

    // Warnings (non-blocking)
    if (data.password && data.password.length < 8) {
      warnings.push('Consider using a longer password for better security');
    }

    if (data.username && data.username.length < 5) {
      warnings.push('Consider using a longer username for better uniqueness');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate profile update data
  async validateProfileUpdate(username, data) {
    const errors = [];
    const warnings = [];

    // Validate name if provided
    if (data.name !== undefined) {
      const nameValidation = this.validateName(data.name);
      if (!nameValidation.valid) {
        errors.push(nameValidation.message);
      }
    }

    // Validate email if provided
    if (data.email !== undefined) {
      const emailValidation = this.validateEmail(data.email);
      if (!emailValidation) {
        errors.push('Please enter a valid email address');
      } else {
        // Check if email is already used by another user
        const allUsers = await this.userStorage.loadAllUsers();
        const emailExists = allUsers.some(user => 
          user.email === data.email && user.username !== username
        );
        if (emailExists) {
          errors.push('Email address already registered by another user');
        }
      }
    }

    // Validate favorite genre if provided
    if (data.favoriteGenre !== undefined) {
      const genreValidation = this.validateFavoriteGenre(data.favoriteGenre);
      if (!genreValidation.valid) {
        errors.push(genreValidation.message);
      }
    }

    // Validate username if provided (rare case)
    if (data.username !== undefined && data.username !== username) {
      const usernameValidation = this.validateUsername(data.username);
      if (!usernameValidation.valid) {
        errors.push(usernameValidation.message);
      } else {
        const userExists = await this.userStorage.userExists(data.username);
        if (userExists) {
          errors.push('Username already exists');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Sanitize user data (remove sensitive fields)
  sanitizeUserData(user) {
    const { password, resetToken, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  // Create user object from registration data
  createUserObject(data) {
    return {
      id: require('uuid').v4(),
      name: data.name.trim(),
      username: data.username.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      favoriteGenre: data.favoriteGenre,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      lastPasswordChange: null,
      // Game-related fields
      gameLocked: true,
      readingStats: null,
      avgPagesPerMonth: 0,
      avgBooksPerMonth: 0,
      totalPagesRead: 0,
      totalBooksRead: 0,
      lastStatsUpdate: null,
      // Game data
      habitHistory: [],
      shares: [],
      cash: 1000,
      // Profile fields
      bio: '',
      avatar: '📚', // Default avatar
      preferences: {
        notifications: true,
        publicProfile: true,
        showReadingStats: true
      }
    };
  }

  // Validate password change
  validatePasswordChange(currentPassword, newPassword, confirmPassword) {
    const errors = [];

    if (!currentPassword) {
      errors.push('Current password is required');
    }

    if (!newPassword) {
      errors.push('New password is required');
    }

    if (!confirmPassword) {
      errors.push('Please confirm your new password');
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.push('New passwords do not match');
    }

    if (newPassword) {
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        errors.push(passwordValidation.message);
      }
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.push('New password must be different from current password');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = UserValidation; 