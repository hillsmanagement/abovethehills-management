const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Login route - password only authentication
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    // Check if password matches the predefined password
    const correctPassword = process.env.ADMIN_PASSWORD || 'abovethehill2024';
    
    if (password !== correctPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid password' 
      });
    }

    // Create token with a fixed admin ID
    const token = jwt.sign(
      { 
        _id: '000000000000000000000001',
        role: 'admin' 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: '000000000000000000000001',
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error logging in', 
      error: error.message 
    });
  }
});

module.exports = router; 