express = require("express");
const bookings = require("../model/bookings");
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

module.exports = router;
