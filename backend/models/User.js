const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
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
        required: true
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