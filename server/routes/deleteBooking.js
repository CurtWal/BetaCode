const express = require("express");
const router = express.Router();
const Booking = require("../model/bookings");
const AssignTherapist = require("../model/AssignTherapist");
const twilio = require("twilio");

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

module.exports = router;