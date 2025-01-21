const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Issue = require('../models/IssueReq');
const Hall = require('../models/Hall');

const router = express.Router();

// Get All Issue Requests for a Hall
router.get('/issues/:hallId', authMiddleware, roleMiddleware('owner'), async (req, res) => {
  try {
    const { hallId } = req.params;
    const ownerId = req.user.id;

    // Validate Hall ID
    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({ msg: 'Invalid Hall ID format' });
    }

    // Check if the hall belongs to the owner
    const hall = await Hall.findOne({ _id: hallId, owner: ownerId });
    if (!hall) {
      return res.status(404).json({ msg: 'Hall not found or you do not own this hall' });
    }

    // Get all issues for the hall
    const issues = await Issue.find({ hall: hallId }).populate('user', 'name email');

    res.status(200).json({ issues });
  } catch (err) {
    console.error('Error fetching issues:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
