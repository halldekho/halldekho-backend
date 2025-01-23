// routes/auth.js
const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const nodemailer = require("nodemailer");  // For sending email
const router = express.Router();

// Send password reset link
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash the token before storing it in the database
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expiration time for the token (1 hour from now)
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    // Save the user with the token and expiration time
    await user.save();

    // Send reset link via email (using nodemailer)
    const transporter = nodemailer.createTransport({
      service: "gmail", // You can use other services like SendGrid, etc.
      auth: {
        user: process.env.EMAIL,  // Replace with your email
        pass: process.env.EMAIL_PASSWORD,    // Replace with your email password
      },
    });

    const resetLink = `http://halldekho.vercel.app/reset-password/${resetToken}`;

    // Send email
    const mailOptions = {
      from: '"Hall Dekho Support" <your-email@gmail.com>',
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>Hi,</p>
        <p>You requested a password reset for your Hall Dekho account. Click the link below to reset your password:</p>
        <p><a href="${resetLink}" target="_blank">Reset Password</a></p>
        <p>This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
        <p>Thank you,</p>
        <p>Hall Dekho Team</p>
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return res.status(500).json({ err });
      }
      res.status(200).json({
        message: "Password reset link has been sent to your email.",
        resetToken
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset password
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;  // Get token from URL
  const { newPassword } = req.body;  // Get the new password from the request body

  try {
    // Hash the token to match the stored token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user by token and check expiration time
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },  // Token not expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Hash the new password and save it
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear the reset token and expiration time
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Save the updated user
    await user.save();

    res.status(200).json({ message: "Password reset successful." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
