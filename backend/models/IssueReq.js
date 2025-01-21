const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    department: { type: String, required: true },
    hall: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    response: { type: String, default: null },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Issue', IssueSchema);