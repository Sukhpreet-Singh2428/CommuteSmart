const express = require('express');
const router = express.Router();
const {protect} = require('../middleware/authMiddleware');
const {createAlert, getAlerts, upvoteAlert, getNearbyAlerts, deleteAlert, getRouteAlerts, addComment, getComments, deleteComment} = require('../controllers/alertController');

router.post('/', protect, createAlert);
router.get('/', protect, getAlerts);
router.get('/nearby', protect, getNearbyAlerts); // CONNECTED TO BACKEND: Get nearby alerts with radius
router.get('/route', protect, getRouteAlerts); // CONNECTED TO BACKEND: Get route-specific alerts
router.patch('/:id/upvote', protect, upvoteAlert);
router.post('/:id/comments', protect, addComment); // PHASE 3: Add comment to alert
router.get('/:id/comments', getComments); // PHASE 3: Get comments for alert
router.delete('/:alertId/comments/:commentId', protect, deleteComment); // Delete own comment
router.delete('/:id', protect, deleteAlert); // CONNECTED TO BACKEND: Delete own alert

module.exports = router;