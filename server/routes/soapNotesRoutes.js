express = require("express");
const Medicalbookings = require("../model/medicalBookings");
const AssignMedical = require("../model/AssignMedical");
const SoapNotes = require("../model/SoapNotes");
const Users = require("../model/user");
const router = express.Router();
const formData = require("form-data");
const Mailgun = require("mailgun.js");

router.get("/soapnotes/:bookingId/:therapistId", async (req, res) => {
  try {
    const { bookingId, therapistId } = req.params;
    const booking = await Medicalbookings.findById(bookingId);
    const therapist = await Users.findById(therapistId);

    if (!booking || !therapist) {
      return res
        .status(404)
        .json({ message: "Booking or therapist not found." });
    }

    const response = {
      clientName: booking.fullName,
      date: new Date(`${booking.date}`),
      therapistName: `${therapist.username || ""}`.trim(),
    };

    res.status(200).json(response);
  } catch (err) {
    console.error("Error fetching SOAP data:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/soapnotes", async (req, res) => {
  try {
    const {
      clientName,
      date,
      therapistName,
      sessionLength,
      bodyAreasFocused,
      subjective,
      objective,
      assessment,
      plan,
      bookingId,
      therapistId,
    } = req.body;

    const newNote = new SoapNotes({
      clientName,
      date,
      therapistName,
      sessionLength,
      bodyAreasFocused,
      subjective,
      objective,
      assessment,
      plan,
      bookingId,
      therapistId,
    });

    await newNote.save();

    // Email the contents
    const html = `
  <h3>New SOAP Note Submitted</h3>
  <p><strong>Client:</strong> ${clientName}</p>
  <p><strong>Date:</strong> ${new Date(date).toLocaleString()}</p>
  <p><strong>Therapist:</strong> ${therapistName} min</p>
  <p><strong>Session Length:</strong> ${sessionLength} min</p>
  <p><strong>Body Areas:</strong> ${bodyAreasFocused}</p>
  <p><strong>Subjective:</strong> ${subjective}</p>
  <p><strong>Objective:</strong> ${objective}</p>
  <p><strong>Assessment:</strong> ${assessment}</p>
  <p><strong>Plan:</strong> ${plan}</p>
`;

    const mg = new Mailgun(formData);
    const mailgun = mg.client({
      username: "api",
      key: process.env.MAILGUN_KEY,
    });

    await mailgun.messages.create("motgpayment.com", {
      from: process.env.EMAIL_USER,
      to: "curtrickwalton@gmail.com",
      subject: "New SOAP Note Submitted",
      html,
    });

    res.status(201).json({ message: "SOAP note saved and emailed." });
  } catch (err) {
    console.error("Error saving SOAP note:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
