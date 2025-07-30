const express = require("express");
const router = express.Router();
const User = require("../model/user"); // Make sure this matches your model
const jwt = require("jsonwebtoken");

// Middleware to extract user from JWT token
const authenticateUser = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Extract token from header
  if (!token)
    return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
    req.user = decoded; // Attach user data to request
    next();
  } catch (error) {
    res.status(400).json({ error: "Invalid token." });
  }
};

// ✅ Existing route to get all users
router.get("/users", async (req, res) => {
  try {
    const allUsers = await User.find({});
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: "Server error." });
  }
});

// ✅ New route to get only the logged-in user
router.get("/users/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error." });
  }
});

router.get("/api/therapist/:id", async (req, res) => {
  try {
    const therapist = await User.findById(req.params.id);
    if (!therapist) {
      return res.status(404).json({ message: "Therapist not found" });
    }
    res.json({ zipCode: therapist.zipCode });
  } catch (error) {
    res.status(500).json({ message: "Error fetching therapist data", error });
  }
});
router.get("/account/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ username: user.username, address: user.address, phone: user.phoneNumber, zipCode: user.zipCode, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ message: "Error fetching User data", error });
  }
});
module.exports = router;
