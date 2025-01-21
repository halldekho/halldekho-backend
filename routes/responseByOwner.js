const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Issue = require('../models/IssueReq');

const router = express.Router();

// Respond to an Issue Request
router.put('/respond-issue/:issueId', authMiddleware, roleMiddleware('owner'), async (req, res) => {
  try {
    const { issueId } = req.params;
    const { response, status, resolutionDate, notes } = req.body;
    const ownerId = req.user.id;

    // Validate Issue ID
    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({ msg: 'Invalid Issue ID format' });
    }

    // Find the issue and check if the owner owns the hall
    const issue = await Issue.findById(issueId).populate('hall');
    if (!issue || issue.hall.owner.toString() !== ownerId) {
      return res.status(404).json({ msg: 'Issue not found or you do not have permission to respond' });
    }

    // Validate the input fields
    if (!response || !status) {
      return res.status(400).json({ msg: 'Response and status are required' });
    }

    // Update the issue with the owner's response
    issue.response = response;
    issue.status = status;  // Update status (e.g., 'resolved', 'pending', etc.)
    if (resolutionDate) {
      issue.resolutionDate = new Date(resolutionDate);  // If a resolution date is provided, set it
    }
    if (notes) {
      issue.notes = notes;  // Add any additional notes if provided
    }
    issue.resolved = status === 'resolved';  // Automatically mark as resolved if status is 'resolved'
    
    // Save the updated issue
    await issue.save();

    res.status(200).json({ msg: 'Response added successfully', issue });
  } catch (err) {
    console.error('Error responding to issue:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
