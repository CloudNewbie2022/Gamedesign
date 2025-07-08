import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { DarkModeContext } from '../App';
import './Login.css';

const Login = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const darkMode = useContext(DarkModeContext);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    favoriteGenre: ''
  });

  // Field-specific errors
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    favoriteGenre: ''
  });

  // Load available genres on component mount
  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    setLoadingGenres(true);
    try {
      const response = await axios.get('http://localhost:4000/genres');
      setGenres(response.data);
    } catch (err) {
      console.error('Failed to load genres:', err);
      // Fallback genres if API fails
      setGenres([
        'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
        'Romance', 'Thriller', 'Horror', 'Biography', 'History'
      ]);
    } finally {
      setLoadingGenres(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    const errors = [];
    const newFieldErrors = {
      name: '',
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      favoriteGenre: ''
    };

    if (isRegistering) {
      // Registration validation
      if (!formData.name.trim()) {
        errors.push('Name is required');
        newFieldErrors.name = 'Name is required';
      } else if (formData.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
        newFieldErrors.name = 'Name must be at least 2 characters long';
      } else if (formData.name.length > 50) {
        errors.push('Name must be less than 50 characters');
        newFieldErrors.name = 'Name must be less than 50 characters';
      }

      if (!formData.username.trim()) {
        errors.push('Username is required');
        newFieldErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        errors.push('Username must be at least 3 characters long');
        newFieldErrors.username = 'Username must be at least 3 characters long';
      } else if (formData.username.length > 20) {
        errors.push('Username must be less than 20 characters');
        newFieldErrors.username = 'Username must be less than 20 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        errors.push('Username can only contain letters, numbers, and underscores');
        newFieldErrors.username = 'Username can only contain letters, numbers, and underscores';
      }

      if (!formData.password) {
        errors.push('Password is required');
        newFieldErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
        newFieldErrors.password = 'Password must be at least 6 characters long';
      } else if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/\d/.test(formData.password)) {
        errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
        newFieldErrors.password = 'Password must contain uppercase, lowercase, and number';
      }

      if (!formData.confirmPassword) {
        errors.push('Please confirm your password');
        newFieldErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.push('Passwords do not match');
        newFieldErrors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.email.trim()) {
        errors.push('Email is required');
        newFieldErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.push('Please enter a valid email address');
        newFieldErrors.email = 'Please enter a valid email address';
      }

      if (!formData.favoriteGenre) {
        errors.push('Please select a favorite genre');
        newFieldErrors.favoriteGenre = 'Please select a favorite genre';
      }
    } else {
      // Login validation
      if (!formData.username.trim()) {
        errors.push('Username is required');
        newFieldErrors.username = 'Username is required';
      }
      if (!formData.password) {
        errors.push('Password is required');
        newFieldErrors.password = 'Password is required';
      }
    }

    setFieldErrors(newFieldErrors);
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate form
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        setLoading(false);
        return;
      }

      const endpoint = isRegistering ? '/register' : '/login';
      const requestData = isRegistering ? {
        name: formData.name.trim(),
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim().toLowerCase(),
        favoriteGenre: formData.favoriteGenre
      } : {
        username: formData.username.trim(),
        password: formData.password
      };

      const response = await axios.post(`http://localhost:4000${endpoint}`, requestData);

      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Set default authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

      if (isRegistering) {
        setSuccess('Account created successfully! Please provide reading statistics to unlock the game.');
        // Clear form after successful registration
        setFormData({
          name: '',
          username: '',
          password: '',
          confirmPassword: '',
          email: '',
          favoriteGenre: ''
        });
        setFieldErrors({
          name: '',
          username: '',
          password: '',
          confirmPassword: '',
          email: '',
          favoriteGenre: ''
        });
        // Switch to login mode
        setTimeout(() => {
          setIsRegistering(false);
          setSuccess('');
        }, 3000);
      } else {
        // Login successful
        onLogin(response.data.user);
      }

    } catch (err) {
      console.error('Auth error:', err);
      
      if (err.response?.data?.errors) {
        // Handle validation errors from server
        const serverErrors = err.response.data.errors;
        setError(serverErrors.join(', '));
        
        // Map server errors to field errors
        const newFieldErrors = { ...fieldErrors };
        serverErrors.forEach(errorMsg => {
          if (errorMsg.includes('Name')) newFieldErrors.name = errorMsg;
          else if (errorMsg.includes('Username')) newFieldErrors.username = errorMsg;
          else if (errorMsg.includes('Password')) newFieldErrors.password = errorMsg;
          else if (errorMsg.includes('Email')) newFieldErrors.email = errorMsg;
          else if (errorMsg.includes('genre')) newFieldErrors.favoriteGenre = errorMsg;
        });
        setFieldErrors(newFieldErrors);
      } else if (err.response?.data?.error) {
        // Handle single error from server
        setError(err.response.data.error);
      } else if (err.code === 'ECONNREFUSED') {
        setError('Unable to connect to server. Please check if the server is running.');
      } else if (err.message === 'Network Error') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setSuccess('');
    setFieldErrors({
      name: '',
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      favoriteGenre: ''
    });
    // Clear form when switching modes
    setFormData({
      name: '',
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      favoriteGenre: ''
    });
  };

  const getFieldClassName = (fieldName) => {
    return `form-group ${fieldErrors[fieldName] ? 'error' : ''}`;
  };

  const getLabelClassName = (fieldName) => {
    return fieldErrors[fieldName] ? 'label-error' : '';
  };

  return (
    <div className={`login-container ${darkMode ? 'dark' : ''}`}>
      <div className={`login-card ${darkMode ? 'dark' : ''}`}>
        <div className="login-header">
          <h1>Rally Reader</h1>
          <p>Stock Market Reading Game</p>
          <p className="subtitle">Trade shares based on reading habits</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegistering && (
            <div className={getFieldClassName('name')}>
              <label htmlFor="name" className={getLabelClassName('name')}>
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="Enter your full name"
                minLength="2"
                maxLength="50"
              />
              {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}
            </div>
          )}

          <div className={getFieldClassName('username')}>
            <label htmlFor="username" className={getLabelClassName('username')}>
              Username <span className="required">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Enter your username"
              minLength="3"
              maxLength="20"
              pattern="[a-zA-Z0-9_]+"
              title="Username can only contain letters, numbers, and underscores"
            />
            {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}
          </div>

          <div className={getFieldClassName('password')}>
            <label htmlFor="password" className={getLabelClassName('password')}>
              Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Enter your password"
              minLength="6"
            />
            {isRegistering && (
              <small className="password-hint">
                Password must be at least 6 characters with uppercase, lowercase, and numbers
              </small>
            )}
            {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
          </div>

          {isRegistering && (
            <div className={getFieldClassName('confirmPassword')}>
              <label htmlFor="confirmPassword" className={getLabelClassName('confirmPassword')}>
                Confirm Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="Confirm your password"
                minLength="6"
              />
              {fieldErrors.confirmPassword && <div className="field-error">{fieldErrors.confirmPassword}</div>}
            </div>
          )}

          {isRegistering && (
            <div className={getFieldClassName('email')}>
              <label htmlFor="email" className={getLabelClassName('email')}>
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="Enter your email address"
              />
              {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
            </div>
          )}

          {isRegistering && (
            <div className={getFieldClassName('favoriteGenre')}>
              <label htmlFor="favoriteGenre" className={getLabelClassName('favoriteGenre')}>
                Favorite Genre <span className="required">*</span>
              </label>
              <select
                id="favoriteGenre"
                name="favoriteGenre"
                value={formData.favoriteGenre}
                onChange={handleInputChange}
                required
                disabled={loading || loadingGenres}
                className="genre-select"
              >
                <option value="">Select your favorite genre</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
              {loadingGenres && <small>Loading genres...</small>}
              {fieldErrors.favoriteGenre && <div className="field-error">{fieldErrors.favoriteGenre}</div>}
            </div>
          )}

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <strong>Success:</strong> {success}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button" 
            disabled={loading || (isRegistering && loadingGenres)}
          >
            {loading ? (
              <span>
                <span className="spinner"></span>
                {isRegistering ? 'Creating Account...' : 'Logging In...'}
              </span>
            ) : (
              isRegistering ? 'Create Account' : 'Login'
            )}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            className="toggle-button"
            onClick={handleToggleMode}
            disabled={loading}
          >
            {isRegistering 
              ? 'Already have an account? Login' 
              : "Don't have an account? Register"
            }
          </button>
        </div>

        {!isRegistering && (
          <div className="demo-info">
            <p>💡 Demo account: username: "demo", password: "password"</p>
          </div>
        )}

        {isRegistering && (
          <div className="registration-info">
            <h4>📋 Registration Requirements:</h4>
            <ul>
              <li>Username: 3-20 characters (letters, numbers, underscores only)</li>
              <li>Password: At least 6 characters with uppercase, lowercase, and numbers</li>
              <li>Email: Valid email format</li>
              <li>All fields are required</li>
            </ul>
            <p>🔒 Your data is encrypted and stored securely</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login; 