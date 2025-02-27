const express = require('express');
const router = express.Router();
const User = require('../model/user'); // Make sure this matches your model
const jwt = require('jsonwebtoken');

// Middleware to extract user from JWT token
const authenticateUser = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Extract token from header
    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
        req.user = decoded; // Attach user data to request
        next();
    } catch (error) {
        res.status(400).json({ error: "Invalid token." });
    }
};

// ✅ Existing route to get all users
router.get('/users', async (req, res) => {
    try {
        const allUsers = await User.find({});
        res.json(allUsers);
    } catch (error) {
        res.status(500).json({ error: "Server error." });
    }
});

// ✅ New route to get only the logged-in user
router.get('/users/me', authenticateUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // Exclude password
        if (!user) return res.status(404).json({ error: "User not found." });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Server error." });
    }
});

module.exports = router;