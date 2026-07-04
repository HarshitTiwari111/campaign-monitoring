const express = require('express');
const campaignRoutes = require('./campaignRoutes');
const trackingRoutes = require('./trackingRoutes');
const alertRoutes = require('./alertRoutes');
const ruleRoutes = require('./ruleRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'OK' }));

// Public: login, and the landing-page tracking pixel (called from outside the dashboard).
router.use('/auth', authRoutes);
router.use('/tracking', trackingRoutes);

// Protected: dashboard data, rule management, and user/campaign administration.
router.use('/campaigns', requireAuth, campaignRoutes);
router.use('/alerts', requireAuth, alertRoutes);
router.use('/rules', requireAuth, ruleRoutes);
router.use('/users', requireAuth, userRoutes);

module.exports = router;
