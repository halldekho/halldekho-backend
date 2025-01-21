const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Hall = require('../models/Hall');
const router = express.Router();

router.get('/my-halls', authMiddleware, roleMiddleware('owner'), async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Get query parameters for pagination
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 3; // Fixed to 3 items per page

    // Calculate the starting index
    const startIndex = (page - 1) * limit;

    // Fetch halls for the owner with pagination
    const halls = await Hall.find({ owner: ownerId })
      .skip(startIndex)
      .limit(limit);

    // Get the total count of halls
    const totalHalls = await Hall.countDocuments({ owner: ownerId });

    // If no halls are found
    if (!halls.length) {
      return res.status(404).json({ msg: 'No halls found for this owner' });
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
