// models/TherapistReminder.js
const mongoose = require("mongoose");

const therapistReminderSchema = new mongoose.Schema({
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  sentAt: { 
    type: Date, 
    default: Date.now,
    index: { expires: 489 * 60 * 60 }
 },
});
module.exports = mongoose.model("TherapistReminder", therapistReminderSchema);
