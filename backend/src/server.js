const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const ownerRoutes = require('../routes/ownerRoutes'); 
const ownerHallsRoutes = require('../routes/allHalls')
const deleteHall = require('../routes/deleteHall')
const updateHall = require('../routes/updateHall')
const issueReq = require('../routes/issueReqUser')
const listAllReq = require('../routes/listAllReqOwner')
const resByOwner = require('../routes/responseByOwner')
const listAllHalls = require('../routes/listAllHalls')
const hallDetail = require('../routes/hallDetail')
const reviewRoute = require('../routes/reviews')
const ratingRoute = require('../routes/ratingRoutes')
require('dotenv').config();

const bcrypt = require('bcryptjs');
const cors = require('cors'); // Import CORS middleware

const app = express();

const PORT = 5000;

// Middleware for parsing JSON request bodies
app.use(express.json());

// Enable CORS for specific frontend (React app) URL
app.use(cors({
  origin: 'https://halldekho.vercel.app', // Allow requests from the frontend React app
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Mongoose connection setup
mongoose.connection.once('open', () => {
  console.log('Mongoose connected to database');
}).on('error', (err) => {
  console.error('Mongoose connection error:', err);
  process.exit(1); // Exit the process if there is an issue with the DB connection
});

// Connect to MongoDB
const connectToDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if connection fails
  }
};

// Signup Route
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const newUser = await User.createUser(name, email, password, role);

    // Generate JWT token
    const token = generateToken(newUser);

    let redirectUrl = '/all-halls'; // Default redirect
    if (role === 'owner') {
      redirectUrl = '/add-property';
    }

    res.status(201).json({
      msg: 'User registered successfully',
      token,
      redirectUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = generateToken(user);

    let redirectUrl = '/all-halls';
    if (user.role === 'owner') {
      redirectUrl = '/add-property';
    }

    res.status(200).json({
      msg: 'Login successful',
      token,
      redirectUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Dashboard Routes
app.get('/dashboard/consumer', authMiddleware, roleMiddleware('consumer'), (req, res) => {
  res.send('Welcome to the Consumer Dashboard');
});

app.get('/dashboard/owner', authMiddleware, roleMiddleware('owner'), (req, res) => {
  res.send('Welcome to the Owner Dashboard');
});

// Owner Routes (Onboard Hall)
app.use('/owner', ownerRoutes); // Protect all routes under /owner

// list all halls - owner
app.use('/owner', ownerHallsRoutes); // Apply ownerHallsRoutes under '/owner' path

// delete a particular hall - owner
app.use('/owner/delete-hall', deleteHall);

// update details of a particular hall - owner
app.use('/owner', updateHall);

// list all req by owner - owner
app.use('/owner', listAllReq);

// response by owner - owner
app.use('/owner', resByOwner);

// issue req by user - user
app.use('/user', issueReq);

// list all halls - user
app.use('/user', listAllHalls);

//review route - user
app.use('/user', reviewRoute);

//rating route - user
app.use('/user', ratingRoute);

// hall detail 
app.use('/user',hallDetail);

// Route not found handler
app.use((req, res) => {
  res.status(404).json({ msg: 'Route not found' });
});

// Connect to DB and start server
connectToDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
