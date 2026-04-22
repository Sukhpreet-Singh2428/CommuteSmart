const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {suggestRoutes, calculateCarbon} = require('../controllers/routeController');

router.post('/suggest', protect, suggestRoutes);
router.post('/calculate-carbon', protect, calculateCarbon);

module.exports = router;