const express = require("express");
const router = express.Router();
const TherapistAssignment = require("../model/AssignTherapist");
const MedicalAssignment = require("../model/AssignMedical");
const Booking = require("../model/bookings");
const MedicalBooking = require("../model/medicalBookings");
const User = require("../model/user"); // Assuming User model contains therapist data
const nodemailer = require("nodemailer");
const axios = require("axios");
const sgMail = require("@sendgrid/mail");
const { google } = require("googleapis");
const formData = require("form-data");
const Mailgun = require("mailgun.js");

const checkLocationDistance = (lat1, lon1, lat2, lon2, maxMiles) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
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

// Helper to format hours as 'X hours Y minutes'
const formatServiceHours = (hours) => {
  const num = parseFloat(hours);
  const wholeHours = Math.floor(num);
  const minutes = num % 1 !== 0 ? 30 : 0;
  return `${wholeHours} hour${wholeHours !== 1 ? "s" : ""}${
    minutes ? ` ${minutes} mins` : ""
  }`;
};

const options = [
  { value: "therapist", label: "Massage Therapist" },
  { value: "personal", label: "Personal Trainer" },
  { value: "yoga", label: "Yoga Instructor" },
  { value: "group", label: "Group Fitness Instructor" },
  { value: "nutritionist", label: "Nutritionist" },
  { value: "pilates", label: "Pilates Instructor" },
  { value: "stretch", label: "Stretch Therapist" },
  { value: "cpr", label: "CPR Instructor" },
  { value: "meditation", label: "Meditation Coach" },
  { value: "zumba", label: "Zumba Instructor" },
  { value: "wellness", label: "Wellness Coach" },
  { value: "ergonomics", label: "Ergonomics Specialist" },
  { value: "breathwork", label: "Breathwork Coach" },
];

