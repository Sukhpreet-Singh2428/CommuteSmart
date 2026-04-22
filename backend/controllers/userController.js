const User = require('../models/User');

// GET /api/users/me/favourites
exports.getFavourites = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('favourites');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, favourites: user.favourites || [] });
    } catch (err) {
        console.error('Error fetching favourites:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/users/me/favourites  body: { routeId }
exports.addFavourite = async (req, res) => {
    try {
        const { routeId } = req.body;
        if (!routeId) {
            return res.status(400).json({ success: false, message: 'routeId is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.favourites.includes(routeId)) {
            return res.status(400).json({ success: false, message: 'Route already in favourites' });
        }

        user.favourites.push(routeId);
        await user.save();

        res.json({ success: true, favourites: user.favourites });
    } catch (err) {
        console.error('Error adding favourite:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/users/me/favourites/:routeId
exports.removeFavourite = async (req, res) => {
    try {
        const { routeId } = req.params;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const index = user.favourites.indexOf(routeId);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Route not in favourites' });
        }

        user.favourites.splice(index, 1);
        await user.save();

        res.json({ success: true, favourites: user.favourites });
    } catch (err) {
        console.error('Error removing favourite:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/users/me/stats
// Returns comprehensive user stats for Profile page
const Report = require('../models/Report');

exports.getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Total reports by this user
        const totalReports = await Report.countDocuments({ reportedBy: userId, type: 'alert' });

        // Verified reports (upvotes >= 5)
        const verifiedReports = await Report.countDocuments({ reportedBy: userId, type: 'alert', upvotes: { $gte: 5 } });

        // Current streak: consecutive days with at least 1 alert
        const userAlerts = await Report.find({ reportedBy: userId, type: 'alert' })
            .select('timeStamp')
            .sort({ timeStamp: -1 })
            .lean();

        let currentStreak = 0;
        if (userAlerts.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Check if user was active today or yesterday (streak is still alive)
            const lastAlertDate = new Date(userAlerts[0].timeStamp);
            lastAlertDate.setHours(0, 0, 0, 0);
            
            const daysDiff = Math.floor((today.getTime() - lastAlertDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff <= 1) {
                // Build set of unique active days
                const activeDays = new Set();
                userAlerts.forEach(alert => {
                    const d = new Date(alert.timeStamp);
                    d.setHours(0, 0, 0, 0);
                    activeDays.add(d.getTime());
                });

                const sortedDays = Array.from(activeDays).sort((a, b) => b - a);
                currentStreak = 1;
                for (let i = 1; i < sortedDays.length; i++) {
                    const diff = (sortedDays[i - 1] - sortedDays[i]) / (1000 * 60 * 60 * 24);
                    if (diff === 1) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }
        }

        // Level system: 1000 XP per level
        const points = user.points || 0;
        const level = Math.floor(points / 1000) + 1;
        const currentLevelXP = points % 1000;
        const nextLevelXP = 1000;
        const levelProgressPct = (currentLevelXP / 1000) * 100;

        // Clean air rank: rank by carbonSaved among all users
        const usersAbove = await User.countDocuments({ carbonSaved: { $gt: user.carbonSaved || 0 } });
        const cleanAirRank = usersAbove + 1;

        // Green score
        const cs = user.carbonSaved || 0;
        let greenScore = 'C';
        if (cs >= 50) greenScore = 'A+';
        else if (cs >= 30) greenScore = 'A';
        else if (cs >= 15) greenScore = 'B+';
        else if (cs >= 5) greenScore = 'B';

        // Weekly progress: last 4 weeks, each as % of 7 reports/week target
        const weeklyProgress = [];
        const now = new Date();
        for (let w = 3; w >= 0; w--) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() - w * 7);
            weekEnd.setHours(23, 59, 59, 999);

            const count = await Report.countDocuments({
                reportedBy: userId,
                type: 'alert',
                timeStamp: { $gte: weekStart, $lte: weekEnd }
            });

            const pct = Math.min(100, Math.round((count / 7) * 100));
            weeklyProgress.push({ week: `Week ${4 - w}`, pct });
        }

        // Trees equivalent
        const treesEquivalent = cs / 21.77;

        res.json({
            success: true,
            stats: {
                points,
                carbonSaved: cs,
                badges: user.badges || [],
                honestyScore: user.honestyScore || 100,
                totalReports,
                verifiedReports,
                totalTrips: 0,       // No Trip model yet
                totalDistance: 0,     // No Trip model yet
                currentStreak,
                level,
                nextLevelXP,
                currentLevelXP,
                levelProgressPct,
                cleanAirRank,
                greenScore,
                weeklyProgress,
                treesEquivalent
            }
        });
    } catch (err) {
        console.error('Error fetching user stats:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
