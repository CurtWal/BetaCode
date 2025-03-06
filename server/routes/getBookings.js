express = require('express');
const booking = require('../model/bookings');
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const TherapistAssignment = require("../model/AssignTherapist");
const router = express.Router();

router.get('/bookings', verifyToken, checkRole(["admin", "therapist"]), async (req, res) => {
    try {
    // Fetch all bookings
    const myBookings = await booking.find().lean(); // Convert to plain objects

    // Fetch therapist assignments and populate therapist details
    const therapistAssignments = await TherapistAssignment.find()
      .populate("therapistId", "username email role") // Only fetch therapist details
      .lean();

    // Attach assigned therapists to their respective bookings
    const updatedBookings = myBookings.map((booking) => {
      const assignedTherapists = therapistAssignments
        .filter((assignment) => assignment.bookingId.toString() === booking._id.toString())
        .map((assignment) => assignment.therapistId); // Extract therapist details

      return { ...booking, assignedTherapists }; // Add assigned therapists to each booking
    });

    console.log("Updated Bookings:", JSON.stringify(updatedBookings, null, 2)); // Debugging log

    res.json(updatedBookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/bookings/:id", async (req, res) => {
  try {
      const { id } = req.params;
      // Find the booking
      const bookings = await booking.findById(id).lean();
      if (!bookings) {
          return res.status(404).json({ message: "Booking not found" });
      }

      // Find assigned therapists
      const therapistAssignments = await TherapistAssignment.find({ bookingId: id })
          .populate("therapistId", "username email") // Get therapist details
          .lean();

      // Extract therapist details
      const assignedTherapists = therapistAssignments.map(assign => assign.therapistId);

      res.json({ ...bookings, assignedTherapists }); 
  } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;