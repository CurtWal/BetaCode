express = require('express');
const booking = require('../model/bookings');
const router = express.Router();

router.get('/bookings', async (req, res) => {
    const myBookings = await booking.find({});
    res.send(myBookings);
});

module.exports = router;