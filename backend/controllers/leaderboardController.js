const User = require('../models/User');

// GET /api/leaderboard?limit=50
// Returns top users sorted by points descending
exports.getLeaderboard = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        const users = await User.find({})
            .select('name email points carbonSaved badges')
            .sort({ points: -1 })
            .limit(limit);

        const leaderboard = users.map((user, index) => ({
            userId: user._id,
            name: user.name || user.email.split('@')[0],
            email: user.email,
            points: user.points || 0,
            carbonSaved: user.carbonSaved || 0,
            badges: user.badges || [],
            rank: index + 1
        }));

        res.json({ success: true, leaderboard });
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
