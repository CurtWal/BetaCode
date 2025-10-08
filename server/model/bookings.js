const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  zipCode: { type: String, required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  services: [
    {
      role: { type: String, required: true },       // "therapist", "yoga", etc.
      workers: { type: Number, required: true },    // e.g. 3
      hours: { type: Number, required: true },      // e.g. 4
      increment: { type: Number, default: 10 },     // 10, 15, 20 min
      price: { type: Number, required: true },      // role-level subtotal
    },
  ],
  totalPrice: { type: Number, required: false },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  extra: { type: String, default: "" },
  isComplete: { type: Boolean, default: false },
  confirmed: { type: Boolean, default: false },
  emailsSent: { type: Boolean, default: false },
  formType: { type: String, required: true },
  phoneNumber: { type: String, require: true },
});

const bookingModel = mongoose.model("Booking", bookingSchema);

module.exports = bookingModel;
