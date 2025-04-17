express = require("express");
const bookings = require("../model/bookings");
const nodemailer = require("nodemailer");
const User = require("../model/user");
const router = express.Router();
const axios = require("axios");
const sgMail = require("@sendgrid/mail");
const twilio = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const PhoneNumber = process.env.TWILIO_NUMBER;
const client = twilio(accountSid, authToken);
sgMail.setApiKey(process.env.SENDGRID_KEY);

const formData = require("form-data");
const Mailgun = require("mailgun.js");

const checkLocationDistance = (lat1, lon1, lat2, lon2, maxMiles) => {
  const toRad = (deg) => deg * Math.PI / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c <= maxMiles;
};
const convertTo12Hour = (time) => {
  if (!time) return ""; // Handle empty or undefined values
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12AM
  return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
};

// const sendEmailsInBatches = async (recipients, subject, htmlContent, batchSize = 10, delayMs = 5000) => {
//   for (let i = 0; i < recipients.length; i += batchSize) {
//     const batch = recipients.slice(i, i + batchSize);

//     try {
//       const msg = {
//         to: batch, // Sending to batch of emails
//         from: process.env.EMAIL_USER,
//         subject: subject,
//         html: htmlContent,
//       };

//       await sgMail.sendMultiple(msg);
//       console.log(`Batch sent to ${batch.length} therapists`);

//     } catch (error) {
//       console.error(`Error sending batch: ${error}`);
//     }

