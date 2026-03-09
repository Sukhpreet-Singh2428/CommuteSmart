const Report = require('../models/Report');
const User = require('../models/User');

exports.createAlert = async (req, res) => {
    const {message, lat, long} = req.body;
    const userId = req.user.id;

    const alert = new Report({
        type: 'alert',
        message,
        location: {type: 'Point', coordinates: [long, lat]},
        reportedBy: userId
    });

    await alert.save();

    //? Reduce honesty score slightly for every report
    await User.findByIdAndUpdate(userId, {$inc: {honestyScore: -2}});

    const io = req.app.get('io');
    io.emit('newAlert', alert);

    res.json({success: true, alert});
};

exports.getAlerts = async (req, res) => {
    const alerts = await Report.find({type: 'alert'}).sort({timeStamp: -1}).limit(20);
    res.json({success: true, alerts});
};

exports.upvoteAlert = async (req, res) => {
    const alert = await Report.findById(req.params.id);
    if (!alert){
        return res.status(404).json({success: false, message: "Alert not found"});
    }

    alert.upvotes += 1;
    await alert.save();

    //? if many upvotes, increase reporter's honesty score
    if (alert.upvotes > 5){
        await User.findByIdAndUpdate(alert.reportedBy, {$inc: {honestyScore: 5}});
    }

    res.json({success: true, alert});
};

// CONNECTED TO BACKEND: Get nearby alerts within radius
exports.getNearbyAlerts = async (req, res) => {
    const { lat, long, radius = 8 } = req.query;
    
    if (!lat || !long) {
        return res.status(400).json({success: false, message: "Latitude and longitude are required"});
    }

    try {
        const alerts = await Report.find({
            type: 'alert',
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(long), parseFloat(lat)]
                    },
                    $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
                }
            }
        })
        .populate('reportedBy', 'email')
        .sort({timeStamp: -1})
        .limit(50);

        res.json({success: true, alerts});
    } catch (error) {
        console.error('Error fetching nearby alerts:', error);
        res.status(500).json({success: false, message: "Failed to fetch nearby alerts"});
    }
};

// CONNECTED TO BACKEND: Delete own alert
exports.deleteAlert = async (req, res) => {
    const userId = req.user.id;
    
    try {
        const alert = await Report.findById(req.params.id);
        
        if (!alert) {
            return res.status(404).json({success: false, message: "Alert not found"});
        }

        // Check if user owns this alert
        if (alert.reportedBy.toString() !== userId) {
            return res.status(403).json({success: false, message: "You can only delete your own alerts"});
        }

        await Report.findByIdAndDelete(req.params.id);
        
        res.json({success: true, message: "Alert deleted successfully"});
    } catch (error) {
        console.error('Error deleting alert:', error);
        res.status(500).json({success: false, message: "Failed to delete alert"});
    }
};

// CONNECTED TO BACKEND: Get route-specific alerts with proximity checking
exports.getRouteAlerts = async (req, res) => {
    const { startLat, startLong, endLat, endLong, radius = 8 } = req.query;
    
    if (!startLat || !startLong || !endLat || !endLong) {
        return res.status(400).json({success: false, message: "Start and end coordinates are required"});
    }

    try {
        // Calculate route corridor center points (simplified - using midpoint and multiple points along route)
        const routePoints = [];
        const steps = 10; // Check 10 points along the route
        
        for (let i = 0; i <= steps; i++) {
            const lat = parseFloat(startLat) + (parseFloat(endLat) - parseFloat(startLat)) * (i / steps);
            const long = parseFloat(startLong) + (parseFloat(endLong) - parseFloat(startLong)) * (i / steps);
            routePoints.push([long, lat]); // MongoDB expects [longitude, latitude]
        }

        // Find alerts near any point on the route corridor
        const alerts = await Report.find({
            type: 'alert',
            $or: routePoints.map(point => ({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: point
                        },
                        $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
                    }
                }
            }))
        })
        .populate('reportedBy', 'email')
        .sort({timeStamp: -1})
        .limit(50);

        // Remove duplicates (alerts that might be near multiple route points)
        const uniqueAlerts = alerts.filter((alert, index, self) => 
            index === self.findIndex((a) => a._id.toString() === alert._id.toString())
        );

        res.json({success: true, alerts: uniqueAlerts});
    } catch (error) {
        console.error('Error fetching route alerts:', error);
        res.status(500).json({success: false, message: "Failed to fetch route alerts"});
    }
};