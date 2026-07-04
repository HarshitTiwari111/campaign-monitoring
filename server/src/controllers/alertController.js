const asyncHandler = require('../middlewares/asyncHandler');
const AlertHistory = require('../models/AlertHistory');

/**
 * GET /api/alerts
 * Paginated alert history for the dashboard's "Alert History" panel.
 * Supports ?campaignId= to filter to a single campaign.
 */
const getAlertHistory = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
  const filter = {};
  if (req.query.campaignId) filter.campaignId = req.query.campaignId;

  const [items, total] = await Promise.all([
    AlertHistory.find(filter)
      .sort({ sentAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AlertHistory.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

module.exports = { getAlertHistory };
