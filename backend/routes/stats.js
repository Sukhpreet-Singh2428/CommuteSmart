const express = require('express');
const router = express.Router();
const { getLiveStats, getTrendingAreas } = require('../controllers/statsController');

router.get('/live', getLiveStats);
router.get('/trending', getTrendingAreas);

module.exports = router;
