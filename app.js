const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/User");
const { generateToken } = require("./utils/jwt");
const { authMiddleware, roleMiddleware } = require("./middleware/auth");
const ownerRoutes = require("./routes/ownerRoutes");
const ownerHallsRoutes = require("./routes/allHalls");
const deleteHall = require("./routes/deleteHall");
const updateHall = require("./routes/updateHall");
const issueReq = require("./routes/issueReqUser");
const visitReq = require("./routes/visitRequest");
const listAllReq = require("./routes/listAllReqOwner");
const resByOwner = require("./routes/responseByOwner");
const listAllHalls = require("./routes/listAllHalls");
const hallDetail = require("./routes/hallDetail");
const reviewRoute = require("./routes/reviews");
const ratingRoute = require("./routes/ratingRoutes");
const resetPwdRoute = require("./routes/resetPwdRoute");
const nodemailer = require("nodemailer");
const isSuperAdmin = require('./middleware/isSuperAdmin'); 
const promotionalEmail = require('./routes/promotionalEmail');
const blogRoutes = require("./routes/blogRoutes");
const chatbot = require("./routes/chatbot");
const booking = require("./routes/booking");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const cors = require("cors"); // Import CORS middleware

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware for parsing JSON request bodies
app.use(express.json());

// Enable CORS for specific frontend (React app) URL
app.use(
  cors({
    origin: "https://halldekho.vercel.app", // Allow requests from the frontend React app
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Mongoose connection setup
mongoose.connection
  .once("open", () => {
    console.log("Mongoose connected to database");
  })
  .on("error", (err) => {
    console.error("Mongoose connection error:", err);
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
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if connection fails
  }
};

// Signup Route
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const newUser = await User.createUser(name, email, password, role);

    // Generate JWT token
    const token = generateToken(newUser);

    let redirectUrl = "/all-halls"; // Default redirect
    if (role === "owner") {
      redirectUrl = "/add-property";
    }

    // Send Welcome Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL, // Your email
        pass: process.env.EMAIL_PASSWORD, // Your email password
      },
    });

    // Role-based greeting
    const greeting = role === "owner" ? "Hi, Owner" : "Hi, User";

    const mailOptions = {
      from: '"Hall Dekho Support" <your-email@gmail.com>',
      to: email,
      subject: "Welcome to Hall Dekho!",
      html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
    <img src="https://raw.githubusercontent.com/halldekho/carousel-images/master/halls/halldekho-high-resolution-logo.png" alt="Welcome to Hall Dekho" style="width: 100%; border-radius: 10px 10px 0 0;" />
    <div style="padding: 20px;">
      <h1 style="color: #333; text-align: center;">${greeting}!</h1>
      <p style="font-size: 16px; color: #555; text-align: center;">
        Welcome to Hall Dekho! We're thrilled to have you on board. Our platform is designed to make finding or listing event halls easier than ever.
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <div style="margin-bottom: 10px;">
          <a href="${
            process.env.FRONTEND_URL
          }/all-halls" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px;">Browse Halls</a>
        </div>
        ${
          role === "owner"
            ? `<div style="margin-bottom: 10px;">
                 <a href="${process.env.FRONTEND_URL}/add-property" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px;">List Your Hall</a>
               </div>`
            : ""
        }
      </div>
      <p style="font-size: 16px; color: #555; text-align: center;">
        If you have any questions or need assistance, do not hesitate to reach out. Our team is here to support you and ensure you have the best experience with Hall Dekho.
      </p>
      <p style="text-align: center; color: #888; font-size: 14px;">
        Thank you,<br />
        <strong>Hall Dekho Team</strong>
      </p>
    </div>
  </div>
`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(201).json({
      msg: "User registered successfully",
      token,
      redirectUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Login Route

// app.post("/login",isSuperAdmin, async (req, res) => {
//   try {

//     console.log('Login Route:', req.user);

//     // If the user is superadmin, handle the superadmin login
//     if (req.user && req.user.role === 'superadmin') {
//       const token = generateToken({ email: req.user.email, role: req.user.role });
//       return res.status(200).json({
//         msg: "Login successful",
//         token,
//         redirectUrl: "/superadmin", // Redirect to super admin page
//       });
//     }

//     const { email, password } = req.body;

//     const user = await User.findUserByEmail(email);
//     if (!user) {
//       return res.status(400).json({ msg: "User not found" });
//     }

//     // Check password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ msg: "Invalid credentials" });
//     }

//     const token = generateToken(user);

//     let redirectUrl = "/all-halls";
//     if (user.role === "owner") {
//       redirectUrl = "/add-property";
//     }

//     res.status(200).json({
//       msg: "Login successful",
//       token,
//       redirectUrl,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Server error" });
//   }
// });
















app.post("/login", isSuperAdmin, async (req, res) => {
  try {
    // ✅ Super Admin Login
    if (req.user && req.user.role === "superadmin") {
      const superAdminId = process.env.SUPER_ADMIN_ID;

      if (!superAdminId || !mongoose.Types.ObjectId.isValid(superAdminId)) {
        return res.status(500).json({ msg: "SUPER_ADMIN_ID is missing or invalid" });
      }

      const token = generateToken({
        _id: new mongoose.Types.ObjectId(superAdminId),
        role: req.user.role,
        email: req.user.email,
      });

      return res.status(200).json({
        msg: "Super Admin login successful",
        token,
        redirectUrl: "/superadmin",
      });
    }

    // ✅ Normal User Login
    const { email, password } = req.body;

    const user = await User.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = generateToken(user);

    let redirectUrl = "/all-halls";
    if (user.role === "owner") {
      redirectUrl = "/add-property";
    }

    res.status(200).json({
      msg: "Login successful",
      token,
      redirectUrl,
    });

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});




















// Dashboard Routes
app.get(
  "/dashboard/consumer",
  authMiddleware,
  roleMiddleware("consumer"),
  (req, res) => {
    res.send("Welcome to the Consumer Dashboard");
  }
);

app.get(
  "/dashboard/owner",
  authMiddleware,
  roleMiddleware("owner"),
  (req, res) => {
    res.send("Welcome to the Owner Dashboard");
  }
);

// Owner Routes (Onboard Hall)
app.use("/owner", ownerRoutes); // Protect all routes under /owner

// list all halls - owner
app.use("/owner", ownerHallsRoutes); // Apply ownerHallsRoutes under '/owner' path

// delete a particular hall - owner
app.use("/owner/delete-hall", deleteHall);

// update details of a particular hall - owner
app.use("/owner", updateHall);

// list all req by owner - owner
app.use("/owner", listAllReq);

// response by owner - owner
app.use("/owner", resByOwner);

//AI chatbot
app.use("/user", chatbot);

//Hall Booking
app.use("/user", booking);

// issue req by user - user
app.use("/user", issueReq);

// visit req by user - user
app.use("/user", visitReq);

// list all halls - user
app.use("/user", listAllHalls);

//review route - user
app.use("/user", reviewRoute);

//rating route - user
app.use("/user", ratingRoute);

// hall detail
app.use("/user", hallDetail);

// reset password
app.use("/", resetPwdRoute);

//super admin route - promotional emails
app.use('/super-admin', promotionalEmail);

//super admin route - blog creation
app.use('/super-admin', blogRoutes);


// Route not found handler
app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

// Connect to DB and start server
connectToDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
