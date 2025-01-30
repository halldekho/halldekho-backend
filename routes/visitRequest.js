const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const { authMiddleware } = require("../middleware/auth");
const VisitRequest = require("../models/VisitRequest.js");
const Hall = require("../models/Hall");
const User = require("../models/User"); // Assuming User schema exists for user details

const router = express.Router();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail", // Or another email service
  auth: {
    user: process.env.EMAIL, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your email password
  },
});

// Create Visit Request
router.post("/request-visit/:hallId", authMiddleware, async (req, res) => {
  try {
    const { hallId } = req.params;
    const {
      message,
      name,
      surname,
      eventDate,
      eventMonth,
      eventYear,
      guestCount,
    } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Ensure only regular users (not hall owners) can request a visit
    if (user.role === "owner") {
      return res.status(403).json({ msg: "Hall owners cannot request visits" });
    }

    // Validate Hall ID
    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({ msg: "Invalid Hall ID format" });
    }

    // Check if the hall exists
    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({ msg: "Hall not found" });
    }

    // Check if hall owner exists
    const hallOwner = await User.findById(hall.owner); // Assuming `owner` in Hall refers to the owner's user ID
    if (!hallOwner) {
      return res.status(404).json({ msg: "Hall owner not found" });
    }

    // Create a new visit request
    const visitRequest = new VisitRequest({
      message,
      name,
      surname,
      eventDate,
      eventMonth,
      eventYear,
      guestCount,
      hall: hallId,
      user: userId,
    });

    await visitRequest.save();

    const emailBody = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              color: #333;
            }
            .email-container {
              background-color: #fff;
              padding: 20px;
              border-radius: 8px;
              max-width: 600px;
              margin: 0 auto;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .email-header {
              text-align: center;
              font-size: 24px;
              color: #007bff;
            }
            .email-content {
              font-size: 16px;
              margin: 20px 0;
            }
            .email-footer {
              text-align: center;
              font-size: 14px;
              color: #888;
            }
            .button {
              display: inline-block;
              padding: 12px 20px;
              font-size: 16px;
              color: #fff;
              background-color: #007bff;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <p>New Visit Request for Your Hall "${hall.name}"</p>
            </div>
            <div class="email-content">
              <p>Dear ${hallOwner.name},</p>
              <p>A new visit request has been submitted for your hall.</p>
              <p><strong>Visitor Details:</strong></p>
              <ul>
                <li><strong>Name:</strong> ${name} ${surname}</li>
                <li><strong>Email:</strong> ${
                  user.email
                }</li> <!-- User's email added here -->
                <li><strong>Event Date:</strong> ${
                  eventDate ? eventDate : `${eventMonth}-${eventYear}`
                }</li>
                <li><strong>Guest Count:</strong> ${guestCount}</li>
              </ul>
              <p><strong>Message:</strong> ${message}</p>
              <a href="https://halldekho.vercel.app/visit-halls" class="button">Respond to Request</a>
            </div>
            <div class="email-footer">
              <p>Thank you,</p>
              <p><strong>Hall Dekho Team</strong></p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Hall Dekho" <${process.env.EMAIL}>`,
      to: hallOwner.email, // Hall owner's email
      subject: `New Visit Request for Your Hall "${hall.name}"`,
      html: emailBody,
    });

    res
      .status(201)
      .json({
        msg: "Visit request created successfully and email sent",
        visitRequest,
      });
  } catch (err) {
    console.error("Error creating visit request:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
