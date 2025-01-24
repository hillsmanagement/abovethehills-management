const mongoose = require('mongoose');

// Remove any existing indexes before defining the schema
mongoose.connection.on('connected', () => {
  mongoose.connection.db.collection('members').dropIndexes()
    .then(() => console.log('Dropped all indexes from members collection'))
    .catch(err => console.log('Error dropping indexes:', err));
});

const memberSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        return /^\+?[1-9]\d{1,14}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || (v instanceof Date && !isNaN(v));
      },
      message: props => 'Please provide a valid date of birth'
    }
  },
  gender: {
    type: String,
    enum: {
      values: ['male', 'female', 'other'],
      message: '{VALUE} is not a valid gender'
    },
    default: 'other'
  },
  membershipDate: {
    type: Date,
    default: Date.now
  },
  membershipStatus: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'pending'],
      message: '{VALUE} is not a valid membership status'
    },
    default: 'active'
  },
  department: [{
    type: String
  }],
  familyMembers: [{
    name: String,
    relationship: String
  }],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
memberSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Member', memberSchema); 