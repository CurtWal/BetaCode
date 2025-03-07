const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../model/user');
const router = express.Router();

//Register User
router.post('/register', async (req, res) => {
    const {username, email, password, role} = req.body;
    try {
        //Check if user already exists
        const user = await User.findOne({email});
        if(user) return res.status(400).json({error: 'User already exists'});

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User ({username, email, password: hashedPassword, role})
        await newUser.save();
        res.status(201).json({message: "User registered successfully"})
    }catch(err){
        res.status(500).json({message: err.message})
    }
    });

    // Register Therapist
router.post('/therapistregister', async (req, res) => {
    const {username, email, password, role, licenseId, phoneNumber} = req.body;
    try {
        //Check if user already exists
        const user = await User.findOne({email});
        if(user) return res.status(400).json({error: 'User already exists'});

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User ({username, email, password: hashedPassword, role, licenseId, phoneNumber})
        await newUser.save();
        res.status(201).json({message: "User registered successfully"})
    }catch(err){
        res.status(500).json({message: err.message})
    }
    });

    //Login User
router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    try{
        const user = await User.findOne({email});
        if(!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        
        if(!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({id: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: "10hr"});
        res.json({token, role: user.role, userId: user._id, username: user.username});
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
})

module.exports = router;