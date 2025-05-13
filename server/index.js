"use strict";
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const paymentRoute = require("./routes/payment");
const getBookings = require("./routes/getBookings");
const getUsers = require("./routes/getUser");
const putUsers = require("./routes/putUsers");
const postBookings = require("./routes/postBookings");
const putBookings = require("./routes/putBookings");
const postPayment = require("./routes/payment");
const authRoutes = require("./routes/authRoutes");
const getAssignment = require("./routes/getAssignment");
const adminRoute = require("./routes/admin");
//const sms = require("./routes/sms");
const bookingsExport = require("./routes/export-bookings")
const deleteBookings = require("./routes/deleteBooking");
const textReminder = require("./routes/textReminder");
//const Booking = require("./model/bookings")
const PORT = process.env.PORT || 3003;
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());


mongoose
  .connect(process.env.MERNDBDATA)
  .then(() => console.log("Connected to Mongoose"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// const API_KEY = process.env.GEO_CODIO_API2;

// const geocodeZip = async (zip) => {
//   const url = `https://api.geocod.io/v1.7/geocode?q=${zip}&api_key=${API_KEY}`;
//   const res = await axios.get(url);
//   return res.data.results[0].location;
// };

// const updateBookingLocations = async () => {
//   await mongoose.connect(process.env.MERNDBDATA); // Replace with your DB URI

//   try {
//     const bookings = await Booking.find({
//       zipCode: { $ne: "" },
//       location: { $exists: false },
//     });

//     console.log(`Found ${bookings.length} bookings to update.`);

//     const zipCache = {}; // Avoid duplicate API calls

//     for (const booking of bookings) {
//       const zip = booking.zipCode;

//       if (!zipCache[zip]) {
//         try {
//           const loc = await geocodeZip(zip);
//           zipCache[zip] = loc;
//         } catch (err) {
//           console.error(`Failed to geocode ZIP ${zip}:`, err.message);
//           continue;
//         }
//       }

//       const { lat, lng } = zipCache[zip];
//       booking.location = { lat, lng };
//       await booking.save();

//       console.log(`✅ Updated booking ${booking._id} with ${lat}, ${lng}`);
//     }

//     console.log("✅ Finished updating bookings.");
//   } catch (err) {
//     console.error("Error updating bookings:", err);
//   } finally {
//     await mongoose.disconnect();
//   }
// };

// updateBookingLocations();

app.use(authRoutes);
app.use(getBookings);
app.use(getUsers);
app.use(putUsers);
app.use(postBookings);
app.use(putBookings);
app.use(postPayment);
app.use(getAssignment);
app.use("/admin", adminRoute);
//app.use(sms);
app.use("/delete", deleteBookings);
app.use("/api", bookingsExport);
app.use(textReminder);
// app.use('/api', paymentRoute);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
