const express = require("express");
const router = express.Router();
const TherapistAssignment = require("../model/AssignTherapist");
const Booking = require("../model/bookings");
const User = require("../model/user"); // Assuming User model contains therapist data
const nodemailer = require("nodemailer");
const axios = require("axios");
const sgMail = require("@sendgrid/mail");

const formData = require("form-data");
const Mailgun = require("mailgun.js");

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
const convertTo12Hour = (time) => {
  if (!time) return ""; // Handle empty or undefined values
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12AM
  return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
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
    //  commented out it checks to see if the booking already sent out email if so it skips sending them
    // if (booking.emailsSent) {
    //   return res.json({
    //     message:
    //       "Emails already sent for this booking, skipping email notification.",
    //     emailSent: false,
    //   });
    // }


    
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

    //  All commented out code is for sending emails to remaining therapist about remaining spots left
    // Update the assigned count
    // assignedCount++;

    // // Calculate remaining spots dynamically
    // const remainingSpots = booking.therapist - assignedCount - 1;

    // // Fetch all therapists within allowed distance
    // const therapists = await User.find(
    //   { role: "therapist" },
    //   "email _id zipCode"
    // );
    // const assignedTherapists = await TherapistAssignment.find({ bookingId });
    // const assignedTherapistIds = assignedTherapists.map((t) =>
    //   t.therapistId.toString()
    // );

    // const remainingTherapists = [];
    // for (const therapist of therapists) {
    //   if (
    //     !assignedTherapistIds.includes(therapist._id.toString()) &&
    //     (await checkZipDistance(booking.zipCode, therapist.zipCode, 92))
    //   ) {
    //     remainingTherapists.push(therapist.email);
    //   }
    // }

    // let emailSent = false;

    // if (remainingTherapists.length > 0) {
    //   const yahooEmails = remainingTherapists.filter((email) =>
    //     email.includes("@yahoo.com")
    //   );
    //   const otherEmails = remainingTherapists.filter(
    //     (email) => !email.includes("@yahoo.com")
    //   );

    //   const mg = new Mailgun(formData);
    //   const mailgun = mg.client({
    //     username: "api",
    //     key: process.env.MAILGUN_KEY, // Add this to your .env file // Default Mailgun API URL
    //   });
    //   try {
    //     // const emailData = {
    //     //   from: process.env.EMAIL_USER, // Must be a verified Mailgun sender
    //     //   to: otherEmails, // Recipient email
    //     //   subject: "Booking Spot Still Available!",
    //     //   html: `<h2>Booking Spots Are Filling Up!</h2>
    //     //         <p>A booking still has available therapist spots.</p>
    //     //         <p><strong>Company Name:</strong> ${booking.companyName}</p>
    //     //         <p><strong>Client Name:</strong> ${booking.name}</p>
    //     //         <p><strong>Location:</strong> ${booking.address}</p>
    //     //         <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
    //     //         <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
    //     //         <p><strong>Increment:</strong> ${
    //     //           booking.eventIncrement
    //     //         } minutes</p>
    //     //         <p><strong>Available Date:</strong> ${booking.date}</p>
    //     //         <p><strong>Start Time:</strong> ${convertTo12Hour(
    //     //           booking.startTime
    //     //         )}</p>
    //     //         <p><strong>End Time:</strong> ${convertTo12Hour(
    //     //           booking.endTime
    //     //         )}</p>
    //     //         <p><strong>Extra Info:</strong> ${booking.extra}</p>
    //     //         <p><strong>Remaining Spots:</strong> ${remainingSpots}</p>
    //     //         <p>Hurry up and claim your spot before it's full!</p>`,
    //     //   "h:X-Sent-Using": "Mailgun",
    //     //   "h:X-Source": "MassageOnTheGo",
    //     // };

    //     // const response = await mailgun.messages.create(
    //     //   "motgpayment.com", // Your Mailgun domain (e.g., "mg.yourdomain.com")
    //     //   emailData
    //     // );

    //     // const sendEmailsWithDelay = async (emails) => {
    //     //   for (const email of emails) {
    //     //     try {
    //     //       await mailgun.messages.create("motgpayment.com", {
    //     //         from: process.env.EMAIL_USER,
    //     //         to: email,
    //     //         subject: "Booking Spot Still Available!",
    //     //         html: `<h2>Booking Spots Are Filling Up!</h2>
    //     //         <p>A booking still has available therapist spots.</p>
    //     //         <p><strong>Company Name:</strong> ${booking.companyName}</p>
    //     //         <p><strong>Client Name:</strong> ${booking.name}</p>
    //     //         <p><strong>Location:</strong> ${booking.address}</p>
    //     //         <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
    //     //         <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
    //     //         <p><strong>Increment:</strong> ${
    //     //           booking.eventIncrement
    //     //         } minutes</p>
    //     //         <p><strong>Available Date:</strong> ${booking.date}</p>
    //     //         <p><strong>Start Time:</strong> ${convertTo12Hour(
    //     //           booking.startTime
    //     //         )}</p>
    //     //         <p><strong>End Time:</strong> ${convertTo12Hour(
    //     //           booking.endTime
    //     //         )}</p>
    //     //         <p><strong>Extra Info:</strong> ${booking.extra}</p>
    //     //         <p><strong>Remaining Spots:</strong> ${remainingSpots}</p>
    //     //         <p>Hurry up and claim your spot before it's full!</p>`,
    //     //         "h:X-Sent-Using": "Mailgun",
    //     //         "h:X-Source": "MassageOnTheGo",
    //     //       });

    //     //       console.log(`Sent to ${email}`);
    //     //       await new Promise((resolve) => setTimeout(resolve, 5000)); // 5-second delay
    //     //     } catch (error) {
    //     //       console.error(`Error sending to ${email}:`, error);
    //     //     }
    //     //   }
    //     // };
    //     // await sendEmailsWithDelay(yahooEmails);
    //     const sendEmailsInBatches = async (
    //       emails,
    //       batchSize = 5,
    //       delayMs = 3000
    //     ) => {
    //       for (let i = 0; i < emails.length; i += batchSize) {
    //         const batch = emails.slice(i, i + batchSize);

    //         try {
    //           const response = await Promise.all(
    //             batch.map((email) =>
    //               mailgun.messages.create("motgpayment.com", {
    //                 from: process.env.EMAIL_USER,
    //                 to: email,
    //                 subject: "Booking Spot Still Available!",
    //                 html: `<h2>Booking Spots Are Filling Up!</h2>
    //             <p>A booking still has available therapist spots.</p>
    //             <p><strong>Company Name:</strong> ${booking.companyName}</p>
    //             <p><strong>Client Name:</strong> ${booking.name}</p>
    //             <p><strong>Location:</strong> ${booking.address}</p>
    //             <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
    //             <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
    //             <p><strong>Increment:</strong> ${
    //               booking.eventIncrement
    //             } minutes</p>
    //             <p><strong>Available Date:</strong> ${booking.date}</p>
    //             <p><strong>Start Time:</strong> ${convertTo12Hour(
    //               booking.startTime
    //             )}</p>
    //             <p><strong>End Time:</strong> ${convertTo12Hour(
    //               booking.endTime
    //             )}</p>
    //             <p><strong>Extra Info:</strong> ${booking.extra}</p>
    //             <p><strong>Remaining Spots:</strong> ${remainingSpots}</p>
    //             <p>Hurry up and claim your spot before it's full!</p>`,
    //                 "h:X-Sent-Using": "Mailgun",
    //                 "h:X-Source": "MassageOnTheGo",
    //               })
    //             )
    //           );
    //           console.log("Mailgun Response:", response);
    //         } catch (error) {
    //           console.error("Error sending email batch:", error);
    //         }

    //         if (i + batchSize < emails.length) {
    //           await new Promise((resolve) => setTimeout(resolve, delayMs)); // Delay between batches
    //         }
    //       }
    //     };
    //     sendEmailsInBatches(remainingTherapists);
    //     emailSent = true;
    //     //console.log("Mailgun Response:", response);
    //     if (emailSent) {
    //       await Booking.findByIdAndUpdate(bookingId, { emailsSent: true });
    //     }
    //   } catch (error) {
    //     console.error("Error sending email via Mailgun:", error);
    //   }
    // }

    res.json({
      message: "Therapist assigned successfully",
      assignment,
      remainingSpots: booking.therapist - (assignedCount + 1),
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
    const mg = new Mailgun(formData);
    const mailgun = mg.client({
      username: "api",
      key: process.env.MAILGUN_KEY, // Add this to your .env file // Default Mailgun API URL
    });
    try {
      const emailData = {
        from: process.env.EMAIL_USER, // Must be a verified Mailgun sender
        to: ["hello@massageonthegomemphis.com", "sam@massageonthegomemphis.com"], // Recipient email
        subject: "All Therapist Spots Have Been Filled!",
        html: `<h2>All Therapist Spots Have Been Filled!</h2>
            <p>Good news! All therapist spots for the booking have been successfully filled.</p>
            <p><strong>Booking Details:</strong></p>
            <p><strong>Company Name:</strong> ${booking.companyName}</p>
            <p><strong>Client Name:</strong> ${booking.name}</p>
            <p><strong>Location:</strong> ${booking.address}</p>
            <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
            <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
            <p><strong>Increment:</strong> ${booking.eventIncrement} minutes</p>
            <p><strong>Available Date:</strong> ${booking.date}</p>
            <p><strong>Start Time:</strong> ${convertTo12Hour(
              booking.startTime
            )}</p>
            <p><strong>End Time:</strong> ${convertTo12Hour(
              booking.endTime
            )}</p>
            <p><strong>Extra Info:</strong> ${booking.extra}</p>
            <p><strong>Price:</strong> $${booking.price}</p>
            <ul>${therapistInfo}</ul>
            <p>Thank you for using our service!</p>`,
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
    // const finalEmailOptions = {
    //   from: process.env.EMAIL_USER, // Your email (verified sender)
    //   to: ["curtrickwalton@gmail.com"], // Same email for sending & receiving     // Adding your email as replyTo
    //   subject: "All Therapist Spots Have Been Filled!",
    //   html: `
    //         <h2>All Therapist Spots Have Been Filled!</h2>
    //         <p>Good news! All therapist spots for your booking have been successfully filled.</p>
    //         <p><strong>Booking Details:</strong></p>
    //         <p><strong>Company Name:</strong> ${booking.companyName}</p>
    //         <p><strong>Client Name:</strong> ${booking.name}</p>
    //         <p><strong>Location:</strong> ${booking.address}</p>
    //         <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
    //         <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
    //         <p><strong>Increment:</strong> ${booking.eventIncrement} minutes</p>
    //         <p><strong>Available Date:</strong> ${booking.date}</p>
    //         <p><strong>Start Time:</strong> ${convertTo12Hour(booking.startTime)}</p>
    //         <p><strong>End Time:</strong> ${convertTo12Hour(booking.endTime)}</p>
    //         <p><strong>Extra Info:</strong> ${booking.extra}</p>
    //         <p><strong>Price:</strong> $${booking.price}</p>
    //         <ul>${therapistInfo}</ul>
    //         <p>Thank you for using our service!</p>
    //     `,
    //   headers: {
    //     "X-Sent-Using": "SendGrid",
    //     "X-Source": "MassageOnTheGo",
    //   },
    // };

    // await sgMail.sendMultiple(finalEmailOptions);
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
      const mg = new Mailgun(formData);
      const mailgun = mg.client({
        username: "api",
        key: process.env.MAILGUN_KEY, // Add this to your .env file // Default Mailgun API URL
      });
      try {
        // const yahooEmails = remainingTherapists.filter((email) =>
        //   email.includes("@yahoo.com")
        // );
        // const otherEmails = remainingTherapists.filter(
        //   (email) => !email.includes("@yahoo.com")
        // );
        // const emailData = {
        //   from: process.env.EMAIL_USER, // Must be a verified Mailgun sender
        //   to: otherEmails, // Recipient email
        //   subject: "A Therapist Spot Just Opened Up!",
        //   html: `<h2>A therapist has left a booking.</h2>
        //     <p>A booking now has an available therapist spot.</p>
        //      <p><strong>Company Name:</strong> ${booking.companyName}</p>
        //         <p><strong>Client Name:</strong> ${booking.name}</p>
        //         <p><strong>Location:</strong> ${booking.address}</p>
        //         <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
        //         <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
        //         <p><strong>Increment:</strong> ${
        //           booking.eventIncrement
        //         } minutes</p>
        //         <p><strong>Available Date:</strong> ${booking.date}</p>
        //         <p><strong>Start Time:</strong> ${convertTo12Hour(
        //           booking.startTime
        //         )}</p>
        //         <p><strong>End Time:</strong> ${convertTo12Hour(
        //           booking.endTime
        //         )}</p>
        //         <p><strong>Extra Info:</strong> ${booking.extra}</p>
        //     <p><strong>Remaining Spots:</strong> ${remainingSpots}</p>`,
        //   "h:X-Sent-Using": "Mailgun",
        //   "h:X-Source": "MassageOnTheGo",
        // };

        // const response = await mailgun.messages.create(
        //   "motgpayment.com", // Your Mailgun domain (e.g., "mg.yourdomain.com")
        //   emailData
        // );

        // const sendEmailsWithDelay = async (emails) => {
        //   for (const email of emails) {
        //     try {
        //       await mailgun.messages.create("motgpayment.com", {
        //         from: process.env.EMAIL_USER,
        //         to: email,
        //         subject: "A Therapist Spot Just Opened Up!",
        //         html: `<h2>A therapist has left a booking.</h2>
        //     <p>A booking now has an available therapist spot.</p>
        //      <p><strong>Company Name:</strong> ${booking.companyName}</p>
        //         <p><strong>Client Name:</strong> ${booking.name}</p>
        //         <p><strong>Location:</strong> ${booking.address}</p>
        //         <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
        //         <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
        //         <p><strong>Increment:</strong> ${
        //           booking.eventIncrement
        //         } minutes</p>
        //         <p><strong>Available Date:</strong> ${booking.date}</p>
        //         <p><strong>Start Time:</strong> ${convertTo12Hour(
        //           booking.startTime
        //         )}</p>
        //         <p><strong>End Time:</strong> ${convertTo12Hour(
        //           booking.endTime
        //         )}</p>
        //         <p><strong>Extra Info:</strong> ${booking.extra}</p>
        //     <p><strong>Remaining Spots:</strong> ${remainingSpots}</p>`,
        //         "h:X-Sent-Using": "Mailgun",
        //         "h:X-Source": "MassageOnTheGo",
        //       });

        //       console.log(`Sent to ${email}`);
        //       await new Promise((resolve) => setTimeout(resolve, 5000)); // 5-second delay
        //     } catch (error) {
        //       console.error(`Error sending to ${email}:`, error);
        //     }
        //   }
        // };
        // await sendEmailsWithDelay(yahooEmails);
        const sendEmailsInBatches = async (
          emails,
          batchSize = 5,
          delayMs = 3000
        ) => {
          for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);

            try {
              const response = await Promise.all(
                batch.map((email) =>
                  mailgun.messages.create("motgpayment.com", {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: "A Therapist Spot Just Opened Up!",
                    html: `<h2>A therapist has left a booking.</h2>
            <p>A booking now has an available therapist spot.</p>
             <p><strong>Company Name:</strong> ${booking.companyName}</p>
                <p><strong>Client Name:</strong> ${booking.name}</p>
                <p><strong>Location:</strong> ${booking.address}</p>
                <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
                <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
                <p><strong>Increment:</strong> ${
                  booking.eventIncrement
                } minutes</p>
                <p><strong>Available Date:</strong> ${booking.date}</p>
                <p><strong>Start Time:</strong> ${convertTo12Hour(
                  booking.startTime
                )}</p>
                <p><strong>End Time:</strong> ${convertTo12Hour(
                  booking.endTime
                )}</p>
                <p><strong>Extra Info:</strong> ${booking.extra}</p>
            <p><strong>Remaining Spots:</strong> ${remainingSpots}</p>`,
                    "h:X-Sent-Using": "Mailgun",
                    "h:X-Source": "MassageOnTheGo",
                  })
                )
              );
              console.log("Mailgun Response:", response);
            } catch (error) {
              console.error("Error sending email batch:", error);
            }

            if (i + batchSize < emails.length) {
              await new Promise((resolve) => setTimeout(resolve, delayMs)); // Delay between batches
            }
          }
        };
        await sendEmailsInBatches(remainingTherapists);
        //console.log("Mailgun Response:", response);
      } catch (error) {
        console.error("Error sending email via Mailgun:", error);
      }
    }

    // Send confirmation email to client on who left
    const therapist = await User.findById(therapistId);
    if (therapist) {
      const mg = new Mailgun(formData);
      const mailgun = mg.client({
        username: "api",
        key: process.env.MAILGUN_KEY, // Add this to your .env file // Default Mailgun API URL
      });
      try {
        const emailData = {
          from: process.env.EMAIL_USER, // Must be a verified Mailgun sender
          to: ["hello@massageonthegomemphis.com", "sam@massageonthegomemphis.com"], // Recipient email
          subject: "Therapist Has Left a Booking",
          html: `<h4>Name: ${therapist.username}</h4>
          <h4>Email: ${therapist.email}</h4>
          <h4>Phone Number: ${therapist.phoneNumber}</h4>
          <p><strong>Booking Details:</strong></p>
          <p><strong>Company Name:</strong> ${booking.companyName}</p>
          <p><strong>Client Name:</strong> ${booking.name}</p>
          <p><strong>Location:</strong> ${booking.address}</p>
          <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
          <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
          <p><strong>Increment:</strong> ${booking.eventIncrement} minutes</p>
          <p><strong>Available Date:</strong> ${booking.date}</p>
          <p><strong>Start Time:</strong> ${convertTo12Hour(
            booking.startTime
          )}</p>
          <p><strong>End Time:</strong> ${convertTo12Hour(booking.endTime)}</p>
          <p><strong>Extra Info:</strong> ${booking.extra}</p>
          <p><strong>Price:</strong> $${booking.price}</p>`,
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
