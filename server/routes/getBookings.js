express = require('express');
const booking = require('../model/bookings');
const { verifyToken, checkRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get('/bookings', verifyToken, checkRole(["admin"]), async (req, res) => {
    const myBookings = await booking.find({});
    res.send(myBookings);
});

module.exports = router;