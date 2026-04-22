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
