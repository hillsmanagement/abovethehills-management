const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const auth = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No authentication token, access denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Ensure _id exists in decoded token
    if (!decoded._id) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format: missing user ID' 
      });
    }

    // Add user data to request
    req.user = {
      ...decoded,
      _id: decoded._id
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired' 
      });
    }
    res.status(401).json({ 
      success: false,
      message: 'Authentication failed', 
      error: error.message 
    });
  }
};

// Middleware for role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have permission to perform this action' 
      });
    }
    next();
  };
};

module.exports = { auth, authorize }; 