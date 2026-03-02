const express = require('express');
const router = express.Router();
const {protect} = require('../middleware/authMiddleware');
const {reportLocation, getNearby} = require('../controllers/locationController');

// router.post('/report', reportLocation);
router.post('/report', protect, reportLocation);
router.get('/nearby', protect, getNearby);

module.exports = router;