const {getDistance} = require('../utils/calc');
const User = require('../models/User');

exports.suggestRoutes = async (req, res) => {
    const {startLat, startLong, endLat, endLong} = req.body;

    const distance = getDistance(startLat, startLong, endLat, endLong);

    const routes = [
        {type: "Fastest", time: Math.floor(distance/40*60) + " min", carbon: distance*0.05},
        { type: "Shortest", time: Math.floor(distance / 30 * 60) + " min", carbon: distance * 0.05 },
        { type: "Eco-Friendly", time: Math.floor(distance / 35 * 60) + " min", carbon: distance * 0.03 }
    ];

    res.json({success: true, routes});
};

exports.calculateCarbon = async (req, res) => {
    const {distance, mode} = req.body;
    const userId = req.user.id;

    const carbonSaved = distance * (mode=='bus' ? 0.05 : 0.15);

    await User.findByIdAndUpdate(userId, {$inc: {carbonSaved: carbonSaved}});

    res.json({success: true, carbonSaved});
};