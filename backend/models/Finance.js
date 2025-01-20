const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  offeringAmount: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  titheAmount: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  seedAmount: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  seedOfFaithAmount: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'check', 'bank_transfer', 'online'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  recordedBy: {
    type: String,
    default: 'admin'
  },
  pastorEmail: {
    type: String,
    default: 'vamobi29@gmail.com'
  },
  sentToPastor: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
financeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Finance', financeSchema); 