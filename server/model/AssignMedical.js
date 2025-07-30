const mongoose = require("mongoose");

const AssignMedical = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MedicalBookings",
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
  dateSent: {
    type: Date,
    default: Date.now,
  },
});

//  Add unique index to prevent duplicate assignments
AssignMedical.index({ bookingId: 1, therapistId: 1 }, { unique: true });

const MedicalAssign = mongoose.model("AssignMedical", AssignMedical);
module.exports = MedicalAssign;
