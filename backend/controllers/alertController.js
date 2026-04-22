const Report = require('../models/Report');
const User = require('../models/User');
const { awardPoints } = require('../utils/gamification');   //? Gamification: Award points for reporting

// Badge checking function — called after createAlert and upvoteAlert (verification)
async function checkAndAwardBadges(userId, io) {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        const alertCount = await Report.countDocuments({ reportedBy: userId, type: 'alert' });
        const verifiedCount = await Report.countDocuments({ reportedBy: userId, type: 'alert', upvotes: { $gte: 5 } });

        const badgesToAward = [];

        if (alertCount >= 1 && !user.badges.includes('First Report'))
            badgesToAward.push('First Report');

        if (alertCount >= 10 && !user.badges.includes('Reliable Reporter'))
            badgesToAward.push('Reliable Reporter');

        if (alertCount >= 50 && !user.badges.includes('Community Hero'))
            badgesToAward.push('Community Hero');

        if (verifiedCount >= 5 && !user.badges.includes('Verified Voice'))
            badgesToAward.push('Verified Voice');

        if ((user.carbonSaved || 0) >= 1 && !user.badges.includes('Green Guardian'))
            badgesToAward.push('Green Guardian');

        if ((user.carbonSaved || 0) >= 10 && !user.badges.includes('Eco Champion'))
            badgesToAward.push('Eco Champion');

        if (badgesToAward.length > 0) {
            await User.findByIdAndUpdate(userId, { $push: { badges: { $each: badgesToAward } } });
            if (io) {
                io.to(`user:${userId}`).emit('badge:earned', { badges: badgesToAward });
            }
        }
    } catch (err) {
        console.error('Error checking badges:', err);
    }
}

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

    await awardPoints(userId, 10);  //? 10 points for alert 

    //? Carbon saved: each alert = 0.01 kg CO2
    await User.findByIdAndUpdate(userId, {
        $inc: { honestyScore: -2, carbonSaved: 0.01 },
        $set: { lastActiveDate: new Date() }
    });

    const io = req.app.get('io');
    
    // Populate reportedBy for the socket event
    const populatedAlert = await Report.findById(alert._id).populate('reportedBy', 'email name');
    io.emit('newAlert', populatedAlert);

    // Get updated user for points event
    const updatedUser = await User.findById(userId).select('points carbonSaved badges');
    io.to(`user:${userId}`).emit('points:earned', {
        points: 10,
        reason: 'Alert created',
        total: updatedUser.points
    });

    // Check and award badges
    await checkAndAwardBadges(userId, io);

    res.json({success: true, alert: populatedAlert});
};

exports.getAlerts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const alerts = await Report.find({type: 'alert'})
        .populate('reportedBy', 'email name')
        .sort({timeStamp: -1})
        .skip(skip)
        .limit(limit);
    
    const total = await Report.countDocuments({type: 'alert'});
    
    res.json({
        success: true, 
        alerts,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
};

exports.upvoteAlert = async (req, res) => {
    const alert = await Report.findById(req.params.id);
    if (!alert){
        return res.status(404).json({success: false, message: "Alert not found"});
    }

    alert.upvotes += 1;
    await alert.save();

    const io = req.app.get('io');

    //? if many upvotes, increase reporter's honesty score + award verification bonus
    if (alert.upvotes === 5) {
        // Alert just got verified! Award bonus to reporter
        const reporterId = alert.reportedBy.toString();
        await User.findByIdAndUpdate(reporterId, {
            $inc: { honestyScore: 5, carbonSaved: 0.04 }
        });
        await awardPoints(reporterId, 25); // 25 points for verification

        const updatedReporter = await User.findById(reporterId).select('points');
        io.to(`user:${reporterId}`).emit('points:earned', {
            points: 25,
            reason: 'Alert verified by community',
            total: updatedReporter.points
        });

        // Check badges for reporter
        await checkAndAwardBadges(reporterId, io);
    } else if (alert.upvotes > 5) {
        await User.findByIdAndUpdate(alert.reportedBy, {$inc: {honestyScore: 5}});
    }

    // Award verifier points (if logged in)
    if (req.user && req.user.id) {
        const verifierId = req.user.id;
        if (verifierId !== alert.reportedBy.toString()) {
            await awardPoints(verifierId, 5); // 5 points for verifying
            const updatedVerifier = await User.findById(verifierId).select('points');
            io.to(`user:${verifierId}`).emit('points:earned', {
                points: 5,
                reason: 'Verified an alert',
                total: updatedVerifier.points
            });
        }
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
        .populate('reportedBy', 'email name')
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
        .populate('reportedBy', 'email name')
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