express = require('express');
const bookings = require('../model/bookings');
const nodemailer = require("nodemailer");
const User = require('../model/user');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const router = express.Router();


router.post('/new-booking', async (req, res) => {
    try {
        // Save booking in the database
        const newBooking = await bookings.create(req.body);
        const confirmationLink = `https://massageonthego.netlify.app/confirm-booking/${newBooking._id}`;

        // Set up email transporter
        const transporter = nodemailer.createTransport({
          service: "yahoo",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
    
        // Email content
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: ["curtrickwalton@gmail.com"], // Change to actual email recipients
          subject: "New Massage Booking Confirmation",
          html: `
            <h2>New Booking Details</h2>
            <p><strong>Price:</strong> $${newBooking.price}</p>
            <p><strong>Name:</strong> ${newBooking.name}</p>
            <p><strong>Email:</strong> ${newBooking.email}</p>
            <p><strong>Address:</strong> ${newBooking.address}</p>
            <p><strong>ZipCode:</strong> ${newBooking.zipCode}</p>
            <p><strong>Therapist:</strong> ${newBooking.therapist}</p>
            <p><strong>Hours:</strong> ${newBooking.eventHours}</p>
            <p><strong>Increment:</strong> ${newBooking.eventIncrement}</p>
            <br />
            <a href="${confirmationLink}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background: #007bff; text-decoration: none; border-radius: 5px;">Mark Booking as Ready</a>
          `,
        };
    
        // Send email
        await transporter.sendMail(mailOptions);
    
        res.status(200).json({ message: "Booking confirmed and email sent!" });
      } catch (err) {
        console.error("Error processing booking:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
})

router.get('/confirm-booking/:id', async (req, res) => {
    try {
        const booking = await bookings.findById(req.params.id);
        if (!booking) {
            return res.status(404).send("Booking not found");
        }

        const therapists = await User.find({ role: "therapist" }, "email phoneNumber");
        if (!therapists.length) {
            return res.status(404).send("No therapists found in the database.");
        }

        const therapistEmails = therapists.map(therapist => therapist.email);
        // const therapistNumbers = therapists.map(t => t.phoneNumber).filter(Boolean);
        console.log("Therapist Emails:", therapistEmails);
        // console.log("Therapist Numbers:", therapistNumbers);

        const transporter = nodemailer.createTransport({
            service: "yahoo",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });
        // Email content for "Booking Ready"
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: therapistEmails, // Send to whoever needs to know
          subject: "Booking is Ready for Processing",
          html: `
            <h2>Booking is Ready</h2>
            <p>The following booking is now ready:</p>
            <p><strong>Name:</strong> ${booking.name}</p>
            <p><strong>Email:</strong> ${booking.email}</p>
            <p><strong>Address:</strong> ${booking.address}</p>
            <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
            <p><strong>Therapist:</strong> ${booking.therapist}</p>
            <p><strong>Hours:</strong> ${booking.eventHours}</p>
            <p><strong>Increment:</strong> ${booking.eventIncrement}</p>
            <br />
            <p>Log in to view and accept the booking.</p>
          `,
        };
        await transporter.sendMail(mailOptions);
        res.send("Booking marked as ready. Notification sent to all therapists.");
    } catch (err) {
        console.error("Error confirming booking:", err);
        res.status(500).send("Internal Server Error");
    }
});
module.exports = router;