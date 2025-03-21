const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "user", "therapist"],
    default: "user",
  },
  licenseId: {
    type: String,
    default: "",
  },
  phoneNumber: {
    type: String,
    default: "",
  },
  zipCode: {
    type: String,
    default: "",
  },
  address:{
    type: String,
    default: "",
  },
  points: {
    type: Number,
    default: 0,
  },
  freehour: {
    type: Number,
    default: 1,
  },
});

module.exports = mongoose.model("Users", UserSchema);
