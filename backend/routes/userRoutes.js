const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getFavourites, addFavourite, removeFavourite } = require('../controllers/userController');

router.get('/me/favourites', protect, getFavourites);
router.post('/me/favourites', protect, addFavourite);
router.delete('/me/favourites/:routeId', protect, removeFavourite);

module.exports = router;
