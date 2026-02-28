const express = require('express');
const router = express.Router();
// const {signup, login} = require('../controllers/authController');
const {signup, login, getMe} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', getMe);

module.exports = router;
