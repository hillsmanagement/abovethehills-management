const express = require('express');
const router = express.Router();
const Communication = require('../models/Communication');
const { auth } = require('../middleware/auth');

// Get all announcements
router.get('/', auth, async (req, res) => {
  try {
    const announcements = await Communication.find({ type: 'announcement' })
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements', error: error.message });
  }
});

// Create new announcement
router.post('/', auth, async (req, res) => {
  try {
    const announcement = new Communication({
      ...req.body,
      type: 'announcement',
      sender: req.user._id,
      status: 'sent',
      sentDate: new Date()
    });
    await announcement.save();
    res.status(201).json(announcement);
  } catch (error) {
    res.status(400).json({ message: 'Error creating announcement', error: error.message });
  }
});

// Update announcement
router.put('/:id', auth, async (req, res) => {
  try {
    const announcement = await Communication.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json(announcement);
  } catch (error) {
    res.status(400).json({ message: 'Error updating announcement', error: error.message });
  }
});

// Delete announcement
router.delete('/:id', auth, async (req, res) => {
  try {
    const announcement = await Communication.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting announcement', error: error.message });
  }
});

module.exports = router; 