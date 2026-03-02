const express = require('express');
const router = express.Router();
const {protect} = require('../middleware/authMiddleware');
const {createAlert, getAlerts, upvoteAlert} = require('../controllers/alertController');

router.post('/', protect, createAlert);
router.get('/', getAlerts);
router.patch('/:id/upvote', protect, upvoteAlert);

module.exports = router;