const express = require("express");
const router = express.Router();
const TherapistAssignment = require("../model/AssignTherapist");
const Booking = require("../model/bookings");

// Assign therapist to a booking
router.post("/assign-therapist", async (req, res) => {
    try {
        const { bookingId, therapistId } = req.body;

        // Check if the booking exists
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Check how many therapists are already assigned
        const assignedCount = await TherapistAssignment.countDocuments({ bookingId });

        if (assignedCount >= booking.therapist) {
            return res.status(400).json({ message: "Booking already has enough therapists assigned" });
        }

        // Prevent duplicate assignments
        const existingAssignment = await TherapistAssignment.findOne({ bookingId, therapistId });
        if (existingAssignment) {
            return res.status(400).json({ message: "Therapist already assigned to this booking" });
        }

        // Assign therapist
        const assignment = new TherapistAssignment({ bookingId, therapistId });
        await assignment.save();

        res.json({ message: "Therapist assigned successfully", assignment });
    } catch (error) {
        res.status(500).json({ message: "Error assigning therapist", error });
    }
});

// router.get("/therapist-assignments", async (req, res) => {
//     try {
//         const assignments = await TherapistAssignment.find()
//             .populate("bookingId") // Populate booking details
//             .populate("therapistId", "username email role"); // Populate therapist details but only return selected fields

//         res.json(assignments);
//     } catch (error) {
//         console.error("Error fetching therapist assignments:", error);
//         res.status(500).json({ message: "Error fetching therapist assignments", error });
//     }
// });


module.exports = router;