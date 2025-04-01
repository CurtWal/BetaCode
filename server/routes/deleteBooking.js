const express = require("express");
const router = express.Router();
const Booking = require("../model/bookings");
const AssignTherapist = require("../model/AssignTherapist");

// Delete booking and remove assigned therapist records
router.delete("/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Delete assigned therapist records for this booking
    await AssignTherapist.deleteMany({ bookingId: id });

    // Delete the booking itself
    await Booking.findByIdAndDelete(id);

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Server error deleting booking" });
  }
});

module.exports = router;