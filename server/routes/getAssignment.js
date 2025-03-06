const express = require("express");
const router = express.Router();
const TherapistAssignment = require("../model/AssignTherapist");
const Booking = require("../model/bookings");
const User = require("../model/user"); // Assuming User model contains therapist data
const nodemailer = require("nodemailer");

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

        // Calculate remaining spots dynamically
        const remainingSpots = booking.therapist - assignedCount - 1;

        // Fetch all therapists
        const allTherapists = await User.find({ role: "therapist" }, "email _id");

        // Find remaining therapists who haven't joined yet
        const assignedTherapists = await TherapistAssignment.find({ bookingId });
        const assignedTherapistIds = assignedTherapists.map(t => t.therapistId.toString());

        const remainingTherapists = allTherapists.filter(
            therapist => !assignedTherapistIds.includes(therapist._id.toString())
        );

        const remainingEmails = remainingTherapists.map(therapist => therapist.email);

        let emailSent = false;
        if (remainingEmails.length > 0) {
            try {
                const transporter = nodemailer.createTransport({
                    service: "yahoo",
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: remainingEmails,
                    subject: "Booking Spot Still Available!",
                    html: `
                        <h2>Booking Spots Are Filling Up!</h2>
                        <p>A booking still has available therapist spots.</p>
                        <p><strong>Client Name:</strong> ${booking.name}</p>
                        <p><strong>Location:</strong> ${booking.address}</p>
                        <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
                        <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
                        <p><strong>Increment:</strong> ${booking.eventIncrement} minutes</p>
                        <p><strong>Remaining Spots:</strong> ${remainingSpots}</p>
                        <p>Hurry up and claim your spot before it's full!</p>
                    `,
                };

                await transporter.sendMail(mailOptions);
                emailSent = true;
            } catch (emailError) {
                console.error("Error sending email:", emailError);
            }
        }

        res.json({
            message: "Therapist assigned successfully",
            assignment,
            remainingSpots,
            emailSent, // Indicate whether an email was sent
        });

    } catch (error) {
        console.error("Error assigning therapist:", error);
        res.status(500).json({ message: "Error assigning therapist", error });
    }
});

router.post("/send-email-on-spot-fill", async (req, res) => {
    try {
        const { bookingId } = req.body;

        // Check if the booking exists
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Check assigned therapist count
        const assignedCount = await TherapistAssignment.countDocuments({ bookingId });
        const remainingSpots = booking.therapist - assignedCount;

        if (remainingSpots > 0) {
            return res.status(400).json({ message: "Spots are not filled yet. Can't send email." });
        }

        // Fetch assigned therapist details
        const assignedTherapists = await TherapistAssignment.find({ bookingId }).populate("therapistId", "username email");

        // Collect therapist info
        const therapistInfo = assignedTherapists.map(t => {
            return `<p><strong>Name:</strong> ${t.therapistId.username} <br> <strong>Email:</strong> ${t.therapistId.email}</p>`;
        }).join('');

        const finalEmailOptions = {
            from: process.env.EMAIL_USER,
            to: ["curtrickwalton@gmail.com"], // Client's email
            subject: "All Therapist Spots Have Been Filled!",
            html: `
                <h2>All Therapist Spots Have Been Filled!</h2>
                <p>Good news! All therapist spots for your booking have been successfully filled.</p>
                <p><strong>Booking Details:</strong></p>
                <p><strong>Client Name:</strong> ${booking.name}</p>
                <p><strong>Location:</strong> ${booking.address}</p>
                <p><strong>ZipCode:</strong> ${booking.zipCode}</p>
                <p><strong>Hours:</strong> ${booking.eventHours} hour(s)</p>
                <p><strong>Increment:</strong> ${booking.eventIncrement} minutes</p>
                <p><strong>Price:</strong> $${booking.price}</p>
                <p><strong>Assigned Therapists:</strong></p>
                ${therapistInfo}
                <p>Thank you for using our service!</p>
            `,
        };

        const transporter = nodemailer.createTransport({
            service: "yahoo",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail(finalEmailOptions);
        console.log(`Email sent to client for booking ${booking._id}`);

        res.json({ message: "Email sent to the client with therapist details" });

    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: "Error sending email", error });
    }
});
module.exports = router;
