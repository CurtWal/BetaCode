const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../model/user");
const router = express.Router();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_KEY);
const axios = require("axios");

const formData = require("form-data");
const Mailgun = require("mailgun.js");

//Register User
router.post("/register", async (req, res) => {
  const { username, email, password, role, freehour } = req.body;
  try {
    //Check if user already exists
    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      freehour,
    });
    await newUser.save();
    const mg = new Mailgun(formData);
    const mailgun = mg.client({
      username: "api",
      key: process.env.MAILGUN_KEY, // Add this to your .env file // Default Mailgun API URL
    });
    try {
      const emailData = {
        from: process.env.EMAIL_USER, // Must be a verified Mailgun sender
        to: ["hello@massageonthegomemphis.com", "sam@massageonthegomemphis.com"], // Recipient email
        subject: "New User Registered",
        html: `
          <h2>New User Details</h2>
          <p><strong>Name:</strong> ${newUser.username}</p>
          <p><strong>Email:</strong> ${newUser.email}</p>`,
        "h:X-Sent-Using": "Mailgun",
        "h:X-Source": "MassageOnTheGo",
      };

      const response = await mailgun.messages.create(
        "motgpayment.com", // Your Mailgun domain (e.g., "mg.yourdomain.com")
        emailData
      );

      console.log("Mailgun Response:", response);
    } catch (error) {
      console.error("Error sending email via Mailgun:", error);
    }
    // const mailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: ["hello@massageonthegomemphis.com", "sam@massageonthegomemphis.com"], // Change to actual email recipients
    //   subject: "New User Registered",
    //   html: `
    //             <h2>New User Details</h2>
    //             <p><strong>Name:</strong> ${newUser.username}</p>
    //             <p><strong>Email:</strong> ${newUser.email}</p>
    //           `,
    // };

    // // Send email
    // await sgMail
    //   .send(mailOptions)
    //   .then(() => {
    //     console.log("Email sent");
    //   })
    //   .catch((error) => {
    //     console.error(error);
    //   });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register Therapist
router.post("/therapistregister", async (req, res) => {
  const {
    username,
    email,
    password,
    role,
    licenseId,
    phoneNumber,
    zipCode,
    address,
  } = req.body;
  try {
        const geoRes = await axios.get(
          `https://api.geocod.io/v1.7/geocode?q=${zipCode}&api_key=${process.env.GEO_CODIO_API}`
        );
        location = geoRes?.data?.results?.[0]?.location || null;
      } catch (error) {
        console.error("Geocoding failed:", error.message);
      }
  try {
    //Check if user already exists
    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      licenseId,
      phoneNumber,
      zipCode,
      address,
      location,
    });
    await newUser.save();
    const mg = new Mailgun(formData);
    const mailgun = mg.client({
      username: "api",
      key: process.env.MAILGUN_KEY, // Add this to your .env file // Default Mailgun API URL
    });
    try {
      const emailData = {
        from: process.env.EMAIL_USER, // Must be a verified Mailgun sender
        to: ["hello@massageonthegomemphis.com", "sam@massageonthegomemphis.com"], // Recipient email
        subject: "New Therapist Registered",
        html: `
            <h2>New Therapist Details</h2>
            <p><strong>Name:</strong> ${newUser.username}</p>
            <p><strong>Email:</strong> ${newUser.email}</p>
            <p><strong>License ID:</strong> ${newUser.licenseId}</p>
            <p><strong>Phone Number:</strong> ${newUser.phoneNumber}</p>
            <p><strong>Zip Code:</strong> ${newUser.zipCode}</p>
            <p><strong>Address:</strong> ${newUser.address}</p>
          `,
      };

      const response = await mailgun.messages.create(
        "motgpayment.com", // Your Mailgun domain (e.g., "mg.yourdomain.com")
        emailData
      );

      console.log("Mailgun Response:", response);
    } catch (error) {
      console.error("Error sending email via Mailgun:", error);
    }
    // const mailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: ["curtrickwalton@gmail.com"], // Change to actual email recipients
    //   subject: "New Therapist Registered",
    //   html: `
    //         <h2>New Therapist Details</h2>
    //         <p><strong>Name:</strong> ${newUser.username}</p>
    //         <p><strong>Email:</strong> ${newUser.email}</p>
    //         <p><strong>License ID:</strong> ${newUser.licenseId}</p>
    //         <p><strong>Phone Number:</strong> ${newUser.phoneNumber}</p>
    //         <p><strong>Zip Code:</strong> ${newUser.zipCode}</p>
    //         <p><strong>Address:</strong> ${newUser.address}</p>
    //       `,
    // };

    // // Send email
    // await sgMail
    //   .send(mailOptions)
    //   .then(() => {
    //     console.log("Email sent");
    //   })
    //   .catch((error) => {
    //     console.error(error);
    //   });
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Login User
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "10hr" }
    );

    console.log("Login successful for:", user.username);

    res.json({
      token,
      role: user.role,
      userId: user._id,
      username: user.username,
    });
  } catch (err) {
    console.error("Login Error:", err.message, err.stack);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/request-password-reset", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    console.log("User: ", user)
    if (!user) return res.status(404).json({ error: "User not found" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const resetLink = `https://motgpayment.com/reset-password/${token}`;
    const mg = new Mailgun(formData);
    const mailgun = mg.client({
      username: "api",
      key: process.env.MAILGUN_KEY, // Add this to your .env file // Default Mailgun API URL
    });
    const msg = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset Request",
      html: `
        <p>Hello ${user.username},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 1 hour.</p>
      `,
    };

      await mailgun.messages.create(
      "motgpayment.com", // Your Mailgun domain (e.g., "mg.yourdomain.com")
      msg
    );
    // console.log("Mailgun Response:", response);
    res.status(200).json({ message: "Password reset link sent" });
  } catch (err) {
    console.error("Error sending reset email:", err.response?.body || err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(400).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;
