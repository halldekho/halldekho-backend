const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT Authentication Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    console.error('Missing token in request');
    return res.status(401).json({ msg: 'Authentication token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded); // Debugging purpose
    req.user = decoded; // Attach user data to the request object
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ msg: 'Invalid or expired token' });
  }
};

// Role-Based Access Middleware
const roleMiddleware = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ msg: 'User not authenticated' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
