const express = require('express');
const multer = require('multer');
const { Octokit } = require('@octokit/rest');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Hall = require('../models/Hall');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GitHub configuration
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const GITHUB_OWNER = 'halldekho';
const GITHUB_REPO = 'carousel-images';
const GITHUB_BRANCH = 'master';

// Onboard Hall Route
router.post(
  '/onboard-hall',
  authMiddleware,
  roleMiddleware('owner'),
  upload.array('images'),
  async (req, res) => {
    try {
      const {
        name,
        description,
        accommodation,
        amenities,
        vegPlatePrice,
        nonvegPlatePrice,
        cateringPolicy,
        decorPolicy,
        space,
        roomPrice,
        venueEstb,
        outsideAlcohol,
        djPolicy,
        phone,
        location,
      } = req.body;
      const ownerId = req.user?.id;

      // Check if the ownerId is provided
      if (!ownerId) {
        return res.status(403).json({ msg: 'User ID is required' });
      }

      // Parse and validate array fields
      const parseArrayField = (field, fieldName) => {
        try {
          const parsedArray = JSON.parse(field);
          if (!Array.isArray(parsedArray)) {
            throw new Error(`${fieldName} should be an array.`);
          }
          return parsedArray;
        } catch (error) {
          throw new Error(`Invalid ${fieldName} format.`);
        }
      };

      let amenitiesArray = amenities ? parseArrayField(amenities, 'amenities') : [];
      let spaceArray = space ? parseArrayField(space, 'space') : [];
      let outsideAlcoholArray = outsideAlcohol ? parseArrayField(outsideAlcohol, 'outsideAlcohol') : [];
      let djPolicyArray = djPolicy ? parseArrayField(djPolicy, 'djPolicy') : [];

      // Validate numeric fields
      const vegPrice = Number(vegPlatePrice);
      const nonVegPrice = Number(nonvegPlatePrice);
      const accommodationNumber = Number(accommodation);
      const roomPriceNumber = roomPrice ? Number(roomPrice) : null;
      const venueEstbNumber = Number(venueEstb);

      if (
        isNaN(vegPrice) ||
        isNaN(nonVegPrice) ||
        isNaN(accommodationNumber) ||
        isNaN(venueEstbNumber) ||
        (roomPrice && isNaN(roomPriceNumber))
      ) {
        return res.status(400).json({
          msg: 'Numeric fields (plate prices, accommodation, venue establishment year, and room price) must be valid numbers.',
        });
      }


      let parsedLocation;
      try {
        parsedLocation = JSON.parse(location);
        if (
          typeof parsedLocation !== 'object' ||
          !parsedLocation.address ||
          !parsedLocation.city ||
          !parsedLocation.state
        ) {
          throw new Error();
        }
      } catch (error) {
        return res.status(400).json({
          msg: 'Invalid location format. Location should be a JSON object with address, city, and state fields.',
        });
      }

      // Check if images are uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ msg: 'At least one image is required' });
      }

      // Upload images to GitHub and collect their URLs
      const imageUrls = [];
      for (const file of req.files) {
        const timestamp = Date.now();
        const filePath = `halls/${timestamp}-${file.originalname}`;
        const content = file.buffer.toString('base64');

        try {
          // Push the file to GitHub
          await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: filePath,
            message: `Add image: ${file.originalname}`,
            content,
            branch: GITHUB_BRANCH,
          });

          // Generate the raw URL for the uploaded image
          const imageUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${filePath}`;
          imageUrls.push(imageUrl);
        } catch (error) {
          console.error('GitHub upload error:', error.response?.data || error.message);
          // Log the error but continue with the next file
        }
      }

      // Ensure at least one image URL was successfully uploaded
      if (imageUrls.length === 0) {
        return res.status(500).json({ msg: 'Failed to upload images to GitHub' });
      }

      // Create a new hall entry in the database
      const hall = new Hall({
        name,
        description,
        imagesUrl: imageUrls,
        accommodation: accommodationNumber,
        amenities: amenitiesArray,
        vegPlatePrice: vegPrice,
        nonvegPlatePrice: nonVegPrice,
        cateringPolicy,
        decorPolicy,
        space: spaceArray,
        roomPrice: roomPriceNumber, // Optional field
        venueEstb: venueEstbNumber,
        outsideAlcohol: outsideAlcoholArray,
        djPolicy: djPolicyArray,
        owner: ownerId,
        phone,
        location: parsedLocation,
      });

      await hall.save();

      res.status(201).json({ msg: 'Hall onboarded successfully', hall });
    } catch (err) {
      console.error('Server error:', err.message);
      res.status(500).json({ msg: 'Internal server error', error: err.message });
    }
  }
);

module.exports = router;
