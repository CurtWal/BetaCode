const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true
    },
    zipCode: {
        type: String,
        required: true
    },
    therapist: {
        type: Number,
        required: true
    },
    eventHours: {
        type: Number,
        required: true
    },
    eventIncrement: {
        type: Number,
        required: true
    },
    isComplete:{
        type: Boolean,
        default: false
    }
});

const bookingModel = mongoose.model('Booking', bookingSchema);

module.exports = bookingModel;