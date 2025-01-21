const express = require('express');
const mongoose = require('mongoose');
const Hall = require('../models/Hall'); // Assuming Hall schema is defined
const router = express.Router();

// Get Hall Details
router.get('/hall-detail/:hallId', async (req, res) => {
  try {
    const { hallId } = req.params;

    // Validate Hall ID
    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({ msg: 'Invalid Hall ID format' });
    }

    // Fetch hall details
    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({ msg: 'Hall not found' });
    }

    const hallDetails = {
        hall,
    };

    res.status(200).json({ msg: 'Hall details retrieved successfully', hallDetails });
  } catch (err) {
    console.error('Error fetching hall details:', err);
    res.status(500).json({ err });
  }
});

module.exports = router;
