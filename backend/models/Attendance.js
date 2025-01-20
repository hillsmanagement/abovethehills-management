const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  serviceDate: {
    type: Date,
    required: [true, 'Service date is required']
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    trim: true
  },
  noOfMen: {
    type: Number,
    required: true,
    min: [0, 'Number cannot be negative'],
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Number must be an integer'
    }
  },
  noOfWomen: {
    type: Number,
    required: true,
    min: [0, 'Number cannot be negative'],
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Number must be an integer'
    }
  },
  noOfBoys: {
    type: Number,
    required: true,
    min: [0, 'Number cannot be negative'],
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Number must be an integer'
    }
  },
  noOfGirls: {
    type: Number,
    required: true,
    min: [0, 'Number cannot be negative'],
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Number must be an integer'
    }
  },
  noOfChildren: {
    type: Number,
    required: true,
    min: [0, 'Number cannot be negative'],
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Number must be an integer'
    }
  },
  noOfFirstTimers: {
    type: Number,
    required: true,
    min: [0, 'Number cannot be negative'],
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Number must be an integer'
    }
  },
  totalAttendance: {
    type: Number,
    default: function() {
      return (this.noOfMen || 0) + 
             (this.noOfWomen || 0) + 
             (this.noOfBoys || 0) + 
             (this.noOfGirls || 0) + 
             (this.noOfChildren || 0) + 
             (this.noOfFirstTimers || 0);
    }
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Created by user is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  sentToPastor: {
    type: Boolean,
    default: false
  },
  pastorEmail: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  }
});

// Update total count before saving
attendanceSchema.pre('save', function(next) {
  // Ensure all number fields are integers
  const numberFields = ['noOfMen', 'noOfWomen', 'noOfBoys', 'noOfGirls', 'noOfChildren', 'noOfFirstTimers'];
  numberFields.forEach(field => {
    this[field] = parseInt(this[field] || 0);
  });

  // Calculate total attendance
  this.totalAttendance = 
    (this.noOfMen || 0) + 
    (this.noOfWomen || 0) + 
    (this.noOfBoys || 0) + 
    (this.noOfGirls || 0) + 
    (this.noOfChildren || 0) +
    (this.noOfFirstTimers || 0);

  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema); 