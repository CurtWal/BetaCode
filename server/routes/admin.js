const express = require("express");
const PromoPrice = require("../model/PromoPrice");
const router = express.Router();

// Get current free hour status
router.get("/freehour-status", async (req, res) => {
  try {
    let promo = await PromoPrice.findOne();
    if (!promo) {
      promo = new PromoPrice({ freeHourEnabled: true }); // Default value
      await promo.save();
    }
    res.json({ freeHourEnabled: promo.freeHourEnabled });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving free hour status", error });
  }
});

// Toggle free hour status
router.post("/toggle-freehour", async (req, res) => {
  try {
    let promo = await PromoPrice.findOne();
    if (!promo) {
      promo = new PromoPrice({ freeHourEnabled: req.body.status });
    } else {
      promo.freeHourEnabled = req.body.status;
    }
    await promo.save();

    res.json({
      message: `Free hour promotion is now ${promo.freeHourEnabled ? "ON" : "OFF"}`,
      freeHourEnabled: promo.freeHourEnabled,
    });
  } catch (error) {
    res.status(500).json({ message: "Error toggling free hour", error });
  }
});

router.get("/booking-prices", async (req, res) => {
  try {
    let price = await PromoPrice.findOne();
    if (!price) {
      price = new PromoPrice({ regularBooking: 150, specialBooking: 90 }); // Default values
      await price.save();
    }
    res.json(price);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving prices", error });
  }
});

// Update prices
router.post("/update-prices", async (req, res) => {
  try {
    const { regularBooking, specialBooking } = req.body;
    let price = await PromoPrice.findOne();

    if (!price) {
      price = new PromoPrice({ regularBooking, specialBooking });
    } else {
      price.regularBooking = regularBooking;
      price.specialBooking = specialBooking;
    }

    await price.save();
    res.json({ message: "Prices updated successfully", price });
  } catch (error) {
    res.status(500).json({ message: "Error updating prices", error });
  }
});

module.exports = router;
