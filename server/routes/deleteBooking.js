const express = require("express");
const router = express.Router();
const Booking = require("../model/bookings");
const medicalBooking = require("../model/medicalBookings");
const AssignTherapist = require("../model/AssignTherapist");
const AssignMedical = require("../model/AssignMedical");
const twilio = require("twilio");
const User = require("../model/user");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Delete booking and remove assigned therapist records
router.delete("/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if(type === "cancel"){
      const assignedTherapists = await AssignTherapist.find({ bookingId: id }).populate("therapistId", "phoneNumber");

    if (!assignedTherapists.length) {
      console.log("No assigned therapists found for this booking.");
    }

    const phoneNumbers = assignedTherapists
      .map((a) => a.therapistId.phoneNumber)
      .filter(Boolean)
      .map((num) => (num.startsWith("+") ? num : `+1${num}`));
    
      const smsResults = [];

      for (const number of phoneNumbers) {
        const message = await client.messages.create({
          body: `⚠️ Booking from ${booking.companyName} on ${booking.date} has been canceled.`,
          from: process.env.TWILIO_NUMBER,
          to: number,
        });
        smsResults.push({ number, sid: message.sid });
      }
    }
    
    // Remove Google Calendar events for each assigned therapist (if any)
    const assignedTherapistRecords = await AssignTherapist.find({ bookingId: id });
    for (const assignment of assignedTherapistRecords) {
      if (assignment.googleEventId) {
        const user = await User.findById(assignment.therapistId);
        if (user?.googleTokens?.refresh_token) {
          const { google } = require("googleapis");
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
          );
          oauth2Client.setCredentials({
            refresh_token: user.googleTokens.refresh_token,
          });
          const calendar = google.calendar({ version: "v3", auth: oauth2Client });
          try {
            await calendar.events.delete({
              calendarId: "primary",
              eventId: assignment.googleEventId,
            });
            console.log(`🗑️ Deleted event ${assignment.googleEventId} for therapist ${assignment.therapistId}`);
          } catch (err) {
            console.error("❌ Failed to delete Google Calendar event:", err.message);
          }
        }
      }
    }
    // Delete assigned therapist records for this booking
    await AssignTherapist.deleteMany({ bookingId: id });

    // Delete the booking itself
    await Booking.findByIdAndDelete(id);

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Server error deleting booking" });
  }
});

// Medical Bookings
router.delete("/medical-bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    const booking = await medicalBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if(type === "cancel"){
      const assignedTherapists = await AssignMedical.find({ bookingId: id }).populate("therapistId", "phoneNumber");

    if (!assignedTherapists.length) {
      console.log("No assigned therapists found for this booking.");
    }

    const phoneNumbers = assignedTherapists
      .map((a) => a.therapistId.phoneNumber)
      .filter(Boolean)
      .map((num) => (num.startsWith("+") ? num : `+1${num}`));
    
      const smsResults = [];

      for (const number of phoneNumbers) {
        const message = await client.messages.create({
          body: `⚠️ Booking from ${booking.fullName} has been canceled.`,
          from: process.env.TWILIO_NUMBER,
          to: number,
        });
        smsResults.push({ number, sid: message.sid });
      }
    }
    
    // Remove Google Calendar events for each assigned therapist (if any)
    const assignedMedicalRecords = await AssignMedical.find({ bookingId: id });
    for (const assignment of assignedMedicalRecords) {
      if (assignment.googleEventId) {
        const user = await User.findById(assignment.therapistId);
        if (user?.googleTokens?.refresh_token) {
          const { google } = require("googleapis");
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
          );
          oauth2Client.setCredentials({
            refresh_token: user.googleTokens.refresh_token,
          });
          const calendar = google.calendar({ version: "v3", auth: oauth2Client });
          try {
            await calendar.events.delete({
              calendarId: "primary",
              eventId: assignment.googleEventId,
            });
            console.log(`🗑️ Deleted event ${assignment.googleEventId} for therapist ${assignment.therapistId}`);
          } catch (err) {
            console.error("❌ Failed to delete Google Calendar event:", err.message);
          }
        }
      }
    }
    // Delete assigned therapist records for this booking
    await AssignMedical.deleteMany({ bookingId: id });

    // Delete the booking itself
    await medicalBooking.findByIdAndDelete(id);

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Server error deleting booking" });
  }
});

module.exports = router;