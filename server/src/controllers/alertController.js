const asyncHandler = require('../middlewares/asyncHandler');
const AlertHistory = require('../models/AlertHistory');
const Campaign = require('../models/Campaign');

/**
 * GET /api/alerts
 * Paginated alert history for the dashboard's "Alert History" panel.
 * Media buyers only see alerts for campaigns assigned to them - admins see
 * everything. Supports ?campaignId=, ?campaignName= (partial match),
 * ?ruleType=, ?dateFrom=, ?dateTo= (all optional, combinable).
 */
const getAlertHistory = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  // Higher cap than the default page size so the export feature can pull
  // everything matching the current filters in one request.
  const limit = Math.min(parseInt(req.query.limit, 10) || 25, 2000);
  const filter = {};

  if (req.query.campaignId) filter.campaignId = req.query.campaignId;
  if (req.query.campaignName) filter.campaignName = { $regex: req.query.campaignName, $options: 'i' };
  if (req.query.ruleType) filter.ruleType = req.query.ruleType;

  if (req.query.dateFrom || req.query.dateTo) {
    filter.sentAt = {};
    if (req.query.dateFrom) filter.sentAt.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) filter.sentAt.$lte = new Date(req.query.dateTo);
  }

  if (req.user.role === 'media_buyer') {
    const assigned = await Campaign.find({ assignedTo: req.user.userId }, 'campaignId');
    const assignedIds = assigned.map((c) => c.campaignId);
    filter.campaignId = filter.campaignId
      ? (assignedIds.includes(filter.campaignId) ? filter.campaignId : '__none__')
      : { $in: assignedIds };
  }

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
