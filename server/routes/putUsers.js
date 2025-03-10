const express = require("express");
const User = require("../model/user");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");

const router = express.Router();

// PUT route to update user role
router.put(
  "/users/:id",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => {
    const { role } = req.body;

    // Ensure a valid role is provided
    if (!["admin", "user", "therapist", "special"].includes(role)) {
      return res.status(400).json({ message: "Invalid role provided." });
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

module.exports = router;
