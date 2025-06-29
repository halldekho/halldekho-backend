const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

const User = require('../models/User');
const Booking = require('../models/Booking');
const Hall = require('../models/Hall');

// GET /user/profile - fetch user details + bookings
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    const bookings = await Booking.find({ userId: user._id })
      .populate('hallId', 'name location') // optional: include hall info
      .sort({ createdAt: -1 });

    const profileComplete =
      user.name && user.mobile && user.address && user.state && user.country;

    res.status(200).json({
      profile: {
        email: user.email,
        role: user.role,
        name: user.name || '',
        mobile: user.mobile || '',
        address: user.address || '',
        state: user.state || '',
        country: user.country || ''
      },
      profileComplete: !!profileComplete,
      bookings: bookings.map((b) => ({
        hallName: b.hallId?.name || 'N/A',
        hallAddress: b.hallId?.location?.address || 'N/A',
        date: new Date(b.date).toLocaleDateString('en-IN'),
        timeSlot: b.timeSlot,
        status: b.status,
        totalAmount: b.totalAmount,
        paymentStatus: b.paymentStatus
      }))
    });
  } catch (err) {
    console.error('GET /user/profile error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /user/profile - update profile info
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, mobile, address, state, country } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, mobile, address, state, country },
      { new: true }
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      updatedProfile: {
        email: updatedUser.email,
        role: updatedUser.role,
        name: updatedUser.name,
        mobile: updatedUser.mobile,
        address: updatedUser.address,
        state: updatedUser.state,
        country: updatedUser.country
      }
    });
  } catch (err) {
    console.error('PUT /user/profile error:', err.message);
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
});

module.exports = router;
