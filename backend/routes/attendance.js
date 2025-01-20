const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { auth } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'abovethehillsmanagement@gmail.com',
    pass: process.env.EMAIL_PASSWORD // This should be set in your .env file
  }
});

// Error handler middleware
const handleError = (res, error, defaultMessage) => {
  console.error(defaultMessage, error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || defaultMessage
  });
};

// Get all attendance records with optional date filter
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Add date filter if provided
    if (req.query.date) {
      const searchDate = new Date(req.query.date);
      query.serviceDate = {
        $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        $lt: new Date(searchDate.setHours(23, 59, 59, 999))
      };
    }

    const attendance = await Attendance.find(query)
      .sort({ serviceDate: -1 })
      .populate('createdBy', 'username')
      .lean();
    
    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    handleError(res, error, 'Error fetching attendance records');
  }
});

// Create new attendance record
router.post('/', auth, async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['serviceDate', 'serviceType'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        throw { status: 400, message: `Missing required field: ${field}` };
      }
    }

    // Convert string numbers to integers with default 0
    const numberFields = ['noOfMen', 'noOfWomen', 'noOfBoys', 'noOfGirls', 'noOfChildren', 'noOfFirstTimers'];
    const attendanceData = {
      ...req.body,
      createdBy: new mongoose.Types.ObjectId('000000000000000000000001'), // Use fixed admin ID
      pastorEmail: 'vamobi29@gmail.com', // Always set pastor email
      ...Object.fromEntries(
        numberFields.map(field => [field, parseInt(req.body[field]) || 0])
      )
    };

    const attendance = new Attendance(attendanceData);
    await attendance.save();
    
    const savedAttendance = await Attendance.findById(attendance._id)
      .populate('createdBy', 'username')
      .lean();

    res.status(201).json({
      success: true,
      data: savedAttendance
    });
  } catch (error) {
    console.error('Error creating attendance:', error);
    handleError(res, error, 'Error creating attendance record');
  }
});

// Get attendance summary
router.get('/summary', auth, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [monthlyStats, todayStats] = await Promise.all([
      // Monthly statistics
      Attendance.aggregate([
        {
          $match: {
            serviceDate: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalAttendance: { $sum: '$totalAttendance' },
            totalFirstTimers: { $sum: '$noOfFirstTimers' },
            avgAttendance: { $avg: '$totalAttendance' },
            services: { $sum: 1 }
          }
        }
      ]),
      // Today's statistics
      Attendance.aggregate([
        {
          $match: {
            serviceDate: {
              $gte: new Date(today.setHours(0, 0, 0, 0)),
              $lt: new Date(today.setHours(23, 59, 59, 999))
            }
          }
        },
        {
          $group: {
            _id: null,
            totalAttendance: { $sum: '$totalAttendance' },
            totalFirstTimers: { $sum: '$noOfFirstTimers' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        monthly: monthlyStats[0] || {
          totalAttendance: 0,
          totalFirstTimers: 0,
          avgAttendance: 0,
          services: 0
        },
        today: todayStats[0] || {
          totalAttendance: 0,
          totalFirstTimers: 0
        }
      }
    });
  } catch (error) {
    handleError(res, error, 'Error fetching attendance summary');
  }
});

// Update attendance record
router.put('/:id', auth, async (req, res) => {
  try {
    // Convert string numbers to integers with default 0
    const numberFields = ['noOfMen', 'noOfWomen', 'noOfBoys', 'noOfGirls', 'noOfChildren', 'noOfFirstTimers'];
    const updates = {
      ...req.body,
      pastorEmail: 'vamobi29@gmail.com', // Set default pastor email
      ...Object.fromEntries(
        numberFields.map(field => [field, parseInt(req.body[field]) || 0])
      )
    };

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('createdBy', 'username').lean();

    if (!attendance) {
      throw { status: 404, message: 'Attendance record not found' };
    }

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    handleError(res, error, 'Error updating attendance record');
  }
});

// Delete attendance record
router.delete('/:id', auth, async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) {
      throw { status: 404, message: 'Attendance record not found' };
    }
    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    handleError(res, error, 'Error deleting attendance record');
  }
});

// Send attendance to pastor
router.post('/:id/send', auth, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      throw { status: 404, message: 'Attendance record not found' };
    }

    // Set default pastor email if not specified
    if (!attendance.pastorEmail) {
      attendance.pastorEmail = 'vamobi29@gmail.com';
      await attendance.save();
    }

    // Format the date
    const formattedDate = new Date(attendance.serviceDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Hello Rev. Clem,</h2>
        
        <p style="color: #34495e; font-size: 16px;">I hope this email finds you well. Please find below the attendance report for our ${attendance.serviceType.toLowerCase()}.</p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Service Details:</h3>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0;"><strong>Service Type:</strong> ${attendance.serviceType}</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Attendance Breakdown:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Men:</strong></td>
              <td style="padding: 8px 0;">${attendance.noOfMen}</td>
              <td style="padding: 8px 0;"><strong>Women:</strong></td>
              <td style="padding: 8px 0;">${attendance.noOfWomen}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Boys:</strong></td>
              <td style="padding: 8px 0;">${attendance.noOfBoys}</td>
              <td style="padding: 8px 0;"><strong>Girls:</strong></td>
              <td style="padding: 8px 0;">${attendance.noOfGirls}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Children:</strong></td>
              <td style="padding: 8px 0;">${attendance.noOfChildren}</td>
              <td style="padding: 8px 0;"><strong>First Timers:</strong></td>
              <td style="padding: 8px 0;">${attendance.noOfFirstTimers}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Summary:</h3>
          <p style="font-size: 18px; margin: 5px 0;"><strong>Total Attendance:</strong> ${attendance.totalAttendance}</p>
          ${attendance.noOfFirstTimers > 0 ? `<p style="font-size: 18px; margin: 5px 0;"><strong>First Time Visitors:</strong> ${attendance.noOfFirstTimers}</p>` : ''}
        </div>

        ${attendance.notes ? `
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Additional Notes:</h3>
          <p style="margin: 5px 0;">${attendance.notes}</p>
        </div>
        ` : ''}

        <p style="color: #34495e; font-size: 16px; margin-top: 20px;">Best regards,<br>Church Management System</p>
      </div>
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'abovethehillsmanagement@gmail.com',
      to: ['gracedclem@gmail.com', 'vamobi29@gmail.com'], // Send to both emails
      subject: `Attendance Report - ${attendance.serviceType} (${formattedDate})`,
      html: emailContent
    });

    // Update attendance record
    attendance.sentToPastor = true;
    await attendance.save();

    res.json({
      success: true,
      message: 'Attendance report sent successfully'
    });
  } catch (error) {
    handleError(res, error, 'Error sending attendance report');
  }
});

module.exports = router;