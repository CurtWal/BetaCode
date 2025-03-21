const express = require("express");
const router = express.Router();
const TherapistAssignment = require("../model/AssignTherapist");
const Booking = require("../model/bookings");
const User = require("../model/user"); // Assuming User model contains therapist data
const nodemailer = require("nodemailer");
const axios = require("axios");
const sgMail = require("@sendgrid/mail");

const checkZipDistance = async (zip1, zip2, maxDistance) => {
  const API_KEY = process.env.GEO_CODIO_API;
  try {
    const [loc1, loc2] = await Promise.all([
      axios.get(
        `https://api.geocod.io/v1.7/geocode?q=${zip1}&api_key=${API_KEY}`
      ),
      axios.get(
        `https://api.geocod.io/v1.7/geocode?q=${zip2}&api_key=${API_KEY}`
      ),
    ]);

    const { lat: lat1, lng: lon1 } = loc1.data.results[0].location;
    const { lat: lat2, lng: lon2 } = loc2.data.results[0].location;

    return getDistance(lat1, lon1, lat2, lon2) <= maxDistance;
  } catch (error) {
    console.error("Error fetching ZIP code data:", error);
    return false;
  }
};

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 0.621371;
};

// Assign therapist to a booking
router.post("/assign-therapist", async (req, res) => {
  try {
    const { bookingId, therapistId } = req.body;

    // Check if the booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check how many therapists are already assigned
    const assignedCount = await TherapistAssignment.countDocuments({
      bookingId,
    });

    if (assignedCount >= booking.therapist) {
      return res
        .status(400)
        .json({ message: "Booking already has enough therapists assigned" });
    }

    // Prevent duplicate assignments
    const existingAssignment = await TherapistAssignment.findOne({
      bookingId,
      therapistId,
    });
    if (existingAssignment) {
      return res
        .status(400)
        .json({ message: "Therapist already assigned to this booking" });
    }

    // Assign therapist
    const assignment = new TherapistAssignment({ bookingId, therapistId });
    await assignment.save();

    // Calculate remaining spots dynamically
    const remainingSpots = booking.therapist - assignedCount - 1;

    // Fetch all therapists within allowed distance
    const therapists = await User.find(
      { role: "therapist" },
      "email _id zipCode"
    );
    const assignedTherapists = await TherapistAssignment.find({ bookingId });
    const assignedTherapistIds = assignedTherapists.map((t) =>
      t.therapistId.toString()
    );

    const remainingTherapists = [];
    for (const therapist of therapists) {
      if (
        !assignedTherapistIds.includes(therapist._id.toString()) &&
        (await checkZipDistance(booking.zipCode, therapist.zipCode, 92))
      ) {
        remainingTherapists.push(therapist.email);
      }
    }

    let emailSent = false;

    if (remainingTherapists.length > 0) {
      try {
        const msg = {
          to: remainingTherapists, // Array of emails
          from: process.env.EMAIL_USER, // Must be a verified sender in SendGrid
          subject: "Booking Spot Still Available!",
          html: `
                <h2>Booking Spots Are Filling Up!</h2>
                <p>A booking still has available therapist spots.</p>
                <p><strong>Company Name:</strong> ${booking.companyName}</p>
                <p><strong>Client Name:</strong> ${booking.name}</p>
                <p><strong>Location:</strong> ${booking.address}</p>
                <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
                <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
                <p><strong>Increment:</strong> ${booking.eventIncrement} minutes</p>
                <p><strong>Remaining Spots:</strong> ${remainingSpots}</p>
                <p>Hurry up and claim your spot before it's full!</p>
            `,
        };

        await sgMail.send(msg); // Sends to multiple recipients
        emailSent = true;
      } catch (error) {
        console.error(`Error sending email: ${error}`);
      }
    }

    res.json({
      message: "Therapist assigned successfully",
      assignment,
      remainingSpots,
      emailSent,
    });
  } catch (error) {
    console.error("Error assigning therapist:", error);
    res.status(500).json({ message: "Error assigning therapist", error });
  }
});

