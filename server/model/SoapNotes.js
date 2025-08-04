const mongoose = require("mongoose");

const SoapNotesSchema = new mongoose.Schema({
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
  clientName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  therapistName:{
    type: String,
    required: true,
  },
  sessionLength: {
    type: Number, // in minutes
    required: true,
  },
  bodyAreasFocused: {
    type: String,
    required: true,
  },
  subjective: {
    type: String,
    required: true,
  },
  objective: {
    type: String,
    required: true,
  },
  assessment: {
    type: String,
    required: true,
  },
  plan: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const soapNotesModel = mongoose.model("SoapNotes", SoapNotesSchema);

module.exports = soapNotesModel;
