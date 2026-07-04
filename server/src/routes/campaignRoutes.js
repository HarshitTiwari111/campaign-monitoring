const express = require('express');
const { getCampaigns, getCampaignHistory, assignCampaign } = require('../controllers/campaignController');
const { requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getCampaigns);
router.get('/:campaignId/history', getCampaignHistory);
router.put('/:campaignId/assign', requireRole('admin'), assignCampaign);

module.exports = router;
