const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
    try{
        const {email, password} = req.body;

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({success: false, message: "User already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({email, password: hashedPassword});
        await user.save();

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7*24*60*60*100   //? 7 days
        });

        res.status(201).json({
            success: true,
            message: "Signup successful",
            user: {id: user._id, email: user.email}
        });
    }
    catch(err){
        res.status(500).json({success: false, message: err.message});
    }
};

exports.login = async (req, res) => {
    try{
        const {email, password} = req.body;

        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({success: false, message: "Invalid credentials"});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(401).json({success: false, message: "Invalid credentials"});
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expires: '7d'});

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7*24*60*60*1000
        });

        res.json({
            success: true,
            message: "Login Successful",
            user: {id: user._id, email: user.email, points: user.points}
        });
    } catch(err){
        res.status(500).json({success: false, message: "Serer error"});
    }
};