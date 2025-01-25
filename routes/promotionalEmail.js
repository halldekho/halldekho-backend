const express = require("express");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const User = require("../models/User"); // Your User model
const verifySuperAdmin = require("../middleware/verifySuperAdmin"); // Super admin verification middleware
const emailTemplate = require("../utils/emailTemplate"); // Import the email template
const router = express.Router();

let emailJobCompleted = false; // Flag to track if the email job has been completed

// Function to send promotional emails in batches
async function sendEmailsInBatches(users, batchSize, transporter) {
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize); // Get the next batch of users
    const emailPromises = batch.map((user) => {
      const mailOptions = {
        from: '"Hall Dekho Support" <your-email@gmail.com>',
        to: user.email, // Set email for each user
        subject: "Exclusive Promotional Offer from Hall Dekho!",
        html: emailTemplate(), // Email body using the email template
      };
      return transporter.sendMail(mailOptions);
    });

    // Wait for the current batch of emails to be sent
    await Promise.all(emailPromises);
    console.log(`Batch ${Math.floor(i / batchSize) + 1} sent successfully`);

    // Add a delay of 2 minutes before sending the next batch
    if (i + batchSize < users.length) {
      console.log("Waiting 2 minutes before sending next batch...");
      await new Promise((resolve) => setTimeout(resolve, 120000)); // Delay for 2 minutes
    }
  }

  // Set the flag to true once all batches have been processed
  emailJobCompleted = true;
  console.log("All email batches sent successfully. Job completed.");
}

// Cron job to send promotional email every Monday at 10:00 AM for the next 2 months
cron.schedule(
  "0 10 * * 1",
  async () => {
    const currentDate = new Date();
    const endDate = new Date();
    endDate.setMonth(currentDate.getMonth() + 2); // Set end date to 2 months later

    if (currentDate <= endDate && !emailJobCompleted) {
      console.log("Sending promotional emails to all users...");
      try {
        // Get all registered users from the database
        const users = await User.find();

        if (users.length === 0) {
          console.log("No users found");
          return;
        }

        // Setup email transporter using Nodemailer
        const transporter = nodemailer.createTransport({
          service: "gmail", // You can use any email service
          auth: {
            user: process.env.EMAIL, // Your email
            pass: process.env.EMAIL_PASSWORD, // Your email password (use app-specific password if 2FA is enabled)
          },
        });

        // Call the batch email sending function with a batch size of 10
        await sendEmailsInBatches(users, 10, transporter);
      } catch (err) {
        console.error("Error sending email", err);
      }
    } else if (emailJobCompleted) {
      console.log("The promotional email job has already been completed for this period.");
    } else {
      console.log("Cron job has finished for the next two months.");
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);

// Create the route for sending promotional emails manually (optional)
router.post("/send-promotional-email", verifySuperAdmin, async (req, res) => {
  try {
    // Get all registered users from the database
    const users = await User.find();

    if (users.length === 0) {
      return res.status(404).json({ msg: "No users found" });
    }

    // Setup email transporter using Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail", // You can use any email service
      auth: {
        user: process.env.EMAIL, // Your email
        pass: process.env.EMAIL_PASSWORD, // Your email password (use app-specific password if 2FA is enabled)
      },
    });

    // Call the batch email sending function with a batch size of 10
    await sendEmailsInBatches(users, 10, transporter);

    res
      .status(200)
      .json({ msg: "Promotional email sent to all users in batches" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error sending email" });
  }
});

module.exports = router;
