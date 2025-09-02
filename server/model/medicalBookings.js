const mongoose = require("mongoose");

const medicalBookingSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  dob: {
    type: String,
    required: true,
  },
  phone: {
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
  therapist: {
    type: Number,
    default: 1,
  },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  emergencyContact: {
    type: String,
    required: true,
  },
  insuranceProvider: {
    type: String,
    required: true,
  },
  memberId: {
    type: String,
    required: true,
  },
  fsaProvider: {
    type: String,
    required: true,
  },
  physicianContact: {
    type: String,
    required: true,
  },
  prescriptionOnFile: {
    type: String,
    required: true,
  },
  painAreas: {
    type: String,
    required: true,
  },
  treatmentGoal: {
    type: String,
    required: true,
  },
  underPhysicianCare: {
    type: String,
    required: true,
  },
  surgeries: {
    type: String,
    required: true,
  },
  medications: {
    type: String,
    required: true,
  },
  pressurePreference: {
    type: String,
    required: true,
  },
  sensitiveAreas: {
    type: String,
    required: true,
  },
  allergies: {
    type: String,
    required: true,
  },
  signature: {
    type: String,
    required: true,
  },
  signatureDate: {
    type: String,
    required: true,
  },
  isComplete: {
    type: Boolean,
    default: false,
  },
  completedAt:{
    type: Date
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
  emailsSent: {
    type: Boolean,
    default: false,
  },
  formType: {
    type: String,
    required: true,
  },
  formRoles: {
    type: [String],
    require: true,
  },
  date: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  visit:{
    type: String,
    required: true,
  },
    documentUrl: { 
    type: String,
    default: "",
   },
});

const medicalModel = mongoose.model("MedicalBookings", medicalBookingSchema);
module.exports = medicalModel;
