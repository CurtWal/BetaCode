"use strict";
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const paymentRoute = require("./routes/payment");
const getBookings = require("./routes/getBookings");
const postBookings = require("./routes/postBookings");
const putBookings = require("./routes/putBookings");

const PORT = process.env.PORT || 3003;
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());

mongoose
  .connect(process.env.MERNDB)
  .then(() => console.log("Connected to Mongoose"))
  .catch((err) => console.log(err));
app.get("/", (req, res) => {
    res.send("Hello World!");
})

app.use(getBookings);
app.use(postBookings);
app.use(putBookings);
// app.use('/api', paymentRoute);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));