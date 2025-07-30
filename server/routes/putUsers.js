const express = require("express");
const User = require("../model/user");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const axios = require("axios");

const router = express.Router();
const allowedRoles = [
  "admin",
  "user",
  "therapist",
  "personal",
  "yoga",
  "group",
  "nutritionist",
  "pilates",
  "stretch",
  "cpr",
  "meditation",
  "zumba",
  "wellness",
  "ergonomics",
  "breathwork",
];
// PUT route to update user role
router.put(
  "/users/:id",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => {
    const { role } = req.body;

    // Ensure a valid role is provided
    if (!role || !Array.isArray(role)) {
      return res
        .status(400)
        .json({ message: "Role must be a non-empty array." });
    }

    const isValid = role.every((r) => allowedRoles.includes(r));
    if (!isValid) {
      return res.status(400).json({ message: "Invalid roles provided." });
    }

    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found." });
      }

      res.json({
        message: "User role updated successfully.",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Server error while updating role." });
    }
  }
);

router.put("/account/:id", async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, zip, email } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If ZIP changed, update location
    if (zip && zip !== user.zipCode) {
      const geoRes = await axios.get(
        `https://api.geocod.io/v1.7/geocode?q=${zip}&api_key=${process.env.GEO_CODIO_API}`
      );
      const location = geoRes?.data?.results?.[0]?.location;

      if (!location) {
        return res.status(400).json({ message: "Invalid ZIP code for geocoding" });
      }

      user.location = {
        lat: location.lat,
        lng: location.lng,
      };
      user.zipCode = zip;
    }

    user.username = name ?? user.username;
    user.address = address ?? user.address;
    user.phoneNumber = phone ?? user.phoneNumber;
    user.email = email ?? user.email;

    await user.save();

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
