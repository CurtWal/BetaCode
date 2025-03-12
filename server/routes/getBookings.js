express = require("express");
const booking = require("../model/bookings");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const TherapistAssignment = require("../model/AssignTherapist");
const router = express.Router();
const User = require("../model/user");
const axios = require("axios");

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 0.621371; // Return distance in miles
};

// Function to check if two zip codes are within maxDistance (in miles)
const checkZipDistance = async (zip1, zip2, maxDistance) => {
  const API_KEY = process.env.GEO_CODIO_API; // Store API Key in env variables
  try {
    const [loc1, loc2] = await Promise.all([
      axios.get(
        `https://api.geocod.io/v1.7/geocode?q=${zip1}&api_key=${API_KEY}`
      ),
      axios.get(
        `https://api.geocod.io/v1.7/geocode?q=${zip2}&api_key=${API_KEY}`
      ),
    ]);

    const { lat: lat1, lng: lon1 } = loc1.data.results[0].location;
    const { lat: lat2, lng: lon2 } = loc2.data.results[0].location;

    return getDistance(lat1, lon1, lat2, lon2) <= maxDistance; // Return true if within distance
  } catch (error) {
    console.error("Error fetching ZIP code data:", error);
    return false;
  }
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
        const allBookings = await booking.find().lean(); // Get all bookings
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
      const myBookings = await booking.find().lean(); // Convert to plain objects

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
          const isWithinDistance = await checkZipDistance(
            therapistZip,
            booking.zipCode,
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
