// const express = require('express');
// const mongoose = require('mongoose');
// const { authMiddleware, roleMiddleware } = require('../middleware/auth');
// const Issue = require('../models/IssueReq');

// const router = express.Router();

// // Respond to an Issue Request
// router.put('/respond-issue/:issueId', authMiddleware, roleMiddleware('owner'), async (req, res) => {
//   try {
//     const { issueId } = req.params;
//     const { response, status, resolutionDate, notes } = req.body;
//     const ownerId = req.user.id;

//     // Validate Issue ID
//     if (!mongoose.Types.ObjectId.isValid(issueId)) {
//       return res.status(400).json({ msg: 'Invalid Issue ID format' });
//     }

//     // Find the issue and check if the owner owns the hall
//     const issue = await Issue.findById(issueId).populate('hall');
//     if (!issue || issue.hall.owner.toString() !== ownerId) {
//       return res.status(404).json({ msg: 'Issue not found or you do not have permission to respond' });
//     }

//     // Validate the input fields
//     if (!response || !status) {
//       return res.status(400).json({ msg: 'Response and status are required' });
//     }

//     // Update the issue with the owner's response
//     issue.response = response;
//     issue.status = status;  // Update status (e.g., 'resolved', 'pending', etc.)
//     if (resolutionDate) {
//       issue.resolutionDate = new Date(resolutionDate);  // If a resolution date is provided, set it
//     }
//     if (notes) {
//       issue.notes = notes;  // Add any additional notes if provided
//     }
//     issue.resolved = status === 'resolved';  // Automatically mark as resolved if status is 'resolved'
    
//     // Save the updated issue
//     await issue.save();

//     res.status(200).json({ msg: 'Response added successfully', issue });
//   } catch (err) {
//     console.error('Error responding to issue:', err);
//     res.status(500).json({ msg: 'Server error' });
//   }
// });

// module.exports = router;



























const express = require("express");
const mongoose = require("mongoose");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const Issue = require("../models/IssueReq");
const User = require("../models/User"); // Ensure you're using the correct model for User
const nodemailer = require("nodemailer"); // Assuming you're using nodemailer

const router = express.Router();

// Respond to an Issue Request
router.put(
  "/respond-issue/:issueId",
  authMiddleware,
  roleMiddleware("owner"),
  async (req, res) => {
    try {
      const { issueId } = req.params;
      const { response, status, resolutionDate, notes } = req.body;
      const ownerId = req.user.id;

      // Validate Issue ID
      if (!mongoose.Types.ObjectId.isValid(issueId)) {
        return res.status(400).json({ msg: "Invalid Issue ID format" });
      }

      // Find the issue and check if the owner owns the hall
      const issue = await Issue.findById(issueId)
        .populate("hall")
        .populate("user");
      if (!issue || issue.hall.owner.toString() !== ownerId) {
        return res
          .status(404)
          .json({
            msg: "Issue not found or you do not have permission to respond",
          });
      }

      // Validate the input fields
      if (!response || !status) {
        return res
          .status(400)
          .json({ msg: "Response and status are required" });
      }

      // Update the issue with the owner's response
      issue.response = response;
      issue.status = status; // Update status (e.g., 'resolved', 'pending', etc.)
      if (resolutionDate) {
        issue.resolutionDate = new Date(resolutionDate); // If a resolution date is provided, set it
      }
      if (notes) {
        issue.notes = notes; // Add any additional notes if provided
      }
      issue.resolved = status === "resolved"; // Automatically mark as resolved if status is 'resolved'

      // Save the updated issue
      await issue.save();

      // Debugging: Log the issue and check if user field exists
      console.log("Issue found:", issue);
      console.log("User ID who created the issue:", issue.user);

      // Fetch the user's email using the user ID (already populated)
      const user = issue.user; // Since it's populated, we can access the user directly

      // Debugging: Log the user fetched
      console.log("User found:", user);
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      // Send email notification to the user
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: `"Hall Dekho" <${process.env.EMAIL}>`,
        to: user.email, // Send email to the user who created the issue
        subject: "📢 Update on Your Issue for the Hall!",
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
          <h2 style="color: #4CAF50; text-align: center;">Your Issue Has Been Addressed!</h2>
          <p>Dear <strong>${user.name || "User"}</strong>,</p>
          <p>We have reviewed your issue regarding the hall <strong style="color: #007BFF;">${
            issue.hall.name
          }</strong>. Here are the details of the response:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Status:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${status}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Response:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${response}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Resolution Date:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${
                resolutionDate || "Not specified"
              }</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Notes:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${
                notes || "No additional notes"
              }</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">We also invite you to explore other amazing halls available on our platform and discover much more for your special occasions.:</p>
          <p style="text-align: center; margin-top: 10px;">
            <a href="https://halldekho.vercel.app/all-halls" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Explore</a>
          </p>
          <p style="margin-top: 20px;">Thank you for using <strong>Hall Dekho</strong>. We’re here to assist you with any further queries.</p>
          <p style="color: #555; font-size: 12px; text-align: center;">If you have any questions, please reach out to us at halldekho17@gmail.com</p>
        </div>
      `,
      };

      await transporter.sendMail(mailOptions);

      res
        .status(200)
        .json({
          msg: "Response added successfully, email notification sent",
          issue,
        });
    } catch (err) {
      console.error("Error responding to issue:", err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

module.exports = router;
