const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: ['https://abovethehills-management.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'Abovethehills Church Management System API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      members: '/api/members',
      announcements: '/api/announcements',
      finance: '/api/finance',
      attendance: '/api/attendance'
    }
  });
});

// Test route
app.get('/api', (req, res) => {
  res.json({
    message: 'API is working',
    environment: process.env.NODE_ENV
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/attendance', require('./routes/attendance'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    requested_url: req.originalUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: err.message,
    path: req.path
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
}); 