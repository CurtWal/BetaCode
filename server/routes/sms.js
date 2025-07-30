const express = require("express");
const axios = require("axios");
const router = express.Router();
const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const PhoneNumber = process.env.TWILIO_NUMBER;
const client = twilio(accountSid, authToken);

router.get("/send-sms", async (req, res) =>{
    const phoneNumbers = ["+19012777280"]; // Add +1 for US numbers
    const results = [];
  
    try {
      for (const number of phoneNumbers) {
        const message = await client.messages.create({
          body: "Booking is available please check it out!!!",
          from: PhoneNumber,
          to: number,
        });
  
        console.log(`Sent to ${number}: SID ${message.sid}`);
        results.push({ number, sid: message.sid });
      }
  
      res.status(200).json({ message: "SMS sent to all", results });
    } catch (err) {
      console.error("Failed to send SMS:", err);
      res.status(500).json({ message: "Failed to send SMS", error: err.message });
    }
})

module.exports = router









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