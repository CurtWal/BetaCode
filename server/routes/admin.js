const express = require("express");
const router = express.Router();

let freeHourEnabled = true; // Default is enabled

// Get current free hour status
router.get("/freehour-status", (req, res) => {
  res.json({ freeHourEnabled });
});

// Toggle free hour status
router.post("/toggle-freehour", (req, res) => {
  freeHourEnabled = req.body.status;
  res.json({
    message: `Free hour promotion is now ${freeHourEnabled ? "ON" : "OFF"}`,
  });
});

module.exports = router;
