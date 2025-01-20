const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const { auth } = require('../middleware/auth');

// Get all members
router.get('/', auth, async (req, res) => {
  try {
    const members = await Member.find();
    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ message: 'Error fetching members', error: error.message });
  }
});

// Add new member
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received member data:', req.body);
    
    // Create new member instance
    const member = new Member({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      address: {
        street: req.body.address.street || 'N/A',
        city: req.body.address.city || 'N/A',
        state: req.body.address.state || 'N/A',
        zipCode: req.body.address.zipCode || 'N/A'
      },
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender || 'other',
      membershipDate: req.body.membershipDate || new Date(),
      membershipStatus: req.body.membershipStatus || 'active',
      department: req.body.department || [],
      familyMembers: req.body.familyMembers || [],
      notes: req.body.notes
    });

    // Validate the member data
    const validationError = member.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({ 
        message: 'Validation error', 
        error: validationError.message 
      });
    }

    // Save the member
    await member.save();
    console.log('Member created successfully:', member);
    res.status(201).json(member);
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(400).json({ 
      message: 'Error creating member', 
      error: error.message,
      details: error.errors ? Object.values(error.errors).map(err => err.message) : []
    });
  }
});

// Update member
router.put('/:id', auth, async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(400).json({ message: 'Error updating member', error: error.message });
  }
});

// Delete member
router.delete('/:id', auth, async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ message: 'Error deleting member', error: error.message });
  }
});

module.exports = router; 