//     // Wait before sending the next batch
//     if (i + batchSize < recipients.length) {
//       await new Promise((resolve) => setTimeout(resolve, delayMs));
//     }
//   }
// };
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
      startTime,
      endTime,
      date,
      extra,
    } = req.body;

    const geoRes = await axios.get(
      `https://api.geocod.io/v1.7/geocode?q=${zipCode}&api_key=${process.env.GEO_CODIO_API}`
    );
    const location = geoRes?.data?.results?.[0]?.location || null;

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
      startTime,
      endTime,
      extra,
      date,
      confirmed: false,
      location,
    });
    const confirmationLink = `https://motgpayment.com/confirm-booking/${newBooking._id}`;

    // Set up email transporter
    const mg = new Mailgun(formData);
    const mailgun = mg.client({
      username: "api",
      key: process.env.MAILGUN_KEY, // Add this to your .env file // Default Mailgun API URL
    });
    try {
      const emailData = {
        from: process.env.EMAIL_USER, // Must be a verified Mailgun sender
        to: ["hello@massageonthegomemphis.com", "sam@massageonthegomemphis.com"], // Recipient email
        subject: "New Massage Booking Confirmation",
        html: `<h2>New Booking Details</h2>
            <p><strong>Price:</strong> $${newBooking.price} ${payType}</p>
            <p><strong>Company Name:</strong> ${newBooking.companyName}</p>
            <p><strong>Name:</strong> ${newBooking.name}</p>
            <p><strong>Email:</strong> ${newBooking.email}</p>
            <p><strong>Address:</strong> ${newBooking.address}</p>
            <p><strong>ZipCode:</strong> ${newBooking.zipCode}</p>
            <p><strong>Therapist:</strong> ${newBooking.therapist}</p>
            <p><strong>Hours:</strong> ${newBooking.eventHours} hour(s)</p>
            <p><strong>Increment:</strong> ${
              newBooking.eventIncrement
            } minutes</p>
            <p><strong>Available Date:</strong> ${newBooking.date}</p>
            <p><strong>Start Time:</strong> ${convertTo12Hour(
              newBooking.startTime
            )}</p>
            <p><strong>End Time:</strong> ${convertTo12Hour(
              newBooking.endTime
            )}</p>
            <p><strong>Extra Info:</strong> ${newBooking.extra}</p>
            <br />
            <a href="${confirmationLink}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background: #007bff; text-decoration: none; border-radius: 5px;">Mark Booking as Ready / Update</a>
          `,
        "h:X-Sent-Using": "Mailgun",
        "h:X-Source": "MassageOnTheGo",
      };

      const response = await mailgun.messages.create(
        "motgpayment.com", // Your Mailgun domain (e.g., "mg.yourdomain.com")
        emailData
      );

      console.log("Mailgun Response:", response);
    } catch (error) {
      console.error("Error sending email via Mailgun:", error);
    }
    // const mailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: ["curtrickwalton@gmail.com"], // Change to actual email recipients
    //   subject: "New Massage Booking Confirmation",
    //   html: `
    //         <h2>New Booking Details</h2>
    //         <p><strong>Price:</strong> $${newBooking.price} ${payType}</p>
    //         <p><strong>Company Name:</strong> ${newBooking.companyName}</p>
    //         <p><strong>Name:</strong> ${newBooking.name}</p>
    //         <p><strong>Email:</strong> ${newBooking.email}</p>
    //         <p><strong>Address:</strong> ${newBooking.address}</p>
    //         <p><strong>ZipCode:</strong> ${newBooking.zipCode}</p>
    //         <p><strong>Therapist:</strong> ${newBooking.therapist}</p>
    //         <p><strong>Hours:</strong> ${newBooking.eventHours} hour(s)</p>
    //         <p><strong>Increment:</strong> ${newBooking.eventIncrement} minutes</p>
    //         <p><strong>Available Date:</strong> ${newBooking.date}</p>
    //         <p><strong>Start Time:</strong> ${convertTo12Hour(newBooking.startTime)}</p>
    //         <p><strong>End Time:</strong> ${convertTo12Hour(newBooking.endTime)}</p>
    //         <p><strong>Extra Info:</strong> ${newBooking.extra}</p>
    //         <br />
    //         <a href="${confirmationLink}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background: #007bff; text-decoration: none; border-radius: 5px;">Mark Booking as Ready</a>
    //       `,
    // };

    // // Send email
    // await sgMail
    //   .send(mailOptions)
    //   .then(() => {
    //     console.log("Email sent");
    //   })
    //   .catch((error) => {
    //     console.error(error);
    //   });

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
    if (booking.confirmed) {
      return res.status(200).json({
        message: "Booking already confirmed. No notifications re-sent.",
      });
    }

    booking.confirmed = true;
    await booking.save();

    const therapists = await User.find(
      { role: "therapist" },
      "email phoneNumber zipCode location"
    );

    if (!therapists.length) {
      return res.status(404).send("No therapists found");
    }

    const maxDistance = 92;
    const eligibleTherapists = [];
    console.log("Therapists:", therapists);
    for (const therapist of therapists) {
      console.log("Booking Location:", booking.location);
  console.log("Therapist Location:", therapist.location);
      const inRange = checkLocationDistance(
        booking.location.lat,
        booking.location.lng,
        therapist.location.lat,
        therapist.location.lng,
        92
      );
      if (inRange) eligibleTherapists.push(therapist);
    }
    console.log("Therapist", eligibleTherapists)
    if (!eligibleTherapists.length) {
      return res.status(404).send("No therapists in range");
    }

    // Mailgun Setup
    const mg = new Mailgun(formData);
    const mailgun = mg.client({
      username: "api",
      key: process.env.MAILGUN_KEY,
    });

    // Send emails in batches
    const emailList = eligibleTherapists.map((t) => t.email);
    const sendEmailsInBatches = async (
      emails,
      batchSize = 5,
      delayMs = 3000
    ) => {
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);

        const response = await Promise.all(
          batch.map((email) =>
            mailgun.messages.create("motgpayment.com", {
              from: process.env.EMAIL_USER,
              to: email,
              subject: "Booking is Ready for Processing",
              html: `<h2>Booking is Ready</h2>
                <p><strong>Company:</strong> ${booking.companyName}</p>
                <p><strong>Client:</strong> ${booking.name}</p>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Start:</strong> ${convertTo12Hour(
                  booking.startTime
                )}</p>
                <p><strong>End:</strong> ${convertTo12Hour(booking.endTime)}</p>
                <p><strong>Address:</strong> ${booking.address}</p>
                <p>Log in to accept this booking.</p>`,
            })
          )
        );

        console.log("Mailgun Batch Response:", response);

        if (i + batchSize < emails.length) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    };

    await sendEmailsInBatches(emailList);
    console.log("✅ Finished sending emails");

    // --- SMS Part --- //
    const phoneNumbers = eligibleTherapists
      .map((t) => t.phoneNumber)
      .filter((num) => !!num)
      .map((num) => (num.startsWith("+") ? num : `+1${num}`)); // Format check

    console.log("📱 Sending SMS to:", phoneNumbers);

    const smsResults = [];

    for (const number of phoneNumbers) {
      const message = await client.messages.create({
        body: `📢 Booking available from ${booking.companyName}. Log in to accept.`,
        from: PhoneNumber, // Make sure this is defined above
        to: number,
      });

      console.log(`SMS sent to ${number}: SID ${message.sid}`);
      smsResults.push({ number, sid: message.sid });
    }

    // ✅ Final unified response
    res.status(200).json({
      message: "Booking confirmed, emails and SMS sent.",
      emailsSent: emailList.length,
      smsSent: smsResults.length,
    });
  } catch (err) {
    console.error("🔥 Error in /confirm-booking:", err);
    res.status(500).send("Internal Server Error");
  }
});
module.exports = router;
