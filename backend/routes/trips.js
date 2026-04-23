const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createTrip, getMyTrips } = require('../controllers/tripController');

router.post('/', protect, createTrip);
router.get('/me', protect, getMyTrips);

module.exports = router;
