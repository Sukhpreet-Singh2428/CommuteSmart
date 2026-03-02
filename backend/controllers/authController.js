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
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7*24*60*60*1000
        });

        console.log('🍪 Signup cookie set:', {
            token: token.substring(0, 20) + '...',
            NODE_ENV: process.env.NODE_ENV,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
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

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7*24*60*60*1000
        });

        console.log('🍪 Login cookie set:', {
            token: token.substring(0, 20) + '...',
            NODE_ENV: process.env.NODE_ENV,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            responseHeaders: res.getHeaders()
        });

        res.json({
            success: true,
            message: "Login Successful",
            user: {id: user._id, email: user.email, points: user.points}
        });
    } catch(err){
        res.status(500).json({success: false, message: err.message});
    }
};

exports.getMe = async (req, res) => {
  try {
    // Fetch full user data from database
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({success: false, message: "User not found"});
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        points: user.points || 0,
        carbonSaved: user.carbonSaved || 0,
        badges: user.badges || [],
        honestyScore: user.honestyScore || 100
      }
    });
  } catch (error) {
    res.status(500).json({success: false, message: error.message});
  }
};

exports.logout = async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
    });
    res.json({success: true, message: "Logged out"});
};