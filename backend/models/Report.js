const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['location', 'alert'],
        required: true
    },
    // Alert-specific subtype: traffic, accident, delay, construction, weather, info
    alertType: {
        type: String,
        enum: ['traffic', 'accident', 'delay', 'construction', 'weather', 'info', 'clear', 'general'],
        default: 'traffic'
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    location: {
        type: {
            type: String, 
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: [Number]   //? [longitude, latitude]
    },
    // Human-readable location text, e.g. "Sector 17 Chowk"
    locationText: {
        type: String,
        default: ''
    },
    area: {
        type: String,
        default: ''
    },
    routeFrom: {
        type: String,
        default: ''
    },
    routeTo: {
        type: String,
        default: ''
    },
    vehicleId: String,     //? e.g : Bus-13
    message: String,       //? For alerts : "Bus delay/overcrowded"
    // Upvotes: array of user ObjectIds for toggle support
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Backward compat: numeric upvote count (deprecated, kept for migration)
    upvoteCount: {
        type: Number,
        default: 0
    },
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: String,
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    timeStamp: {
        type: Date,
        default: Date.now
    }
});

reportSchema.index({location: '2dsphere'});

module.exports = mongoose.model('Report', reportSchema);