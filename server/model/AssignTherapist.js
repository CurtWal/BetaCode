const mongoose = require("mongoose");

const AssignTherapist = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  lastReminderSent: {
    type: Date,
    default: null,
  },
});

const therapistAssign = mongoose.model("AssignTherapist", AssignTherapist);
module.exports = therapistAssign;
