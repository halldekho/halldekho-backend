const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Hall = require('../models/Hall');

const router = express.Router();

router.put('/update-hall/:id', authMiddleware, roleMiddleware('owner'), async (req, res) => {
  try {
    const hallId = req.params.id;
    const ownerId = req.user.id;
    const updates = req.body;

    // Log received data for debugging
    console.log('Update request received:', { hallId, ownerId, updates });

    // Validate Hall ID
    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({ msg: 'Invalid Hall ID format' });
    }

    // Find the hall by ID and owner
    const hall = await Hall.findOne({ _id: hallId, owner: ownerId });

    if (!hall) {
      return res
        .status(404)
        .json({ msg: 'Hall not found or you do not have permission to update it' });
    }

    // Log hall state before updates
    console.log('Current hall data:', hall);

    // Update the hall fields dynamically
    Object.keys(updates).forEach((key) => {
      // Ensure only valid fields are updated
      if (key in hall) {
        hall[key] = updates[key];
      }
    });

    // Save the updated hall
    const updatedHall = await hall.save();

    // Log hall state after updates
    console.log('Updated hall data:', updatedHall);

    res.status(200).json({ msg: 'Hall updated successfully', hall: updatedHall });
  } catch (error) {
    console.error('Error updating hall:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

