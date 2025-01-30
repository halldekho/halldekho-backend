const mongoose = require("mongoose");

const VisitRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: true,
    },
    message: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    eventDate: {
      type: Date,
      required: false,
    },
    eventMonth: {
      type: Number,
      required: false,
      min: 1,
      max: 12,
    },
    eventYear: {
      type: Number,
      required: false,
      min: new Date().getFullYear(),
    },
    guestCount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VisitRequest", VisitRequestSchema);
