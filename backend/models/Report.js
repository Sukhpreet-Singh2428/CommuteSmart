const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['location', 'alert'],
        required: true
    },
    location: {
        type: {
            type: String, 
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: [Number]   //? [longitude, latitude]
    },
    vehicleId: String,     //? e.g : Bus-13
    message: String,       //? For alerts : "Bus delay/overcrowded"
    upvotes: {
        type: Number,
        default: 0
    },
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