const asyncHandler = require('../middlewares/asyncHandler');
const CampaignMetrics = require('../models/CampaignMetrics');
const Campaign = require('../models/Campaign');
const landingClickService = require('../services/landingClickService');
const gclidService = require('../services/gclidService');
const alertService = require('../services/alertService');
const recommendationEngine = require('../services/recommendationEngine');
const AlertRules = require('../models/AlertRules');
const env = require('../config/env');

const DASHBOARD_WINDOW_MINUTES = 60;

/** Returns the most recent CampaignMetrics document for every distinct campaign. */
async function getLatestMetricsPerCampaign() {
  const results = await CampaignMetrics.aggregate([
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$campaignId',
        doc: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$doc' } },
    { $sort: { campaignName: 1 } },
  ]);
  return results;
}

/**
 * GET /api/campaigns
 * Dashboard summary: one card/row per campaign with live counts, current
 * recommendation, and last alert time. Media buyers only see campaigns
 * assigned to them; admins see everything plus who each one is assigned to.
 */
const getCampaigns = asyncHandler(async (req, res) => {
  let latestMetrics = await getLatestMetricsPerCampaign();

  const assignments = await Campaign.find().populate('assignedTo', 'name username');
  const assignmentByCampaignId = new Map(assignments.map((a) => [a.campaignId, a]));

  if (req.user.role === 'media_buyer') {
    latestMetrics = latestMetrics.filter((m) => {
      const assignment = assignmentByCampaignId.get(m.campaignId);
      return assignment?.assignedTo && String(assignment.assignedTo._id) === req.user.userId;
    });
  }

  // Spend limit shown on cards should reflect whatever the user has configured
  // on the Rules page, not a stale hardcoded value.
  const spendLimitRule = await AlertRules.findOne({ type: 'SPEND_LIMIT' });
  const spendLimit = spendLimitRule ? spendLimitRule.threshold : env.alerts.defaultSpendLimit;

  const campaigns = await Promise.all(
    latestMetrics.map(async (metrics) => {
      const [landingClicks, gclidCount, lastAlert] = await Promise.all([
        landingClickService.countRecentVisits(metrics.campaignId, DASHBOARD_WINDOW_MINUTES),
        gclidService.countRecentGclids(metrics.campaignId, DASHBOARD_WINDOW_MINUTES),
        alertService.getLastAlert(metrics.campaignId),
      ]);

      const recommendation = recommendationEngine.getRecommendation({
        clicks: metrics.clicks,
        gclidCount,
        spend: metrics.spend,
        conversions: metrics.conversions,
        spendLimit,
      });

      const status = recommendation === 'Pause Campaign' ? 'CRITICAL' : recommendation === 'Monitor Campaign' ? 'HEALTHY' : 'WARNING';
      const assignment = assignmentByCampaignId.get(metrics.campaignId);

      return {
        campaignId: metrics.campaignId,
        campaignName: metrics.campaignName,
        // Google Ads' own ENABLED/PAUSED/REMOVED - distinct from `status`
        // below, which is our health verdict (HEALTHY/WARNING/CRITICAL).
        campaignStatus: metrics.status || 'ENABLED',
        spend: metrics.spend,
        spendLimit,
        clicks: metrics.clicks,
        impressions: metrics.impressions,
        conversions: metrics.conversions,
        cpc: metrics.cpc,
        landingClicks,
        gclidCount,
        recommendation,
        status,
        lastAlertTime: lastAlert ? lastAlert.sentAt : null,
        timestamp: metrics.timestamp,
        assignedTo: assignment?.assignedTo
          ? { userId: assignment.assignedTo._id, name: assignment.assignedTo.name, username: assignment.assignedTo.username }
          : null,
      };
    })
  );

  res.json({ success: true, data: campaigns });
});

/**
 * GET /api/campaigns/:campaignId/history
 * Time-series of raw metrics for a single campaign (for charting).
 */
const getCampaignHistory = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

  const history = await CampaignMetrics.find({ campaignId }).sort({ timestamp: -1 }).limit(limit);

  res.json({ success: true, data: history.reverse() });
});

/** PUT /api/campaigns/:campaignId/assign - admin only: assign/unassign a campaign to a media buyer. */
const assignCampaign = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  const { userId } = req.body;

  const campaign = await Campaign.findOneAndUpdate(
    { campaignId },
    { assignedTo: userId || null },
    { new: true }
  ).populate('assignedTo', 'name username');

  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campaign not found' });
  }

  res.json({ success: true, data: campaign });
});

module.exports = { getCampaigns, getCampaignHistory, assignCampaign };
