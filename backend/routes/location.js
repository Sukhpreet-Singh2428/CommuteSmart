const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {reportLocation, getNearby} = require('../controllers/locationController');

router.post('/report', reportLocation);
// router.get('/nearby', protect, getNearby);
router.get('/nearby', getNearby);

module.exports = router;