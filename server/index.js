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
const bookingsExport = require("./routes/export-bookings");
const deleteBookings = require("./routes/deleteBooking");
const textReminder = require("./routes/textReminder");
const Booking = require("./model/bookings");
const SoapNotes = require("./routes/soapNotesRoutes");
const PORT = process.env.PORT || 3003;
const app = express();
const Users = require("./model/user");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());

const MONGO_URI = process.env.MERNDBDATA;
const POOL_SIZE = Number(process.env.MONGO_MAX_POOL_SIZE) || 5;

// Disable Mongoose's default query buffering. Without this, any query fired
// before the connection is ready gets silently queued and waits up to
// bufferTimeoutMS (10000ms default) before failing with a confusing
// "buffering timed out" error. Turning it off makes connection issues fail
// fast and clearly instead of hanging for 10 seconds first.
mongoose.set("bufferCommands", false);

let connectionPromise = null;

async function connectOnce() {
  if (!MONGO_URI) {
    throw new Error(
      "MONGO_URI is not defined. Check your .env and MERNDBDATA variable.",
    );
  }

  if (mongoose.connection.readyState === 1) return; // already connected

  // Reuse the same in-flight connection attempt if one is already happening,
  // instead of kicking off a second parallel connect() on concurrent cold
  // requests.
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(MONGO_URI, {
      maxPoolSize: POOL_SIZE,
      minPoolSize: 0,
      maxIdleTimeMS: 10000, // close idle connections after 10s
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      tls: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Connected to Mongoose (pool size: " + POOL_SIZE + ")");
    })
    .catch((err) => {
      // Reset so the next request can retry the connection instead of being
      // stuck on a permanently-rejected promise.
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
}

// Kick off a connection attempt at module load time too (helps warm starts /
// traditional always-on hosting), but we no longer rely on this finishing
// before traffic arrives -- the middleware below guarantees that instead.
connectOnce().catch((err) =>
  console.error("Error connecting to MongoDB:", err),
);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("SIGINT received: closing mongoose connection");
  try {
    await mongoose.connection.close(false);
    console.log("Mongoose connection closed");
    process.exit(0);
  } catch (e) {
    console.error("Error during mongoose disconnect", e);
    process.exit(1);
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Ensure the DB connection is actually ready before any route touches the
// database. On a serverless cold start, this is what prevents queries from
// firing before mongoose.connect() has resolved (which is what was causing
// the "buffering timed out after 10000ms" errors across multiple routes).
// On a warm invocation, connectOnce() returns almost immediately since
// mongoose.connection.readyState is already 1, so this adds negligible
// overhead to normal requests.
app.use(async (req, res, next) => {
  try {
    await connectOnce();
    next();
  } catch (err) {
    console.error("DB connection failed:", err);
    res.status(503).json({ message: "Database unavailable, please retry" });
  }
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
app.use(textReminder);
app.use(SoapNotes);
// app.use('/api', paymentRoute);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
