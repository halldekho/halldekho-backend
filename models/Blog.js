const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    images: [{ type: String }], // ✅ Stores multiple image URLs, consistent with hall model
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);

