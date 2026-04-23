const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    routeFrom: {
        type: String,
        required: true
    },
    routeTo: {
        type: String,
        required: true
    },
    distanceKm: {
        type: Number,
        required: true
    },
    transportMode: {
        type: String,
        enum: ['bus', 'metro', 'bike', 'walk'],
        default: 'bus'
    },
    carbonSaved: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Trip', tripSchema);
