const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const path = require("path");

const router = express.Router();
const Hall = require("../models/Hall");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");

const logoPath = path.join(__dirname, "../utils/halldekho-logo.png");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});


// ✅ POST /book-hall → Only logged-in users
router.post("/book-hall", authMiddleware, async (req, res) => {
  try {
    const { hallId, date } = req.body;
    const userId = req.user.id;
    const bookingDate = new Date(date);

    const hall = await Hall.findById(hallId).populate("owner");
    if (!hall) return res.status(404).json({ message: "Hall not found" });

    // ✅ Check if hall is already booked or shortlisted on that date
    const existingBooking = await Booking.findOne({
      hallId,
      date: {
        $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
        $lte: new Date(bookingDate.setHours(23, 59, 59, 999))
      },
      status: { $in: ["shortlisted", "confirmed"] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: "Hall already booked or shortlisted for this date" });
    }

    const booking = await Booking.create({
      userId,
      hallId,
      date: bookingDate
    });

    const owner = await User.findById(hall.owner._id);
    const user = await User.findById(userId);

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: owner.email,
      subject: `New Booking Request for ${hall.name}`,
      html: `
        <h3>Hello ${owner.name},</h3>
        <p>User <b>${user.name}</b> has shortlisted your hall <b>${hall.name}</b> for the date <b>${bookingDate.toDateString()}</b>.</p>
        <p>Please contact the user for payment externally and click the following link to confirm booking:</p>
        <a href="https://halldekho.vercel.app/confirm-booking">Confirm Booking</a>
      `
    });

    res.json({ message: "Booking shortlisted. Owner notified.", bookingId: booking._id });

  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});



// ✅ Confirm booking → only hall owner with valid token
// Updated confirmBookingHandler (POST only for owner confirmation)
const confirmBookingHandler = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const requesterId = req.user.id;
    const { paymentReceived } = req.body;

    const booking = await Booking.findById(bookingId).populate("hallId userId");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const hall = await Hall.findById(booking.hallId._id);
    if (!hall) return res.status(404).json({ message: "Hall not found" });

    if (!hall.owner.equals(requesterId)) {
      return res.status(403).json({ message: "Access denied. Only hall owner can confirm this booking." });
    }

    if (typeof paymentReceived !== "boolean") {
      return res.status(400).json({ message: "Missing or invalid 'paymentReceived' in request body." });
    }

    if (!paymentReceived) {
      booking.status = "rejected";
      await booking.save();
      // await Booking.findByIdAndDelete(bookingId);

      // Send rejection email to user
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: booking.userId.email,
        subject: `Booking Rejected for ${hall.name}`,
        html: `
          <h3>Hello ${booking.userId.name},</h3>
          <p>Your booking for <b>${hall.name}</b> on <b>${new Date(booking.date).toDateString()}</b> was <b>rejected</b> as payment was not received.</p>
          <p>You may re-book with another date or hall.</p>
          <br><p>Regards,<br>Team Halldekho</p>
        `
      });

      return res.status(200).json({ message: "Booking deleted as payment was not received." });
    }

    if (booking.status !== "confirmed") {
      booking.status = "confirmed";
      booking.paymentDone = true;
      await booking.save();

      const alreadyBooked = hall.bookedDates.some(
        d => new Date(d).toDateString() === new Date(booking.date).toDateString()
      );
      if (!alreadyBooked) {
        hall.bookedDates.push(booking.date);
        await hall.save();
      }
    }

    // Send confirmation email to user
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: booking.userId.email,
      subject: `Booking Confirmed for ${hall.name}`,
      html: `
        <h3>Hello ${booking.userId.name},</h3>
        <p>Your booking for <b>${hall.name}</b> on <b>${new Date(booking.date).toDateString()}</b> has been <b>confirmed</b>.</p>
        <p>You can download your receipt here:</p>
        <a href="https://halldekho-backend-10.onrender.com/user/confirm-booking/${booking._id}" target="_blank">Download Receipt</a>
        <br><br><p>Regards,<br>Team Halldekho</p>
      `
    });

    return res.status(200).json({ message: "Booking confirmed and user notified via email." });

  } catch (error) {
    console.error("Confirm Booking Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to confirm booking" });
    }
  }
};