const getRoleLabel = (roleValue) => {
  const found = options.find((opt) => opt.value === roleValue);
  return found ? found.label : roleValue;
};
// Assign therapist to a booking
router.post("/assign-therapist", async (req, res) => {
  try {
    const { bookingId, therapistId, role } = req.body;

    // Check if the booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // --- Legacy schema support ---
    if (!Array.isArray(booking.services) || booking.services.length === 0) {
      // Count assigned therapists
      const assignedCount = await TherapistAssignment.countDocuments({
        bookingId,
      });
      if (assignedCount >= booking.therapist) {
        return res
          .status(400)
          .json({ message: "All therapist spots are filled" });
      }
      // Prevent duplicate assignment
      const existingAssignment = await TherapistAssignment.findOne({
        bookingId,
        therapistId,
      });
      if (existingAssignment) {
        return res
          .status(400)
          .json({ message: "You have already joined this booking" });
      }
      // Assign therapist (no role)
      const assignment = new TherapistAssignment({
        bookingId,
        therapistId,
      });
      await assignment.save();

      // Google Calendar logic (unchanged)
      const user = await User.findById(therapistId);
      if (user?.googleTokens?.refresh_token) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );
        oauth2Client.setCredentials({
          refresh_token: user.googleTokens.refresh_token,
        });
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        const event = {
          summary: `Massage Booking - ${booking.companyName}`,
          location: booking.address,
          description: booking.extra || "Massage booking",
          start: {
            dateTime: new Date(
              `${booking.date}T${booking.startTime}:00`
            ).toISOString(),
            timeZone: "America/Chicago",
          },
          end: {
            dateTime: new Date(
              `${booking.date}T${booking.endTime}:00`
            ).toISOString(),
            timeZone: "America/Chicago",
          },
        };
        try {
          const createdEvent = await calendar.events.insert({
            calendarId: "primary",
            resource: event,
          });
          assignment.googleEventId = createdEvent.data.id;
          await assignment.save();
        } catch (err) {
          console.error(
            "❌ Failed to create Google Calendar event:",
            err.message
          );
        }
      }
      return res.json({
        message: "You have successfully joined this booking",
        assignment,
        spotsLeft: booking.therapist - (assignedCount + 1),
      });
    }

    // --- New schema: role-based logic ---
    // Check if the role is valid for this booking
    const roleObj = booking.services.find((srv) => srv.role === role);
    if (!roleObj) {
      return res
        .status(400)
        .json({ message: "Role not available for this booking" });
    }

    // Count how many therapists are already assigned for this role
    const assignedCount = await TherapistAssignment.countDocuments({
      bookingId,
      role,
    });

    if (assignedCount >= roleObj.workers) {
      return res
        .status(400)
        .json({ message: `All spots for role '${role}' are filled` });
    }

    // Prevent duplicate assignments for this role
    const existingAssignment = await TherapistAssignment.findOne({
      bookingId,
      therapistId,
      role,
    });
    if (existingAssignment) {
      return res.status(400).json({
        message: `You have already joined this booking for role '${role}'`,
      });
    }

    // Assign therapist for the role
    const assignment = new TherapistAssignment({
      bookingId,
      therapistId,
      role,
    });
    await assignment.save();

    // Google Calendar logic (unchanged)
    const user = await User.findById(therapistId);
    if (user?.googleTokens?.refresh_token) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({
        refresh_token: user.googleTokens.refresh_token,
      });
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      const event = {
        summary: `Massage Booking - ${booking.companyName}`,
        location: booking.address,
        description: booking.extra || "Massage booking",
        start: {
          dateTime: new Date(
            `${booking.date}T${booking.startTime}:00`
          ).toISOString(),
          timeZone: "America/Chicago",
        },
        end: {
          dateTime: new Date(
            `${booking.date}T${booking.endTime}:00`
          ).toISOString(),
          timeZone: "America/Chicago",
        },
      };
      try {
        const createdEvent = await calendar.events.insert({
          calendarId: "primary",
          resource: event,
        });
        assignment.googleEventId = createdEvent.data.id;
        await assignment.save();
      } catch (err) {
        console.error(
          "❌ Failed to create Google Calendar event:",
          err.message
        );
      }
    }
    res.json({
      message: `You have successfully joined as '${role}'`,
      assignment,
      spotsLeft: roleObj.workers - (assignedCount + 1),
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

    const totalNeeded = Array.isArray(booking.services)
      ? booking.services.reduce((sum, s) => sum + (s.workers || 0), 0)
      : 0;

    // Check assigned therapist count
    const assignedCount = await TherapistAssignment.countDocuments({
      bookingId,
    });

    if (assignedCount < totalNeeded) {
      return res
        .status(400)
        .json({ message: "Spots are not filled yet. Can't send email." });
    }

    // Fetch assigned therapist details
    const assignedTherapistss = await TherapistAssignment.find({
      bookingId,
    }).populate("therapistId", "username email phoneNumber");

    // Collect therapist info
    const therapistInfo = assignedTherapistss
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
        subject: "All Wellness Spots Have Been Filled!",
        html: `<h2>All Wellness Spots Have Been Filled!</h2>
            <p>Good news! All wellness spots for the booking have been successfully filled.</p>
            <p><strong>Booking Details:</strong></p>
            <p><strong>Company Name:</strong> ${booking.companyName}</p>
            <p><strong>Client Name:</strong> ${booking.name}</p>
            <p><strong>Location:</strong> ${booking.address}</p>
            <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
<h3>Services</h3>
            <ul>
              ${booking.services
                .map(
                  (service) => `<li>
          <strong>${service.role}</strong><br/>
          # of Providers: ${service.workers}<br/>
          Hours: ${formatServiceHours(service.hours)}<br/>
          Increment: ${service.increment} minutes
        </li>
      `
                )
                .join("")}
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
    const { bookingId, therapistId, role } = req.body;

    // Find the therapist assignment for this role
    const assignment = await TherapistAssignment.findOneAndDelete({
      bookingId,
      therapistId,
      role,
    });

    if (!assignment) {
      return res.status(404).json({
        message: "You are not assigned to this booking for this role",
      });
    }

    const user = await User.findById(therapistId);
    if (assignment?.googleEventId && user?.googleTokens?.refresh_token) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI // e.g. http://localhost:5000/google/callback
      );
      oauth2Client.setCredentials({
        refresh_token: user.googleTokens.refresh_token,
      });
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      await calendar.events.delete({
        calendarId: "primary",
        eventId: assignment.googleEventId,
      });
      console.log(
        `🗑️ Deleted event ${assignment.googleEventId} for therapist ${therapistId}`
      );
    }

    // Fetch the booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Find all therapists within distance who are not assigned yet for this role
    const therapists = await User.find(
      { role: "therapist" },
      "email _id zipCode"
    );
    const assignedTherapists = await TherapistAssignment.find({
      bookingId,
      role,
    });
    const assignedTherapistIds = assignedTherapists.map((t) =>
      t.therapistId.toString()
    );

    const assignedCount = await TherapistAssignment.countDocuments({
      bookingId,
      role,
    });

    const roleObj = booking.services.find((srv) => srv.role === role);
    const remainingSpots = roleObj ? roleObj.workers - assignedCount : 0;
    const remainingTherapists = [];
    for (const therapist of therapists) {
      if (
        !assignedTherapistIds.includes(therapist._id.toString()) &&
        checkLocationDistance(
          booking.location.lat,
          booking.location.lng,
          therapist.location.lat,
          therapist.location.lng,
          92
        )
      ) {
        remainingTherapists.push(therapist.email);
      }
    }

    // Notify therapists about the open spot for this role
    if (remainingTherapists.length > 0) {
      const mg = new Mailgun(formData);
      const mailgun = mg.client({
        username: "api",
        key: process.env.MAILGUN_KEY, // Add this to your .env file // Default Mailgun API URL
      });
      try {
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
                    subject: `A ${getRoleLabel(role)} Spot Just Opened Up!`,
                    html: `<h2>A ${getRoleLabel(role)} has left a booking.</h2>
            <p>A booking now has an available ${role} spot.</p>
             <p><strong>Company Name:</strong> ${booking.companyName}</p>
                <p><strong>Client Name:</strong> ${booking.name}</p>
                <p><strong>Location:</strong> ${booking.address}</p>
                <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
                <p><strong>Available Date:</strong> ${booking.date}</p>
                <p><strong>Start Time:</strong> ${convertTo12Hour(
                  booking.startTime
                )}</p>
                <p><strong>End Time:</strong> ${convertTo12Hour(
                  booking.endTime
                )}</p>
                <p><strong>Extra Info:</strong> ${booking.extra}</p>
            <p><strong>Remaining Spots for ${getRoleLabel(
              role
            )}:</strong> ${remainingSpots}</p>`,
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
              await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
          }
        };
        await sendEmailsInBatches(remainingTherapists);
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
          subject: `${getRoleLabel(role)} Has Left a Booking`,
          html: `<h4>Name: ${therapist.username}</h4>
          <h4>Email: ${therapist.email}</h4>
          <h4>Phone Number: ${therapist.phoneNumber}</h4>
          <p><strong>Booking Details:</strong></p>
          <p><strong>Company Name:</strong> ${booking.companyName}</p>
          <p><strong>Client Name:</strong> ${booking.name}</p>
          <p><strong>Location:</strong> ${booking.address}</p>
          <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
          <h4>Services:</h4>
          <ul>
            ${
              booking.services && booking.services.length > 0
                ? booking.services
                    .map(
                      (srv) =>
                        `<li><strong>${getRoleLabel(srv.role)}</strong>: ${
                          srv.workers
                        } workers, ${formatServiceHours(
                          srv.hours
                        )}, increments ${srv.increment} min</li>`
                    )
                    .join("")
                : "<li>No services listed</li>"
            }
          </ul>
          <p><strong>Available Date:</strong> ${booking.date}</p>
          <p><strong>Start Time:</strong> ${convertTo12Hour(
            booking.startTime
          )}</p>
          <p><strong>End Time:</strong> ${convertTo12Hour(booking.endTime)}</p>
          <p><strong>Extra Info:</strong> ${booking.extra}</p>
          <p><strong>Total Price:</strong> $${booking.price}</p>`,
          "h:X-Sent-Using": "Mailgun",
          "h:X-Source": "MassageOnTheGo",
        };
        const response = await mailgun.messages.create(
          "motgpayment.com",
          emailData
        );
        console.log("Mailgun Response:", response);
      } catch (error) {
        console.error("Error sending email via Mailgun:", error);
      }
    }

    res.json({
      message: `You have left the booking for role '${role}'. Notifications sent.`,
    });
  } catch (error) {
    console.error("Error removing therapist:", error);
    res.status(500).json({ message: "Error removing therapist", error });
  }
});

router.post("/admin-remove-therapist", async (req, res) => {
  try {
    const { bookingId, therapistId } = req.body;

    // Optional: Add admin check here if needed
    // const adminUser = await User.findById(req.userId);
    // if (!adminUser || adminUser.role !== "admin") {
    //   return res.status(403).json({ message: "Unauthorized" });
    // }

    const assignment = await TherapistAssignment.findOneAndDelete({
      bookingId,
      therapistId,
    });

    if (!assignment) {
      return res
        .status(404)
        .json({ message: "Therapist not assigned to this booking." });
    }
    const remainingAssignments = await TherapistAssignment.find({ bookingId });
    const remainingCount = remainingAssignments.length;

    const user = await User.findById(therapistId);
    console.log(" EventId: ", assignment?.googleEventId);
    console.log("Token: ", user?.googleTokens?.refresh_token);

    if (assignment?.googleEventId && user?.googleTokens?.refresh_token) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI // e.g. http://localhost:5000/google/callback
      );
      oauth2Client.setCredentials({
        refresh_token: user.googleTokens.refresh_token,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      await calendar.events.delete({
        calendarId: "primary",
        eventId: assignment.googleEventId,
      });

      console.log(
        `🗑️ Deleted event ${assignment.googleEventId} for therapist ${therapistId}`
      );
    }
    res.json({
      message: "Therapist successfully removed from the booking.",
      remainingSpots: remainingCount,
    });
  } catch (error) {
    console.error("Error removing therapist:", error);
    res.status(500).json({ message: "Error removing therapist", error });
  }
});

// Medical Bookings
router.post("/assign-medical-therapist", async (req, res) => {
  try {
    const { bookingId, therapistId } = req.body;

    // Check if the booking exists
    const booking = await MedicalBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check how many therapists are already assigned
    const assignedCount = await MedicalAssignment.countDocuments({
      bookingId,
    });

    if (assignedCount >= booking.therapist) {
      return res
        .status(400)
        .json({ message: "Booking already has enough therapists assigned" });
    }

    // Prevent duplicate assignments
    const existingAssignment = await MedicalAssignment.findOne({
      bookingId,
      therapistId,
    });
    if (existingAssignment) {
      return res
        .status(400)
        .json({ message: "Therapist already assigned to this booking" });
    }

    // Assign therapist
    const assignment = new MedicalAssignment({ bookingId, therapistId });
    await assignment.save();

    const user = await User.findById(therapistId);
    // 📅 Add to Google Calendar for therapist
    console.log(user?.googleTokens?.refresh_token);
    if (user?.googleTokens?.refresh_token) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI // e.g. http://localhost:5000/google/callback
      );

      oauth2Client.setCredentials({
        refresh_token: user.googleTokens.refresh_token,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      const event = {
        summary: `Massage Booking - ${booking.companyName}`,
        location: booking.address,
        description: booking.extra || "Massage booking",
        start: {
          dateTime: new Date(
            `${booking.date}T${booking.startTime}:00`
          ).toISOString(),
          timeZone: "America/Chicago", // adjust timezone
        },
        end: {
          dateTime: new Date(
            `${booking.date}T${booking.endTime}:00`
          ).toISOString(),
          timeZone: "America/Chicago",
        },
      };

      try {
        const createdEvent = await calendar.events.insert({
          calendarId: "primary",
          resource: event,
        });

        // ✅ Save eventId in assignment
        assignment.googleEventId = createdEvent.data.id;
        await assignment.save();
        console.log(`✅ Event created for therapist ${therapistId}`);
      } catch (err) {
        console.error(
          "❌ Failed to create Google Calendar event:",
          err.message
        );
      }
    }
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

router.post("/send-medical-email-on-spot-fill", async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Check if the booking exists
    const booking = await MedicalBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check assigned therapist count
    const assignedCount = await MedicalAssignment.countDocuments({
      bookingId,
    });
    const remainingSpots = booking.therapist - assignedCount;

    if (remainingSpots > 0) {
      return res
        .status(400)
        .json({ message: "Spots are not filled yet. Can't send email." });
    }

    // Fetch assigned therapist details
    const assignedTherapists = await MedicalAssignment.find({
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
        to: [
          "hello@massageonthegomemphis.com",
          "sam@massageonthegomemphis.com",
        ], // Recipient email
        subject: "All Wellness Spots Have Been Filled!",
        html: `<h2>All Wellness Spots Have Been Filled!</h2>
            <p>Good news! All wellness spots for the booking have been successfully filled.</p>
            <p><strong>Medical Booking Details:</strong></p>
            <p><strong>Client Name:</strong> ${booking.fullName}</p>
            <p><strong>Location:</strong> ${booking.address}</p>
            <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
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

    res.json({ message: "Email sent to the client with therapist details" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Error sending email", error });
  }
});

router.post("/leave-medical-booking", async (req, res) => {
  try {
    const { bookingId, therapistId } = req.body;

    // Find the therapist assignment
    const assignment = await MedicalAssignment.findOneAndDelete({
      bookingId,
      therapistId,
    });

    if (!assignment) {
      return res
        .status(404)
        .json({ message: "Therapist not assigned to this booking" });
    }
    const user = await User.findById(therapistId);
    if (assignment?.googleEventId && user?.googleTokens?.refresh_token) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI // e.g. http://localhost:5000/google/callback
      );
      oauth2Client.setCredentials({
        refresh_token: user.googleTokens.refresh_token,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      await calendar.events.delete({
        calendarId: "primary",
        eventId: assignment.googleEventId,
      });

      console.log(
        `🗑️ Deleted event ${assignment.googleEventId} for therapist ${therapistId}`
      );
    }
    // Fetch the booking details
    const booking = await MedicalBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Find all therapists within distance who are not assigned yet
    const therapists = await User.find(
      { role: "therapist" },
      "email _id zipCode"
    );
    const assignedTherapists = await MedicalAssignment.find({ bookingId });
    const assignedTherapistIds = assignedTherapists.map((t) =>
      t.therapistId.toString()
    );

    const assignedCount = await MedicalAssignment.countDocuments({
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
        checkLocationDistance(
          booking.location.lat,
          booking.location.lng,
          therapist.location.lat,
          therapist.location.lng,
          92
        )
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
                    subject: "A Wellness Spot Just Opened Up!",
                    html: `<h2>A wellness worker has left a booking.</h2>
            <p>A booking now has an available wellness spot.</p>
                <p><strong>Client Name:</strong> ${booking.fullName}</p>
                <p><strong>Location:</strong> ${booking.address}</p>
                <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
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
          to: [
            "hello@massageonthegomemphis.com",
            "sam@massageonthegomemphis.com",
          ], // Recipient email
          subject: "Wellness Worker Has Left a Booking",
          html: `<h4>Name: ${therapist.username}</h4>
          <h4>Email: ${therapist.email}</h4>
          <h4>Phone Number: ${therapist.phoneNumber}</h4>
          <p><strong>Booking Details:</strong></p>
          <p><strong>Client Name:</strong> ${booking.fullName}</p>
          <p><strong>Location:</strong> ${booking.address}</p>
          <p><strong>ZipCode:</strong> ${booking.zipCode}</p>`,
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

router.post("/admin-remove-medical-therapist", async (req, res) => {
  try {
    const { bookingId, therapistId } = req.body;

    // Optional: Add admin check here if needed
    // const adminUser = await User.findById(req.userId);
    // if (!adminUser || adminUser.role !== "admin") {
    //   return res.status(403).json({ message: "Unauthorized" });
    // }

    const assignment = await MedicalAssignment.findOneAndDelete({
      bookingId,
      therapistId,
    });

    if (!assignment) {
      return res
        .status(404)
        .json({ message: "Therapist not assigned to this booking." });
    }
    const remainingAssignments = await MedicalAssignment.find({ bookingId });
    const remainingCount = remainingAssignments.length;

    const user = await User.findById(therapistId);
    if (assignment?.googleEventId && user?.googleTokens?.refresh_token) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI // e.g. http://localhost:5000/google/callback
      );
      oauth2Client.setCredentials({
        refresh_token: user.googleTokens.refresh_token,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      await calendar.events.delete({
        calendarId: "primary",
        eventId: assignment.googleEventId,
      });

      console.log(
        `🗑️ Deleted event ${assignment.googleEventId} for therapist ${therapistId}`
      );
    }
    res.json({
      message: "Therapist successfully removed from the booking.",
      remainingSpots: remainingCount,
    });
  } catch (error) {
    console.error("Error removing therapist:", error);
    res.status(500).json({ message: "Error removing therapist", error });
  }
});
module.exports = router;
