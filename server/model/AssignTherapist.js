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
  role: {
    type: String,
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  dateSent: {
    type: Date,
    default: Date.now,
  },
  googleEventId: {
    type: String,
    default: null,
  },
});

//  Add unique index to prevent duplicate assignments
AssignTherapist.index({ bookingId: 1, therapistId: 1 }, { unique: true });

const therapistAssign = mongoose.model("AssignTherapist", AssignTherapist);
module.exports = therapistAssign;
