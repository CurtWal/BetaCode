const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  therapist: {
    type: Number,
    required: true,
  },
  eventHours: {
    type: Number,
    required: true,
  },
  eventIncrement: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  extra: {
    type: String,
    default: "",
  },
  price: {
    type: Number,
    required: true,
  },
  isComplete: {
    type: Boolean,
    default: false,
  },
  confirmed:{
    type: Boolean,
    default: false,
  },
  emailsSent: { type: Boolean, default: false }
});

const bookingModel = mongoose.model("Booking", bookingSchema);

module.exports = bookingModel;
