const express = require("express");
const mongoose = require("mongoose");
const { authMiddleware } = require("../middleware/auth");
const Reviews = require("../models/Reviews");
const Hall = require("../models/Hall");

const router = express.Router();

router.post("/add-review/:hallId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "consumer") {
      return res.status(403).json({ msg: "Only consumers are allowed to add reviews." });
    }

    const { hallId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({ msg: "Invalid Hall ID format" });
    }

    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({ msg: "Hall not found" });
    }


    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }

    const review = new Reviews({
      hallId,
      userId,
      rating,
      comment,
    });

    await review.save();

    res.status(201).json({ msg: "Review added successfully", review });
  } catch (err) {
    console.error("Error adding review:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/reviews/:hallId", async (req, res) => {
  try {
    const { hallId } = req.params;

    // Validate Hall ID
    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({ msg: "Invalid Hall ID format" });
    }

    const reviews = await Review.find({ hallId }).populate("userId", "name");
    res.status(200).json({ reviews });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
