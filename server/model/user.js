const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ['admin', 'user', "therapist", "special"],
        default: 'user'
    },
    points:{
        type: Number,
        default: 0
    },
    freehour:{
        type: Number,
        default: 1
    }
});

module.exports = mongoose.model('User', UserSchema);