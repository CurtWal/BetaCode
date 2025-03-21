const mongoose = require("mongoose");

const PromoSchema = new mongoose.Schema({
  regularBooking: {
    type: Number,
    default: 150,
    required: true,
  },
  specialBooking: {
    type: Number,
    default: 90,
    required: true,
  },
  freeHourEnabled: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("PromoPrice", PromoSchema);
