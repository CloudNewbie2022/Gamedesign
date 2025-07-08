# User Management System

This directory contains the secure user management system for Rally Reader.

## 🔐 Security Features

### Encrypted Storage
- All user data is encrypted using AES-256-CBC
- Each user has their own encrypted file
- Encryption key is configurable via environment variable

### Password Security
- Passwords are hashed using bcrypt (salt rounds: 10)
- Password reset functionality with secure tokens
- Password strength validation

### Input Validation
- Comprehensive validation for all user inputs
- Email format validation
- Username format validation (3-20 characters, alphanumeric + underscore)
- Password strength requirements

## 📁 File Structure

```
userManager/
├── userStorage.js      # Encrypted file storage system
├── userValidation.js   # Input validation and user object creation
├── passwordReset.js    # Password reset functionality
├── users/             # Encrypted user files (created automatically)
└── README.md          # This file
```

## 🔧 Usage

### User Registration
```javascript
const UserValidation = require('./userManager/userValidation');
const UserStorage = require('./userManager/userStorage');

const validation = new UserValidation();
const storage = new UserStorage();

// Validate registration data
const result = await validation.validateRegistration({
  name: 'John Doe',
  username: 'johndoe',
  password: 'Password123',
  email: 'john@example.com',
  favoriteGenre: 'Science Fiction'
});

if (result.valid) {
  // Create user object
  const user = validation.createUserObject({
    name: 'John Doe',
    username: 'johndoe',
    password: hashedPassword,
    email: 'john@example.com',
    favoriteGenre: 'Science Fiction'
  });
  
  // Save to encrypted storage
  await storage.saveUser(user);
}
```

### User Login
```javascript
const user = await storage.loadUser(username);
if (user && await bcrypt.compare(password, user.password)) {
  // Login successful
}
```

### Password Reset
```javascript
const PasswordReset = require('./userManager/passwordReset');
const reset = new PasswordReset();

// Request reset
const result = await reset.createResetRequest(email);

// Reset password
const success = await reset.resetPassword(token, newPassword);
```

## 📊 User Data Structure

```javascript
{
  id: "uuid",
  name: "John Doe",
  username: "johndoe",
  email: "john@example.com",
  password: "hashed_password",
  favoriteGenre: "Science Fiction",
  createdAt: "2024-01-01T00:00:00.000Z",
  lastLogin: "2024-01-01T12:00:00.000Z",
  lastPasswordChange: "2024-01-01T00:00:00.000Z",
  
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
  bio: "",
  avatar: "📚",
  preferences: {
    notifications: true,
    publicProfile: true,
    showReadingStats: true
  }
}
```

## 🔒 Security Best Practices

1. **Environment Variables**: Always use environment variables for secrets
2. **Encryption Key**: Use a strong, unique encryption key
3. **Password Policy**: Enforce strong password requirements
4. **Token Expiry**: Reset tokens expire after 15 minutes
5. **Input Sanitization**: All user inputs are validated and sanitized
6. **File Permissions**: Ensure user files have appropriate permissions

## 🚀 Configuration

Set these environment variables:

```bash
# Required
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_KEY=your-encryption-key

# Optional
PORT=4000
NODE_ENV=development
```

## 🧪 Testing

Run the user management tests:

```bash
node test-user-management.js
```

This will test:
- User registration with validation
- Login functionality
- Password reset
- Profile management
- Input validation
- Security features

## 📈 Backup and Recovery

### Create Backup
```javascript
const backupPath = await storage.backupUsers();
console.log('Backup created:', backupPath);
```

### Restore from Backup
```javascript
const restoredCount = await storage.restoreUsers(backupPath);
console.log('Restored users:', restoredCount);
```

## 🔍 Monitoring

### User Statistics
```javascript
const stats = await storage.getUserStats();
console.log('User statistics:', stats);
```

### Search Users
```javascript
const users = await storage.searchUsers({
  favoriteGenre: 'Science Fiction'
});
```

## 🚨 Error Handling

All functions include comprehensive error handling:

- File system errors
- Encryption/decryption errors
- Validation errors
- Authentication errors

## 🔄 Maintenance

### Cleanup Expired Tokens
```javascript
// Automatically runs every 5 minutes
passwordReset.cleanupExpiredTokens();
```

### Validate User Files
```javascript
const allUsers = await storage.loadAllUsers();
console.log('Total users:', allUsers.length);
```

## 📝 Notes

- User files are stored in `userManager/users/` directory
- Each user has their own encrypted JSON file
- Files are named using the username (sanitized)
- Backup files are created with timestamps
- All sensitive data is encrypted before storage 