const express = require("express");
const mongoose = require("mongoose");
const Reviews = require("../models/Reviews");

const router = express.Router();

// Route to fetch the average rating for a particular hall
router.get("/average-rating/:hallId", async (req, res) => {
  try {
    const { hallId } = req.params;

    // Validate Hall ID
    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({ msg: "Invalid Hall ID format" });
    }

    // Fetch all reviews for the hall
    const reviews = await Reviews.find({ hallId });

    // Default to 5 if no reviews exist
    if (reviews.length === 0) {
      return res
        .status(200)
        .json({ averageRating: 5, msg: "Default rating as no reviews found" });
    }

    // Calculate the average rating
    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    const avgRating = (totalRating / reviews.length).toFixed(1);

    res.status(200).json({ averageRating: avgRating });
  } catch (err) {
    console.error("Error fetching average rating:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;

