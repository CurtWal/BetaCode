const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../model/user");
const router = express.Router();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_KEY);

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
    res.json({
      token,
      role: user.role,
      userId: user._id,
      username: user.username,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

module.exports = router;
