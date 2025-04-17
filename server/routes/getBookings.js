express = require("express");
const booking = require("../model/bookings");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const TherapistAssignment = require("../model/AssignTherapist");
const router = express.Router();
const User = require("../model/user");
const axios = require("axios");

const checkLocationDistance = (lat1, lon1, lat2, lon2, maxMiles) => {
  const toRad = (deg) => deg * Math.PI / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c <= maxMiles;
};

// Endpoint to fetch bookings filtered by therapist's zip code distance
router.get(
  "/bookings",
  verifyToken,
  checkRole(["admin", "therapist"]),
  async (req, res) => {
    try {
      const userId = req.user.id; // Assuming user ID is in the token
      const userRole = req.user.role; // Assuming user role is in the token

      // If the user is an admin, fetch all bookings
      if (userRole === "admin") {
        const allBookings = await booking.find({ confirmed: true }).lean(); // Get all bookings
        const updatedBookings = await populateAssignedTherapists(allBookings);
        return res.json(updatedBookings); // Return all bookings for admin
      }

      // If the user is a therapist, filter bookings based on proximity
      const therapist = await User.findById(userId).lean();
      if (!therapist) {
        return res.status(404).json({ error: "Therapist not found" });
      }

      const therapistZip = therapist.zipCode; // Get therapist's zip code

      // Fetch all bookings
      const myBookings = await booking.find({confirmed: true}).lean(); // Convert to plain objects

      // Fetch therapist assignments and populate therapist details
      const therapistAssignments = await TherapistAssignment.find()
        .populate("therapistId", "username email role") // Only fetch therapist details
        .lean();

      // Attach assigned therapists to their respective bookings
      const updatedBookings = await Promise.all(
        myBookings.map(async (booking) => {
          const assignedTherapists = therapistAssignments
            .filter(
              (assignment) =>
                assignment.bookingId.toString() === booking._id.toString()
            )
            .map((assignment) => assignment.therapistId); // Extract therapist details

          // Check if the booking is within 1 hour of therapist's zip code
          const isWithinDistance = checkLocationDistance(
            booking.location.lat,
            booking.location.lng,
            therapist.location.lat,
            therapist.location.lng,
            92
          ); // 60 miles = 1 hour

          return { ...booking, assignedTherapists, isWithinDistance };
        })
      );

      // Filter out bookings that are not within 1 hour distance from the therapist
      const filteredBookings = updatedBookings.filter(
        (booking) => booking.isWithinDistance
      );

      // console.log(
      //   "Filtered Bookings:",
      //   JSON.stringify(filteredBookings, null, 2)
      // ); // Debugging log

      res.json(filteredBookings); // Return filtered bookings for therapist
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Helper function to populate therapist details in bookings
const populateAssignedTherapists = async (bookings) => {
  const therapistAssignments = await TherapistAssignment.find()
    .populate("therapistId", "username email role")
    .lean();

  return bookings.map((booking) => {
    const assignedTherapists = therapistAssignments
      .filter(
        (assignment) =>
          assignment.bookingId.toString() === booking._id.toString()
      )
      .map((assignment) => assignment.therapistId);
    return { ...booking, assignedTherapists };
  });
};

router.get("/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Find the booking
    const bookings = await booking.findById(id).lean();
    if (!bookings) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Find assigned therapists
    const therapistAssignments = await TherapistAssignment.find({
      bookingId: id,
    })
      .populate("therapistId", "username email") // Get therapist details
      .lean();

    // Extract therapist details
    const assignedTherapists = therapistAssignments.map(
      (assign) => assign.therapistId
    );

    res.json({ ...bookings, assignedTherapists });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
