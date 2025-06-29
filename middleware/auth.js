const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Make sure path is correct
require('dotenv').config();

// 🔐 JWT Authentication Middleware
const authMiddleware = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    console.error('Missing token in request');
    return res.status(401).json({ msg: 'Authentication token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded); // Optional debug log

    // ✅ Fetch full user from the database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    req.user = user; // ✅ Attach full user to request object
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ msg: 'Invalid or expired token' });
  }
};

// 🔒 Role-Based Access Middleware
const roleMiddleware = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ msg: 'User not authenticated' });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ msg: `Access denied for ${req.user.role}` });
    }

    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
