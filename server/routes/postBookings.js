express = require("express");
const bookings = require("../model/bookings");
const nodemailer = require("nodemailer");
const User = require("../model/user");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
const router = express.Router();
const axios = require("axios");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_KEY);

const checkZipDistance = async (zip1, zip2, maxDistance) => {
  const API_KEY = process.env.GEO_CODIO_API; // Ensure your API key is correct
  try {
    const [loc1, loc2] = await Promise.all([
      axios.get(
        `https://api.geocod.io/v1.7/geocode?q=${zip1}&api_key=${API_KEY}`
      ),
      axios.get(
        `https://api.geocod.io/v1.7/geocode?q=${zip2}&api_key=${API_KEY}`
      ),
    ]);

    // console.log("Geocodio Response 1:", loc1.data);
    // console.log("Geocodio Response 2:", loc2.data);

    if (!loc1.data.results.length || !loc2.data.results.length) {
      console.error("Invalid ZIP code response");
      return false;
    }

    const { lat: lat1, lng: lon1 } = loc1.data.results[0].location;
    const { lat: lat2, lng: lon2 } = loc2.data.results[0].location;

    return getDistance(lat1, lon1, lat2, lon2) <= maxDistance;
  } catch (error) {
    console.error(
      "Error fetching ZIP code data:",
      error.response?.data || error.message
    );
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

router.post("/new-booking", async (req, res) => {
  try {
    const {
      companyName,
      name,
      email,
      address,
      zipCode,
      therapist,
      eventHours,
      eventIncrement,
      price,
      payType,
      startToEnd,
    } = req.body;

    // Save booking in the database
    const newBooking = await bookings.create({
      companyName,
      name,
      email,
      address,
      zipCode,
      therapist,
      eventHours,
      eventIncrement,
      price, // Use the price passed from frontend (final price after discounts)
      payType,
      startToEnd,
    });
    const confirmationLink = `https://motgpayment.com/confirm-booking/${newBooking._id}`;

    // Set up email transporter
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: ["hello@massageonthegomemphis.com"], // Change to actual email recipients
      subject: "New Massage Booking Confirmation",
      html: `
            <h2>New Booking Details</h2>
            <p><strong>Price:</strong> $${newBooking.price} ${payType}</p>
            <p><strong>Company Name:</strong> ${newBooking.companyName}</p>
            <p><strong>Name:</strong> ${newBooking.name}</p>
            <p><strong>Email:</strong> ${newBooking.email}</p>
            <p><strong>Address:</strong> ${newBooking.address}</p>
            <p><strong>ZipCode:</strong> ${newBooking.zipCode}</p>
            <p><strong>Therapist:</strong> ${newBooking.therapist}</p>
            <p><strong>Hours:</strong> ${newBooking.eventHours} hour(s)</p>
            <p><strong>Increment:</strong> ${newBooking.eventIncrement} minutes</p>
            <p><strong>Start and End Time:</strong> ${newBooking.startToEnd}</p>
            <br />
            <a href="${confirmationLink}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background: #007bff; text-decoration: none; border-radius: 5px;">Mark Booking as Ready</a>
          `,
    };

    // Send email
    await sgMail
      .send(mailOptions)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });

    res.status(200).json({ message: "Booking confirmed and email sent!" });
  } catch (err) {
    console.error("Error processing booking:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/confirm-booking/:id", async (req, res) => {
  try {
    const booking = await bookings.findById(req.params.id);
    if (!booking) {
      return res.status(404).send("Booking not found");
    }

    const therapists = await User.find(
      { role: "therapist" },
      "email phoneNumber zipCode"
    );
    if (!therapists.length) {
      return res.status(404).send("No therapists found in the database.");
    }

    const maxDistance = 92; // Define max distance in miles
    const eligibleTherapists = [];

    for (const therapist of therapists) {
      if (
        await checkZipDistance(booking.zipCode, therapist.zipCode, maxDistance)
      ) {
        eligibleTherapists.push(therapist.email);
      }
    }

    if (!eligibleTherapists.length) {
      return res.status(404).send("No therapists available within range.");
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: eligibleTherapists,
      subject: "Booking is Ready for Processing",
      html: `
                <h2>Booking is Ready</h2>
                <p>The following booking is now ready:</p>
                <p><strong>Company Name:</strong> ${booking.companyName}</p>
                <p><strong>Name:</strong> ${booking.name}</p>
                <p><strong>Email:</strong> ${booking.email}</p>
                <p><strong>Address:</strong> ${booking.address}</p>
                <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
                <p><strong>Therapist:</strong> ${booking.therapist}</p>
                <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
                <p><strong>Increment:</strong> ${booking.eventIncrement} minutes</p>
                <p><strong>Start and End Time:</strong> ${booking.startToEnd}</p>
                <br />
                <p>Log in to view and accept the booking.</p>
            `,
    };
    await sgMail
      .sendMultiple(mailOptions)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });
    // await transporter.sendMail(mailOptions);
    res.send(
      "Booking marked as ready. Notification sent to eligible therapists."
    );
  } catch (err) {
    console.error("Error confirming booking:", err);
    res.status(500).send("Internal Server Error");
  }
});
module.exports = router;
