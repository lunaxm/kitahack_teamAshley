import { useState } from 'react';
import Dashboard from './Dashboard';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    verificationCode: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.userId.trim()) {
      newErrors.userId = 'User ID is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (!formData.verificationCode) {
      newErrors.verificationCode = 'Verification code is required';
    } else if (formData.verificationCode.length !== 6 || !/^\d+$/.test(formData.verificationCode)) {
      newErrors.verificationCode = 'Please enter a valid 6-digit code';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Here you would typically send the data to your backend API
    console.log('Login attempt:', {
      userId: formData.userId,
      password: '***hidden***',
      verificationCode: formData.verificationCode
    });

    // Example API call (uncomment and modify as needed):
    /*
    fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Success:', data);
        // Handle successful login (e.g., redirect to dashboard)
        setUserName(data.name || formData.userId);
        setIsLoggedIn(true);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
    */

    // For demo purposes, immediately login after validation
    setUserName(formData.userId);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    setFormData({
      userId: '',
      password: '',
      verificationCode: ''
    });
    setErrors({});
  };

  // If logged in, show the Dashboard
  if (isLoggedIn) {
    return (
      <Dashboard 
        userName={userName}
        userRole="Doctor" // You can dynamically set this based on login
        onLogout={handleLogout}
      />
    );
  }

  // Otherwise, show the Login Page
  return (
    <div className="app">
      <div className="login-container">
        {/* Left side - Medical themed image */}
        <div className="login-image">
          <div className="medical-icon">⚕️</div>
          <h1>Medical Health</h1>
          <p>Secure healthcare management platform</p>
        </div>

        {/* Right side - Login form */}
        <div className="login-form">
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Please login to access your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="userId">User ID</label>
              <input
                type="text"
                id="userId"
                name="userId"
                placeholder="Enter your user ID"
                value={formData.userId}
                onChange={handleChange}
                className={errors.userId ? 'error' : ''}
              />
              {errors.userId && <span className="error-message">{errors.userId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="verificationCode">Two-Step Verification Code</label>
              <input
                type="text"
                id="verificationCode"
                name="verificationCode"
                placeholder="Enter 6-digit code"
                maxLength="6"
                value={formData.verificationCode}
                onChange={handleChange}
                className={errors.verificationCode ? 'error' : ''}
              />
              <div className="verification-note">
                Enter the code from your authenticator app
              </div>
              {errors.verificationCode && <span className="error-message">{errors.verificationCode}</span>}
            </div>

            <button type="submit" className="login-button">
              Login
            </button>

            <div className="footer-links">
              <a href="#forgot">Forgot Password?</a>
              <span style={{ color: '#ccc' }}>|</span>
              <a href="#help">Need Help?</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;