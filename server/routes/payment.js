const express = require("express");
const { Client, Environment } = require("square/legacy");
const { randomUUID } = require("crypto");
const User = require("../model/user");
const PromoPrice = require("../model/PromoPrice");
const router = express.Router();
const formData = require("form-data");
const Mailgun = require("mailgun.js");

// Make sure you have the SQUARE_ACCESS_TOKEN in your .env file
const accessToken = process.env.Token;

if (!accessToken) {
  console.error("SQUARE_ACCESS_TOKEN is not set in the environment variables");
  process.exit(1);
}

const client = new Client({
  accessToken: accessToken,
  environment: Environment.Production, // Use Environment.Production for live transactions
});

router.post("/create-payment", async (req, res) => {
  //   console.log("Received payment request:", req.body);
  const { sourceId, amount, currency, userId, formType, name, email, price } = req.body;

  let finalAmount = amount * 100;
  let discountApplied = false;
  let user = null;

  try {
    // Fetch user before modifying points
    if (userId) {
      user = await User.findById(userId);
    }

    // Fetch pricing details from the database
    let promo = await PromoPrice.findOne();
    if (!promo) {
      promo = new PromoPrice({ regularBooking: 150, specialBooking: 90 }); // Set defaults if not found
      await promo.save();
    }

    const regularPrice = promo.regularBooking * 100; // Convert to cents
    const specialPrice = promo.specialBooking * 100; // Convert to cents

    // Apply 10% discount if user has enough points
    if (user && user.points >= 3) {
      finalAmount = Math.round(finalAmount * 0.9); // Apply 10% discount
      user.points -= 3; // Deduct 3 points
      discountApplied = true;
    }

    // Apply free hour discount dynamically
    if (user && user.freehour === 1) {
      const discount = formType === "special" ? specialPrice : regularPrice;
      finalAmount = Math.max(0, finalAmount - discount); // Ensure it doesn't go negative
      user.freehour = 0; // Reset free hour after use
    }
    // console.log(finalAmount, ": ", formType);
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
      //   console.log(`User ${user.username} now has ${user.points} points.`);
    }

    // console.log("Payment successful:", response.result);
    res.status(200).json({
      success: true,
      discountApplied,
      finalAmount,
    });

    const mg = new Mailgun(formData);
    const mailgun = mg.client({
      username: "api",
      key: process.env.MAILGUN_KEY, // Add this to your .env file // Default Mailgun API URL
    });
    try {
      const emailData = {
        from: process.env.EMAIL_USER, // Must be a verified Mailgun sender
        to: ["sam@massageonthegomemphis.com"], // Recipient email
        subject: "Booking Payment Confirmation",
        html: `<h2>Booking Payment Has been made</h2>
                <p><strong>Payment Made:</strong> $${price} Has been paid by Card</p>
                <p><strong>Paid by:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
              `,
        "h:X-Sent-Using": "Mailgun",
        "h:X-Source": "MassageOnTheGo",
      };

      const response = await mailgun.messages.create(
        "motgpayment.com", // Your Mailgun domain (e.g., "mg.yourdomain.com")
        emailData
      );

      //console.log("Mailgun Response:", response);
    } catch (error) {
      console.error("Error sending email via Mailgun:", error);
    }
  } catch (error) {
    console.error("Payment failed:", error);
    res.status(500).json({ error: "Payment failed", details: error.message });
  }
});

module.exports = router;
