const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Hall = require('../models/Hall');

router.delete('/:id', async (req, res) => {
  try {
    const hallId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({ msg: 'Invalid Hall ID format' });
    }

    const hall = await Hall.findByIdAndDelete(hallId);

    if (!hall) {
      return res.status(404).json({ msg: 'Hall not found' });
    }

    res.status(200).json({ msg: 'Hall deleted successfully', hall });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
});

module.exports = router;
