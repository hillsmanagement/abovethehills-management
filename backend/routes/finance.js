const express = require('express');
const router = express.Router();
const Finance = require('../models/Finance');
const { auth } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'abovethehillsmanagement@gmail.com',
    pass: process.env.EMAIL_PASSWORD
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

// Get all finance records
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Add date filter if provided
    if (req.query.date) {
      const searchDate = new Date(req.query.date);
      query.date = {
        $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        $lt: new Date(searchDate.setHours(23, 59, 59, 999))
      };
    }

    const transactions = await Finance.find(query)
      .sort({ date: -1 })
      .populate('recordedBy', 'username')
      .lean();
    
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    handleError(res, error, 'Error fetching finance records');
  }
});

// Create new finance record
router.post('/', auth, async (req, res) => {
  try {
    const { offeringAmount, titheAmount, seedAmount, seedOfFaithAmount, paymentMethod, date } = req.body;

    // Validate amounts are non-negative
    const amounts = { offeringAmount, titheAmount, seedAmount, seedOfFaithAmount };
    for (const [key, value] of Object.entries(amounts)) {
      if (value < 0) {
        throw { status: 400, message: `${key} cannot be negative` };
      }
    }

    const financeData = {
      date: date || new Date(),
      offeringAmount: offeringAmount || 0,
      titheAmount: titheAmount || 0,
      seedAmount: seedAmount || 0,
      seedOfFaithAmount: seedOfFaithAmount || 0,
      paymentMethod: paymentMethod || 'cash',
      status: 'completed',
      recordedBy: 'admin',
      pastorEmail: 'vamobi29@gmail.com'
    };

    const finance = new Finance(financeData);
    await finance.save();

    const savedFinance = await Finance.findById(finance._id).lean();

    // Send email notification
    await sendFinanceEmail(savedFinance);

    res.status(201).json({
      success: true,
      data: savedFinance
    });
  } catch (error) {
    handleError(res, error, 'Error creating finance record');
  }
});

// Get finance summary
router.get('/summary', auth, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [monthlyStats, todayStats] = await Promise.all([
      // Monthly statistics
      Finance.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalOffering: { $sum: '$offeringAmount' },
            totalTithe: { $sum: '$titheAmount' },
            totalSeed: { $sum: '$seedAmount' },
            totalSeedOfFaith: { $sum: '$seedOfFaithAmount' },
            totalAmount: {
              $sum: {
                $add: [
                  '$offeringAmount',
                  '$titheAmount',
                  '$seedAmount',
                  '$seedOfFaithAmount'
                ]
              }
            }
          }
        }
      ]),
      // Today's statistics
      Finance.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(today.setHours(0, 0, 0, 0)),
              $lt: new Date(today.setHours(23, 59, 59, 999))
            }
          }
        },
        {
          $group: {
            _id: null,
            totalOffering: { $sum: '$offeringAmount' },
            totalTithe: { $sum: '$titheAmount' },
            totalSeed: { $sum: '$seedAmount' },
            totalSeedOfFaith: { $sum: '$seedOfFaithAmount' },
            totalAmount: {
              $sum: {
                $add: [
                  '$offeringAmount',
                  '$titheAmount',
                  '$seedAmount',
                  '$seedOfFaithAmount'
                ]
              }
            }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        monthly: monthlyStats[0] || {
          totalOffering: 0,
          totalTithe: 0,
          totalSeed: 0,
          totalSeedOfFaith: 0,
          totalAmount: 0
        },
        today: todayStats[0] || {
          totalOffering: 0,
          totalTithe: 0,
          totalSeed: 0,
          totalSeedOfFaith: 0,
          totalAmount: 0
        }
      }
    });
  } catch (error) {
    handleError(res, error, 'Error fetching finance summary');
  }
});

// Send finance report to pastor
router.post('/:id/send', auth, async (req, res) => {
  try {
    const finance = await Finance.findById(req.params.id);
    if (!finance) {
      throw { status: 404, message: 'Finance record not found' };
    }

    await sendFinanceEmail(finance);

    // Update finance record
    finance.sentToPastor = true;
    await finance.save();

    res.json({
      success: true,
      message: 'Finance report sent successfully'
    });
  } catch (error) {
    handleError(res, error, 'Error sending finance report');
  }
});

// Delete finance record
router.delete('/:id', auth, async (req, res) => {
  try {
    const finance = await Finance.findByIdAndDelete(req.params.id);
    if (!finance) {
      throw { status: 404, message: 'Finance record not found' };
    }
    res.json({
      success: true,
      message: 'Finance record deleted successfully'
    });
  } catch (error) {
    handleError(res, error, 'Error deleting finance record');
  }
});

// Helper function to send finance email
async function sendFinanceEmail(finance) {
  const formattedDate = new Date(finance.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const totalAmount = finance.offeringAmount + finance.titheAmount + 
    finance.seedAmount + finance.seedOfFaithAmount;

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Hello Rev. Clem,</h2>
      
      <p style="color: #34495e; font-size: 16px;">I hope this email finds you well. Please find below the financial report for ${formattedDate}.</p>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">Transaction Details:</h3>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
        <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${finance.paymentMethod}</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">Financial Breakdown:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e1e8ed;">
            <td style="padding: 12px 0;"><strong>Offering:</strong></td>
            <td style="padding: 12px 0; text-align: right;">${formatCurrency(finance.offeringAmount)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e1e8ed;">
            <td style="padding: 12px 0;"><strong>Tithe:</strong></td>
            <td style="padding: 12px 0; text-align: right;">${formatCurrency(finance.titheAmount)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e1e8ed;">
            <td style="padding: 12px 0;"><strong>Seed:</strong></td>
            <td style="padding: 12px 0; text-align: right;">${formatCurrency(finance.seedAmount)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e1e8ed;">
            <td style="padding: 12px 0;"><strong>Seed of Faith:</strong></td>
            <td style="padding: 12px 0; text-align: right;">${formatCurrency(finance.seedOfFaithAmount)}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">Summary:</h3>
        <p style="font-size: 20px; margin: 5px 0; color: #2c3e50;">
          <strong>Total Amount:</strong> 
          <span style="color: #27ae60;">${formatCurrency(totalAmount)}</span>
        </p>
      </div>

      <p style="color: #34495e; font-size: 16px; margin-top: 20px;">Best regards,<br>Church Management System</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER || 'abovethehillsmanagement@gmail.com',
    to: ['gracedclem@gmail.com', 'vamobi29@gmail.com'],
    subject: `Financial Report - ${formattedDate}`,
    html: emailContent
  });
}

module.exports = router; 