express = require("express");
const bookings = require("../model/bookings");
const Medicalbookings = require("../model/medicalBookings");
const router = express.Router();

router.put("/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // Get updated value from request

    const updatedBooking = await bookings.findByIdAndUpdate(
      id, updateData, { new: true } // Return updated document
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//Medical Bookings
router.put("/medical-bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // Get updated value from request

    const updatedBooking = await Medicalbookings.findByIdAndUpdate(
      id, updateData, { new: true } // Return updated document
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Server error" });
  }
});
//Auto mark bookings as complete if therapist doesn't
router.get("/cron/mark-complete", async (req, res) => {
  try {
    const now = new Date();
    const booking = await bookings.find({ isComplete: false });

    for (let books of booking) {
      const bookingDateTime = new Date(`${books.date}T${books.endTime}`);
      if (bookingDateTime < now) {
        books.isComplete = true;
        await books.save();
      }
    }

    res.status(200).json({ message: "Checked and updated overdue bookings." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error processing cron task." });
  }
});

module.exports = router;