router.post("/send-email-on-spot-fill", async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Check if the booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check assigned therapist count
    const assignedCount = await TherapistAssignment.countDocuments({
      bookingId,
    });
    const remainingSpots = booking.therapist - assignedCount;

    if (remainingSpots > 0) {
      return res
        .status(400)
        .json({ message: "Spots are not filled yet. Can't send email." });
    }

    // Fetch assigned therapist details
    const assignedTherapists = await TherapistAssignment.find({
      bookingId,
    }).populate("therapistId", "username email phoneNumber");

    // Collect therapist info
    const therapistInfo = assignedTherapists
      .map((t) => {
        return `<li>${t.therapistId.username} - ${t.therapistId.email} - ${t.therapistId.phoneNumber}</li>`;
      })
      .join("");

    const finalEmailOptions = {
      from: process.env.EMAIL_USER, // Your email (verified sender)
      to: ["curtrickwalton@gmail.com"], // Same email for sending & receiving     // Adding your email as replyTo
      subject: "All Therapist Spots Have Been Filled!",
      html: `
            <h2>All Therapist Spots Have Been Filled!</h2>
            <p>Good news! All therapist spots for your booking have been successfully filled.</p>
            <p><strong>Booking Details:</strong></p>
            <p><strong>Company Name:</strong> ${booking.companyName}</p>
            <p><strong>Client Name:</strong> ${booking.name}</p>
            <p><strong>Location:</strong> ${booking.address}</p>
            <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
            <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
            <p><strong>Increment:</strong> ${booking.eventIncrement} minutes</p>
            <p><strong>Price:</strong> $${booking.price}</p>
            <ul>${therapistInfo}</ul>
            <p>Thank you for using our service!</p>
        `,
      headers: {
        "X-Sent-Using": "SendGrid",
        "X-Source": "MassageOnTheGo",
      },
    };

    await sgMail.sendMultiple(finalEmailOptions);
    // console.log(`Email sent to client for booking ${booking._id}`);

    res.json({ message: "Email sent to the client with therapist details" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Error sending email", error });
  }
});

router.post("/leave-booking", async (req, res) => {
  try {
    const { bookingId, therapistId } = req.body;

    // Find the therapist assignment
    const assignment = await TherapistAssignment.findOneAndDelete({
      bookingId,
      therapistId,
    });

    if (!assignment) {
      return res
        .status(404)
        .json({ message: "Therapist not assigned to this booking" });
    }

    // Fetch the booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Find all therapists within distance who are not assigned yet
    const therapists = await User.find(
      { role: "therapist" },
      "email _id zipCode"
    );
    const assignedTherapists = await TherapistAssignment.find({ bookingId });
    const assignedTherapistIds = assignedTherapists.map((t) =>
      t.therapistId.toString()
    );

    const assignedCount = await TherapistAssignment.countDocuments({
      bookingId,
    });

    if (assignedCount >= booking.therapist) {
      return res
        .status(400)
        .json({ message: "Booking already has enough therapists assigned" });
    }
    const remainingSpots = booking.therapist - assignedCount;
    const remainingTherapists = [];
    for (const therapist of therapists) {
      if (
        !assignedTherapistIds.includes(therapist._id.toString()) &&
        (await checkZipDistance(booking.zipCode, therapist.zipCode, 92))
      ) {
        remainingTherapists.push(therapist.email);
      }
    }

    // Notify therapists about the open spot
    if (remainingTherapists.length > 0) {
      try {
        const msg = {
          to: remainingTherapists,
          from: process.env.EMAIL_USER,
          subject: "A Therapist Spot Just Opened Up!",
          html: `
            <h2>A therapist has left a booking.</h2>
            <p>A booking now has an available therapist spot.</p>
             <p><strong>Company Name:</strong> ${booking.companyName}</p>
                <p><strong>Client Name:</strong> ${booking.name}</p>
                <p><strong>Location:</strong> ${booking.address}</p>
                <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
                <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
                <p><strong>Increment:</strong> ${booking.eventIncrement} minutes</p>
            <p><strong>Remaining Spots:</strong> ${remainingSpots}</p>
            
          `,
        };

        await sgMail.send(msg);
      } catch (error) {
        console.error(`Error sending email: ${error}`);
      }
    }

    // Send confirmation email to therapist who left
    const therapist = await User.findById(therapistId);
    if (therapist) {
      const leaveMsg = {
        to: "curtrickwalton@gmail.com",
        from: process.env.EMAIL_USER,
        subject: "Therapist Has Left a Booking",
        html: `
          <h4>Name: ${therapist.username}</h4>
          <h4>Email: ${therapist.email}</h4>
          <h4>Phone Number: ${therapist.phoneNumber}</h4>
          <p><strong>Booking Details:</strong></p>
          <p><strong>Company Name:</strong> ${booking.companyName}</p>
          <p><strong>Client Name:</strong> ${booking.name}</p>
          <p><strong>Location:</strong> ${booking.address}</p>
          <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
          <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
          <p><strong>Increment:</strong> ${booking.eventIncrement} minutes</p>
          <p><strong>Price:</strong> $${booking.price}</p>
        `,
      };
      await sgMail.send(leaveMsg);
    }

    res.json({
      message: "Therapist successfully removed and notifications sent.",
    });
  } catch (error) {
    console.error("Error removing therapist:", error);
    res.status(500).json({ message: "Error removing therapist", error });
  }
});
module.exports = router;
