const express = require('express');
const router = express.Router();
// const {signup, login} = require('../controllers/authController');
const {signup, login, getMe, logout} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
