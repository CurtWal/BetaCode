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
// app.use('/api', paymentRoute);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
