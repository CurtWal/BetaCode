const express = require("express");
const Booking = require("../model/bookings");
const TherapistAssignment = require("../model/AssignTherapist");
const User = require("../model/user");
const router = express.Router();
const twilio = require("twilio");
const TherapistReminder = require("../model/TherapistReminder");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_NUMBER;
const client = twilio(accountSid, authToken);

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
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 3000; // 3 second between batches

// Utility to split into batches
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

const sendSMS = async ({ to, message }) => {
  try {
    const msg = await client.messages.create({
      body: message,
      from: fromPhone,
      to,
    });
    console.log(`✅ SMS sent to ${to} | SID: ${msg.sid}`);
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${to}: ${error.message}`);
  }
};

router.get("/reminder", async (req, res) => {
  try {
    const now = new Date();
    //const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);
    //console.log(threeMinutesAgo);
    const maxDistance = 92;

    const bookings = await Booking.find({
      confirmed: true,
      date: { $exists: true },
    });
    //console.log(bookings);
    // const therapists = await User.find({
    //    $or: [
    //   { role: { $in: bookings.formRoles } },
    //   { role: { $in: bookings.formRoles.map((r) => r.toLowerCase()) } },
    // ],
    //   phoneNumber: { $ne: "" },
    //   location: { $exists: true },
    // });
    const therapistBookingMap = new Map(); // therapistId => [booking, ...]
    const remindersToLog = [];

    for (const booking of bookings) {
      if (!booking.location?.lat || !booking.location?.lng) continue;
      if (booking.isComplete) continue;

      const therapists = await User.find({
        $or: [
          { role: { $in: bookings.formRoles } },
          { role: { $in: bookings.formRoles.map((r) => r.toLowerCase()) } },
        ],
        phoneNumber: { $ne: "" },
        location: { $exists: true },
      });
      const assigned = await TherapistAssignment.find({
        bookingId: booking._id,
      });
      if (assigned.length >= booking.therapist) continue;

      const assignedIds = assigned.map((a) => a.therapistId.toString());

      for (const therapist of therapists) {
        if (!therapist.location?.lat || !therapist.location?.lng) continue;
        if (assignedIds.includes(therapist._id.toString())) continue;

        const isNearby = checkLocationDistance(
          booking.location.lat,
          booking.location.lng,
          therapist.location.lat,
          therapist.location.lng,
          maxDistance
        );
        if (!isNearby) continue;

        const alreadyReminded = await TherapistReminder.findOne({
          bookingId: booking._id,
          therapistId: therapist._id,
          sentAt: { $gte: threeMinutesAgo, $lte: now },
        });

        if (alreadyReminded) continue;

        if (!therapistBookingMap.has(therapist._id.toString())) {
          therapistBookingMap.set(therapist._id.toString(), {
            therapist,
            bookings: [],
          });
        }

        therapistBookingMap
          .get(therapist._id.toString())
          .bookings.push(booking);

        remindersToLog.push({
          bookingId: booking._id,
          therapistId: therapist._id,
          dateSent: new Date(),
        });
      }
    }

    // Create SMS messages
    const smsQueue = [];
    for (const { therapist, bookings } of therapistBookingMap.values()) {
      const messageLines = bookings.map(
        (b) =>
          `${b.companyName} on ${b.date} at ${b.startTime} and ends at ${b.endTime}`
      );
      const message = `Reminder! There are ${
        bookings.length
      } open bookings nearby:\n\n${messageLines.join(
        "\n"
      )}\n\nLog in to accept!`;

      smsQueue.push({ to: therapist.phoneNumber, message });
    }

    // Send in batches
    const batches = chunkArray(smsQueue, BATCH_SIZE);
    for (let i = 0; i < batches.length; i++) {
      await Promise.all(batches[i].map((msg) => sendSMS(msg)));
      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // Save reminders
    await TherapistReminder.insertMany(remindersToLog);

    return res.status(200).json({
      message: `Sent ${smsQueue.length} SMS reminders to therapists.`,
    });
  } catch (error) {
    console.error("Reminder error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
