const express = require('express');
const { login, getCurrentUser } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', requireAuth, getCurrentUser);

module.exports = router;
