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
  environment: Environment.Production,
});

// Hardcoded minimums for promo/landing-page formTypes.
// Regular and special minimums are derived from PromoPrice in the database.
const PROMO_MINIMUMS = {
  "promo-corporate-349": 349,
};

router.post("/create-payment", async (req, res) => {
  const { sourceId, amount, currency, userId, formType, name, email, price } = req.body;

  // Reject obviously invalid amounts (zero, negative, non-numeric)
  if (!amount || typeof amount !== "number" || amount <= 0) {
    console.error(
      `[PRICE GUARD] Rejected invalid amount: formType=${formType}, amount=${amount}, email=${email}`
    );
    return res.status(400).json({
      error: "Invalid amount",
      message: "Payment amount must be a positive number.",
    });
  }

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
      promo = new PromoPrice({ regularBooking: 150, specialBooking: 90 });
      await promo.save();
    }

    // Determine minimum price based on formType.
    // Promo types use hardcoded minimums; regular/special use admin-configured rates.
    let minPrice;
    if (PROMO_MINIMUMS[formType] !== undefined) {
      minPrice = PROMO_MINIMUMS[formType];
    } else if (formType === "special") {
      minPrice = promo.specialBooking;  // e.g. $90 for 1 hour minimum
    } else {
      minPrice = promo.regularBooking;  // e.g. $150 for 1 hour minimum (default for regular + unknown types)
    }

    if (amount < minPrice) {
      console.error(
        `[PRICE GUARD] Rejected payment: formType=${formType}, amount=$${amount}, minimum=$${minPrice}, email=${email}, name=${name}`
      );
      return res.status(400).json({
        error: "Invalid amount",
        message: `Amount $${amount} is below the minimum price of $${minPrice} for this booking type.`,
      });
    }

    const regularPrice = promo.regularBooking * 100;
    const specialPrice = promo.specialBooking * 100;

    // Apply 10% discount if user has enough points
    if (user && user.points >= 3) {
      finalAmount = Math.round(finalAmount * 0.9);
      user.points -= 3;
      discountApplied = true;
    }

    // Apply free hour discount dynamically
    if (user && user.freehour === 1) {
      const discount = formType === "special" ? specialPrice : regularPrice;
      finalAmount = Math.max(0, finalAmount - discount);
      user.freehour = 0;
    }

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
        user.points += 1;
      }
      await user.save();
    }

    res.status(200).json({
      success: true,
      discountApplied,
      finalAmount,
    });

    const mg = new Mailgun(formData);
    const mailgun = mg.client({
      username: "api",
      key: process.env.MAILGUN_KEY,
    });
    try {
      const emailData = {
        from: process.env.EMAIL_USER,
        to: ["sam@massageonthegomemphis.com"],
        subject: "Booking Payment Confirmation",
        html: `<h2>Booking Payment Has been made</h2>
                <p><strong>Payment Made:</strong> $${price} Has been paid by Card</p>
                <p><strong>Paid by:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Form Type:</strong> ${formType}</p>
              `,
        "h:X-Sent-Using": "Mailgun",
        "h:X-Source": "MassageOnTheGo",
      };

      const response = await mailgun.messages.create(
        "motgpayment.com",
        emailData
      );
    } catch (error) {
      console.error("Error sending email via Mailgun:", error);
    }
  } catch (error) {
    console.error("Payment failed:", error);
    res.status(500).json({ error: "Payment failed", details: error.message });
  }
});

module.exports = router;
