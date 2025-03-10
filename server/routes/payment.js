const express = require("express");
const { Client, Environment } = require("square/legacy");
const { randomUUID } = require("crypto");
const User = require("../model/user");

const router = express.Router();

// Make sure you have the SQUARE_ACCESS_TOKEN in your .env file
const accessToken = process.env.Token2;

if (!accessToken) {
  console.error("SQUARE_ACCESS_TOKEN is not set in the environment variables");
  process.exit(1);
}

const client = new Client({
  accessToken: accessToken,
  environment: Environment.Sandbox, // Use Environment.Production for live transactions
});

router.post("/create-payment", async (req, res) => {
  console.log("Received payment request:", req.body);
  const { sourceId, amount, currency, userId, formType } = req.body;

  let finalAmount = amount * 100;
  let discountApplied = false;
  let user = null;

  try {
    // Fetch user before modifying points
    if (userId) {
      user = await User.findById(userId);
      if (user && user.points >= 3) {
        finalAmount = Math.round(finalAmount * 0.9); // Apply 10% discount
        user.points -= 3; // Deduct 3 points
        discountApplied = true;
      }
      if (user && user.freehour === 1) {
        if (formType === "special") {
          // Apply only special price for free hour (e.g., $90 instead of $150)
          finalAmount = finalAmount - 9000; // 90 * 100 = 9000 cents
        } else {
          // Apply regular price for free hour (e.g., $150)
          finalAmount = finalAmount - 15000; // 150 * 100 = 15000 cents
        }
        user.freehour = 0;
      }
    }
    console.log(finalAmount, ": ", formType);
    // Process payment with Square
    const response = await client.paymentsApi.createPayment({
      sourceId: sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: finalAmount,
        currency: currency,
      },
    });

    // If user exists, update points correctly
    if (user) {
      if (!discountApplied) {
        user.points += 1; // Add point only if no discount was used
      }
      await user.save();
      console.log(`User ${user.username} now has ${user.points} points.`);
    }

    console.log("Payment successful:", response.result);
    res.status(200).json({
      success: true,
      discountApplied,
      finalAmount,
    });
  } catch (error) {
    console.error("Payment failed:", error);
    res.status(500).json({ error: "Payment failed", details: error.message });
  }
});

module.exports = router;
