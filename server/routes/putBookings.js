express = require("express");
const bookings = require("../model/bookings");
const Medicalbookings = require("../model/medicalBookings");
const AssignMedical = require("../model/AssignMedical");
const Users = require("../model/user");
const router = express.Router();
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const axios = require("axios");

router.put("/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // Get updated value from request

    const booking = await bookings.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // If ZIP code is provided and changed, update location
    if (updateData.zipCode && updateData.zipCode !== booking.zipCode) {
      const geoRes = await axios.get(
        `https://api.geocod.io/v1.7/geocode?q=${updateData.zipCode}&api_key=${process.env.GEO_CODIO_API}`
      );
      const location = geoRes?.data?.results?.[0]?.location;

      if (!location) {
        return res
          .status(400)
          .json({ message: "Invalid ZIP code for geocoding" });
      }

      booking.location = {
        lat: location.lat,
        lng: location.lng,
      };
      booking.zipCode = updateData.zipCode;
    }

    // Update other fields safely
    Object.keys(updateData).forEach((key) => {
      if (key !== "zipCode") {
        booking[key] = updateData[key];
      }
    });

    await booking.save();

    res.json({ message: "Booking updated successfully", booking });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//Medical Bookings
router.put("/medical-bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // Get updated value from request

    const booking = await Medicalbookings.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // If ZIP code is provided and changed, update location
    if (updateData.zipCode && updateData.zipCode !== booking.zipCode) {
      const geoRes = await axios.get(
        `https://api.geocod.io/v1.7/geocode?q=${updateData.zipCode}&api_key=${process.env.GEO_CODIO_API}`
      );
      const location = geoRes?.data?.results?.[0]?.location;

      if (!location) {
        return res
          .status(400)
          .json({ message: "Invalid ZIP code for geocoding" });
      }

      booking.location = {
        lat: location.lat,
        lng: location.lng,
      };
      booking.zipCode = updateData.zipCode;
    }

    // Update other fields safely
    Object.keys(updateData).forEach((key) => {
      if (key !== "zipCode") {
        booking[key] = updateData[key];
      }
    });

    await booking.save();

    res.json({ message: "Booking updated successfully", booking });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Server error" });
  }
});
//Auto mark bookings as complete if therapist doesn't
router.get("/cron/mark-complete", async (req, res) => {
  try {
    const now = new Date();
    const booking = await bookings.find({ isComplete: false });

    for (let books of booking) {
      const bookingDateTime = parseTime(books.date, books.endTime);
      if (bookingDateTime < now) {
        books.isComplete = true;
        await books.save();
      }
    }

    res.status(200).json({ message: "Checked and updated overdue bookings." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error processing cron task." });
  }
});

// Helper function
function parseTime(dateStr, timeStr) {
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return new Date(`${dateStr}T${timeStr}:00`);
  }
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  hours = hours.toString().padStart(2, "0");
  minutes = minutes.toString().padStart(2, "0");
  return new Date(`${dateStr}T${hours}:${minutes}:00`);
}

router.get("/cron/mark-medical-complete", async (req, res) => {
  try {
    const now = new Date();
    const booking = await Medicalbookings.find({ isComplete: false });
    for (let books of booking) {
      const bookingStart = new Date(`${books.date}T${books.startTime}`);
      const bookingStartPlus30Min = new Date(
        bookingStart.getTime() + 30 * 60000
      ); // add 30 minutes

      if (bookingStartPlus30Min <= now) {
        books.isComplete = true;
        books.completedAt = new Date(); // optional: useful for HIPAA cleanup later
        await books.save();
        console.log("Booking ID being processed:", books._id);
        // Get assigned therapists for this booking
        const assignments = await AssignMedical.find({
          bookingId: books._id,
        });
        console.log(assignments);
        for (const assign of assignments) {
          const therapist = await Users.findById(assign.therapistId);
          if (!therapist?.email) continue;

          // Example SOAP note link
          const soapLink = `https://motgpayment.com/soapnotes/${books._id}/${therapist._id}`;
          const mg = new Mailgun(formData);
          const mailgun = mg.client({
            username: "api",
            key: process.env.MAILGUN_KEY, // Add this to your .env file // Default Mailgun API URL
          });
          try {
            const emailData = {
              from: process.env.EMAIL_USER, // Must be a verified Mailgun sender
              to: therapist.email, // Recipient email
              subject: "Complete SOAP Notes for Recent Session",
              html: `
          <p>Hello ${therapist.firstName || "Therapist"},</p>
          <p>The medical session with client <strong>${
            booking.fullName
          }</strong> has been marked complete.</p>
          <p>Please complete your SOAP notes here:</p>
          <p><a href="${soapLink}">${soapLink}</a></p>
          <p>Thank you!</p>
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
        }
      }
    }
    res.status(200).json({ message: "Checked and updated overdue bookings." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error processing cron task." });
  }
});

router.get("/redactHIPPA", async () => {
  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60000);
    const bookings = await Medicalbookings.find({
      isComplete: true,
      completedAt: { $lte: thirtyMinsAgo },
      memberId: { $exists: true },
    });

    for (const booking of bookings) {
      await Medicalbookings.findByIdAndUpdate(booking._id, {
        $unset: {
          insuranceProvider: "",
          memberId: "",
          fsaProvider: "",
          physicianContact: "",
          prescriptionOnFile: "",
          underPhysicianCare: "",
          surgeries: "",
          medications: "",
        },
      });
      res.status(200).json({
        message: `Redacted HIPAA fields for booking ID: ${booking._id}`,
      });
    }
  } catch (err) {
    console.error("Error during HIPAA cleanup:", err);
    res.status(500).json({ message: "Error processing cron task." });
  }
});
module.exports = router;
