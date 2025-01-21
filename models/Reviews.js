const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    hallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5, 
    },
    comment: {
      type: String,
      required: true,
      minlength: 10, 
      maxlength: 500, 
    },
  },
  {
    timestamps: true, 
  }
);

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
