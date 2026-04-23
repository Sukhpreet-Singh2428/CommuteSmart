const Trip = require('../models/Trip');
const User = require('../models/User');

// Badge checking function (imported pattern from alertController)
async function checkAndAwardBadges(userId, io) {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        const Report = require('../models/Report');
        const alertCount = await Report.countDocuments({ reportedBy: userId, type: 'alert' });
        const tripCount = await Trip.countDocuments({ userId });

        const badgesToAward = [];

        if (alertCount >= 1 && !user.badges.includes('First Report'))
            badgesToAward.push('First Report');

        if (alertCount >= 10 && !user.badges.includes('Reliable Reporter'))
            badgesToAward.push('Reliable Reporter');

        if (alertCount >= 50 && !user.badges.includes('Community Hero'))
            badgesToAward.push('Community Hero');

        if ((user.carbonSaved || 0) >= 1 && !user.badges.includes('Green Guardian'))
            badgesToAward.push('Green Guardian');

        if ((user.carbonSaved || 0) >= 10 && !user.badges.includes('Eco Champion'))
            badgesToAward.push('Eco Champion');

        if (tripCount >= 1 && !user.badges.includes('Trip Starter'))
            badgesToAward.push('Trip Starter');

        if (badgesToAward.length > 0) {
            await User.findByIdAndUpdate(userId, { $push: { badges: { $each: badgesToAward } } });
            if (io) {
                io.to(`user:${userId}`).emit('badge:earned', { badges: badgesToAward });
            }
        }
    } catch (err) {
        console.error('Error checking badges in tripController:', err);
    }
}

// POST /api/trips — log a confirmed trip
exports.createTrip = async (req, res) => {
    try {
        const userId = req.user.id;
        const { routeFrom, routeTo, distanceKm, transportMode, carbonSaved } = req.body;

        if (!routeFrom || !routeTo || !distanceKm) {
            return res.status(400).json({ success: false, message: 'routeFrom, routeTo, and distanceKm are required' });
        }

        // Create trip document
        const trip = new Trip({
            userId,
            routeFrom,
            routeTo,
            distanceKm: parseFloat(distanceKm),
            transportMode: transportMode || 'bus',
            carbonSaved: parseFloat(carbonSaved) || 0
        });
        await trip.save();

        // Update user: increment carbonSaved and points
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $inc: { carbonSaved: parseFloat(carbonSaved) || 0, points: 20 },
                $set: { lastActiveDate: new Date() }
            },
            { new: true }
        ).select('-password');

        const io = req.app.get('io');

        // Emit points earned event to user's personal room
        if (io) {
            io.to(`user:${userId}`).emit('points:earned', {
                points: 20,
                reason: 'Trip confirmed',
                total: updatedUser.points
            });
        }

        // Check and award badges
        await checkAndAwardBadges(userId, io);

        res.json({
            success: true,
            trip,
            carbonSaved: updatedUser.carbonSaved,
            points: updatedUser.points
        });
    } catch (err) {
        console.error('Error creating trip:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/trips/me — get user's trips
exports.getMyTrips = async (req, res) => {
    try {
        const userId = req.user.id;
        const trips = await Trip.find({ userId }).sort({ createdAt: -1 }).limit(50);

        const totalDistance = trips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
        const totalCarbon = trips.reduce((sum, t) => sum + (t.carbonSaved || 0), 0);

        res.json({
            success: true,
            trips,
            stats: {
                totalTrips: trips.length,
                totalDistance: Math.round(totalDistance * 10) / 10,
                totalCarbonSaved: Math.round(totalCarbon * 100) / 100
            }
        });
    } catch (err) {
        console.error('Error fetching trips:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
