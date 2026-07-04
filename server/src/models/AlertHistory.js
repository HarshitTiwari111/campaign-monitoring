const mongoose = require('mongoose');

/**
 * Persisted record of every alert actually sent (or attempted). Also doubles
 * as the source of truth for cooldown checks (see alertService.isInCooldown).
 */
const alertHistorySchema = new mongoose.Schema(
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
    ruleType: {
      type: String,
      required: true,
    },
    ruleName: {
      type: String,
      default: '',
    },
    recommendation: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metricsSnapshot: {
      spend: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      landingClicks: { type: Number, default: 0 },
      gclidCount: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['SENT', 'FAILED'],
      default: 'SENT',
    },
    telegramResponse: {
      type: String,
      default: '',
    },
    sentAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

alertHistorySchema.index({ campaignId: 1, ruleType: 1, sentAt: -1 });

module.exports = mongoose.model('AlertHistory', alertHistorySchema);
