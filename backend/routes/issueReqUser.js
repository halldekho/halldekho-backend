const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware/auth');
const Issue = require('../models/IssueReq');
const Hall = require('../models/Hall');

const router = express.Router();

// Create Issue Request
router.post('/create-issue/:hallId', authMiddleware, async (req, res) => {
  try {
    const { hallId } = req.params;
    const { description, department } = req.body;
    const userId = req.user.id;

    // Validate Hall ID
    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({ msg: 'Invalid Hall ID format' });
    }

    // Check if the hall exists
    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({ msg: 'Hall not found' });
    }

    // Create a new issue
    const issue = new Issue({
      description,
      department,
      hall: hallId,
      user: userId,
    });

    await issue.save();

    res.status(201).json({ msg: 'Issue request created successfully', issue });
  } catch (err) {
    console.error('Error creating issue:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;