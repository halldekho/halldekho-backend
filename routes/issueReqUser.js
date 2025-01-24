// const express = require('express');
// const mongoose = require('mongoose');
// const { authMiddleware } = require('../middleware/auth');
// const Issue = require('../models/IssueReq');
// const Hall = require('../models/Hall');

// const router = express.Router();

// // Create Issue Request
// router.post('/create-issue/:hallId', authMiddleware, async (req, res) => {
//   try {
//     const { hallId } = req.params;
//     const { description, department } = req.body;
//     const userId = req.user.id;

//     // Validate Hall ID
//     if (!mongoose.Types.ObjectId.isValid(hallId)) {
//       return res.status(400).json({ msg: 'Invalid Hall ID format' });
//     }

//     // Check if the hall exists
//     const hall = await Hall.findById(hallId);
//     if (!hall) {
//       return res.status(404).json({ msg: 'Hall not found' });
//     }

//     // Create a new issue
//     const issue = new Issue({
//       description,
//       department,
//       hall: hallId,
//       user: userId,
//     });

//     await issue.save();

//     res.status(201).json({ msg: 'Issue request created successfully', issue });
//   } catch (err) {
//     console.error('Error creating issue:', err);
//     res.status(500).json({ msg: 'Server error' });
//   }
// });

// module.exports = router;















const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { authMiddleware } = require('../middleware/auth');
const Issue = require('../models/IssueReq');
const Hall = require('../models/Hall');
const User = require('../models/User'); // Assuming User schema exists for user details

const router = express.Router();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Or another email service
  auth: {
    user: process.env.EMAIL, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your email password
  },
});

// Create Issue Request
router.post('/create-issue/:hallId', authMiddleware, async (req, res) => {
  try {
    const { hallId } = req.params;
    const { description, department } = req.body;
    const userId = req.user.id;

    // Validate Hall ID
    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({ msg: 'Invalid Hall ID format' });
    }

    // Check if the hall exists
    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({ msg: 'Hall not found' });
    }

    // Check if hall owner exists
    const hallOwner = await User.findById(hall.owner); // Assuming `owner` in Hall refers to the owner's user ID
    if (!hallOwner) {
      return res.status(404).json({ msg: 'Hall owner not found' });
    }

    // Create a new issue
    const issue = new Issue({
      description,
      department,
      hall: hallId,
      user: userId,
    });

    await issue.save();

    // Send Email to the Hall Owner
    const emailBody = `
      <p>Dear ${hallOwner.name},</p>
      <p>A new issue request has been created for your hall "${hall.name}".</p>
      <p><strong>Issue Details:</strong></p>
      <ul>
        <li><strong>Description:</strong> ${description}</li>
        <li><strong>Department:</strong> ${department}</li>
      </ul>
      <p>
        Please respond to this issue by clicking the button below:
      </p>
      <a href="https://halldekho.vercel.app/visit-halls" 
         style="display: inline-block; padding: 10px 15px; font-size: 14px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
        Respond to Issue
      </a>
      <p>Thank you,</p>
      <p>Hall Dekho Team</p>
    `;

    await transporter.sendMail({
      from: `"Hall Dekho" <${process.env.EMAIL}>`,
      to: hallOwner.email, // Hall owner's email
      subject: `New Issue Request for Your Hall "${hall.name}"`,
      html: emailBody,
    });

    res.status(201).json({ msg: 'Issue request created successfully and email sent', issue });
  } catch (err) {
    console.error('Error creating issue:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
