express = require('express');
const bookings = require('../model/bookings');
const router = express.Router();

router.post('/new-booking', async (req, res) => {
    try{
        const newBooking = await bookings.create(req.body);
        res.send(newBooking);
    }catch(err){
        res.status(500).send(err);
    }
})
module.exports = router;