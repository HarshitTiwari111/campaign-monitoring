const mongoose = require('mongoose');

/**
 * One document per campaign per poll cycle (every minute).
 * Historical rows are kept (not upserted) so trend/time-series queries work.
 */
const campaignMetricsSchema = new mongoose.Schema(
  {
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    campaignName: {
      type: String,
      required: true,
    },
    spend: {
      type: Number,
      required: true,
      default: 0,
    },
    clicks: {
      type: Number,
      required: true,
      default: 0,
    },
    impressions: {
      type: Number,
      required: true,
      default: 0,
    },
    conversions: {
      type: Number,
      required: true,
      default: 0,
    },
    cpc: {
      type: Number,
      required: true,
      default: 0,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

campaignMetricsSchema.index({ campaignId: 1, timestamp: -1 });

module.exports = mongoose.model('CampaignMetrics', campaignMetricsSchema);
