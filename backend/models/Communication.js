const mongoose = require('mongoose');

const communicationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['email', 'sms', 'whatsapp', 'announcement']
  },
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  }],
  recipientGroups: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'failed'],
    default: 'draft'
  },
  scheduledDate: Date,
  sentDate: Date,
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String
  }],
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    deliveryStatus: [{
      recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
      },
      status: String,
      timestamp: Date
    }]
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
communicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Communication', communicationSchema); 