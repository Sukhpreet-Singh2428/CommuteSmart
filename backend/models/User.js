const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        default: ''
    },
    username: {
        type: String,
        unique: true,
        sparse: true
    },
    bio: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: 'Chandigarh'
    },
    profilePhoto: {
        type: String,
        default: ''
    },
    email : {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function() { return this.authProvider === 'local'; }
    },
    googleId: {
        type: String,
        sparse: true,
        default: null
    },
    githubId: {
        type: String,
        sparse: true,
        default: null
    },
    appleId: {
        type: String,
        sparse: true,
        default: null
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'apple', 'github'],
        default: 'local'
    },

    // ── Email verification ───────────────────────────────────────
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationOTP: {
        type: String,
        select: false,
        default: null
    },
    emailVerificationExpiry: {
        type: Date,
        select: false,
        default: null
    },
    emailVerificationAttempts: {
        type: Number,
        default: 0
    },
    lastVerificationRequest: {
        type: Date,
        select: false,
        default: null
    },

    // ── Password reset OTP ───────────────────────────────────────
    resetOtp: {
        type: String,
        default: null
    },
    resetOtpExpiry: {
        type: Date,
        default: null
    },
    resetOtpAttempts: {
        type: Number,
        default: 0
    },
    favourites: [{type: String}],
    points: {
        type: Number,
        default: 0
    },
    carbonSaved: {
        type: Number,
        default: 0
    },
    badges: [{type: String}],
    honestyScore: {
        type: Number,
        default: 100
    },
    lastActiveDate: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("User", userSchema);