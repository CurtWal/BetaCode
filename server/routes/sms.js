// const express = require("express");
// const axios = require("axios");
// const router = express.Router();

// // Your Mailgun API credentials
// const MAILGUN_DOMAIN = "motgpayment.com"; // Example: "sandboxxxxxxxxxxxxx.mailgun.org"


// router.post("/send-sms", async (req, res) => {
//     const { phoneNumber, message } = req.body;

//     // AT&T SMS Gateway
//     const recipient = [`9012777280@txt.att.net`,]; 

//     try {
//         const response = await axios.post(
//             `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
//             new URLSearchParams({
//                 from: "no-reply@motgpayment.com",
//                 to: recipient,
//                 subject: "SMS Notification", // Subject (may be ignored for SMS)
//                 text: message, // SMS Body
//             }),
//             {
//                 auth: {
//                     username: "api",
//                     password: process.env.MAILGUN_KEY,
//                 },
//             }
//         );

//         console.log("Mailgun Response:", response.data);
//         res.json({ success: true, message: "Text sent successfully" });
//     } catch (error) {
//         console.error("Error sending SMS:", error.response?.data || error.message);
//         res.status(500).json({ success: false, error: "Failed to send text" });
//     }
// });

// module.exports = router;


// // AT&T	number@txt.att.net
// // Boost Mobile	number@sms.myboostmobile.com
// // Cricket Wireless	number@sms.cricketwireless.net
// // Google Fi	number@msg.fi.google.com
// // MetroPCS	number@mymetropcs.com
// // Sprint	number@messaging.sprintpcs.com
// // T-Mobile	number@tmomail.net
// // US Cellular	number@email.uscc.net
// // Verizon	number@vtext.com
// // Virgin Mobile	number@vmobl.com