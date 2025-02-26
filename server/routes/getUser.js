express = require('express');
const users = require('../model/user');

const router = express.Router();

router.get('/users', async (req, res)=>{
    const myUsers = await users.find({});
    res.send(myUsers);
})

module.exports = router;