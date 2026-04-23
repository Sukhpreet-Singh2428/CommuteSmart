const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getFavourites, addFavourite, removeFavourite, getUserStats, updateProfile } = require('../controllers/userController');

router.get('/me/stats', protect, getUserStats);
router.patch('/me/profile', protect, updateProfile); // PHASE 3: Update profile
router.get('/me/favourites', protect, getFavourites);
router.post('/me/favourites', protect, addFavourite);
router.delete('/me/favourites/:routeId', protect, removeFavourite);

module.exports = router;
