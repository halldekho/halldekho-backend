const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const Hall = require('../models/Hall');
const router = express.Router();


router.get('/all-halls', async (req, res) => {
  try {
    // Get query parameters for pagination
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 9; // Fixed to 9 items per page

    // Calculate the starting index
    const startIndex = (page - 1) * limit;

    // Fetch halls with pagination
    const halls = await Hall.find()
      .skip(startIndex)
      .limit(limit);

    // Get the total count of halls
    const totalHalls = await Hall.countDocuments();

    // If no halls are found
    if (!halls.length) {
      return res.status(404).json({ msg: 'No halls found on the platform' });
    }

    // Return paginated data
    res.status(200).json({
      halls,
      totalHalls,
      currentPage: page,
      totalPages: Math.ceil(totalHalls / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;