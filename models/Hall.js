const mongoose = require("mongoose");

const hallSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imagesUrl: {
      type: [String],
    },
    menuURL: {
      type: [String], // Added menu attribute
    },
    accommodation: {
      type: Number,
      required: true,
    },
    amenities: {
      type: [String],
      required: true,
    },
    vegPlatePrice: {
      type: Number,
      required: true,
    },
    nonvegPlatePrice: {
      type: Number,
      required: true,
    },
    cateringPolicy: {
      type: String,
      required: true,
    },
    decorPolicy: {
      type: String,
      required: true,
    },
    space: {
      type: [String],
      required: true,
    },
    roomPrice: {
      type: Number,
      required: false,
    },
    venueEstb: {
      type: Number,
      required: true,
    },
    outsideAlcohol: {
      type: [String],
      required: true,
    },
    djPolicy: {
      type: [String],
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    location: {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
    },  
    bookedDates: {
      type: [Date],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Create the Hall model
const Hall = mongoose.model("Hall", hallSchema);

module.exports = Hall;