// ✅ NEW: Separate GET route for PDF generation
const generateReceiptHandler = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate("hallId userId");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: "Booking is not confirmed. Cannot generate receipt." });
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = `Halldekho_Receipt_${booking._id}.pdf`;

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    const drawDivider = () => {
      doc
        .moveDown(0.5)
        .strokeColor("#cccccc")
        .lineWidth(1)
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke()
        .moveDown();
    };

    // ✅ Watermark (faint background logo)
    try {
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const watermarkSize = 300;

      doc
        .opacity(0.04)
        .image(logoPath, (pageWidth - watermarkSize) / 2, (pageHeight - watermarkSize) / 3, {
          width: watermarkSize,
        })
        .opacity(1); // Reset opacity
    } catch (e) {
      console.warn("Watermark skipped.");
    }

    // ✅ Full-width top logo
    try {
      const pageWidth = doc.page.width;
      doc.image(logoPath, 0, 0, { width: pageWidth, height: 150 });
    } catch (e) {
      console.warn("Top logo not found.");
    }

    doc.moveDown(8); 

    // ✅ Header
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#333")
      .text("Booking Receipt", { align: "center" });

    doc
      .fontSize(12)
      .fillColor("#666")
      .text(`Receipt ID: ${booking._id}`, { align: "center" })
      .text(`Issued on: ${new Date().toLocaleDateString()}`, { align: "center" });

    doc.moveDown(2);

    // ✅ Booking Details
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#000").text("Booking Details");
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#444")
      .moveDown(0.5)
      .text(`Hall Name: ${booking.hallId.name}`)
      .text(`Booking Date: ${new Date(booking.date).toDateString()}`)
      .text(`Booking Status: ✅ Confirmed`)
      .text(`Payment Mode: External (Offline)`);

    drawDivider();

    // ✅ User Details
    doc.font("Helvetica-Bold").fontSize(14).text("Booked By");
    doc
      .font("Helvetica")
      .fontSize(11)
      .moveDown(0.5)
      .text(`Name: ${booking.userId.name}`)
      .text(`Email: ${booking.userId.email}`);

    drawDivider();

    // ✅ Hall Details
    doc.font("Helvetica-Bold").fontSize(14).text("Hall Details");
    doc
      .font("Helvetica")
      .fontSize(11)
      .moveDown(0.5)
      .text(`Veg Plate Price: ₹${booking.hallId.vegPlatePrice}`)
      .text(`Non-Veg Plate Price: ₹${booking.hallId.nonvegPlatePrice}`)
      .text(`Accommodation: ${booking.hallId.accommodation} guests`)
      .text(`Amenities: ${booking.hallId.amenities?.join(", ")}`)
      .text(
        `Address: ${booking.hallId.location.address}, ${booking.hallId.location.city}, ${booking.hallId.location.state}`
      );

    drawDivider();

    // ✅ Payment Info
    doc.font("Helvetica-Bold").fontSize(14).text("Payment Summary");
    doc
      .font("Helvetica")
      .fontSize(11)
      .moveDown(0.5)
      .text("Payment Status: ✅ Confirmed")
      .text("Payment Method: Offline (Handled directly by hall owner)");

    doc.moveDown(3);

    // ✅ Footer
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#000")
      .text("Thank you for choosing Halldekho!", { align: "center" });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#555")
      .text("Need help? Contact halldekho17@gmail.com", { align: "center" })
      .text("Halldekho Registered Address: Jammu, India", { align: "center" });

    doc.end();
  } catch (error) {
    console.error("Generate Receipt Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate receipt" });
    }
  }
};



// Routes
router.post("/confirm-booking/:bookingId", authMiddleware, confirmBookingHandler);
router.get("/confirm-booking/:bookingId", generateReceiptHandler);


// check all booking request received for hall owner
// GET /user/owner-bookings → All bookings for halls listed by current owner
router.get("/owner-bookings", authMiddleware, async (req, res) => {
  try {
    const ownerId = req.user.id;
    const role = req.user.role;

    // ✅ Only allow access if user is hall owner
    if (role !== "owner") {
      return res.status(403).json({ message: "Access denied. Only hall owners can view this." });
    }

    const halls = await Hall.find({ owner: ownerId }).select("_id");
    const hallIds = halls.map(h => h._id);

    const bookings = await Booking.find({
      hallId: { $in: hallIds }
      // status: "shortlisted"
    })
      .populate("userId", "name email")
      .populate("hallId", "name");

    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Owner Booking Fetch Error:", error);
    res.status(500).json({ message: "Failed to fetch booking requests" });
  }
});



module.exports = router;
