const mongoose = require('mongoose');

/**
 * One document per landing page visit. Volume of these rows (per campaign,
 * within a time window) feeds the "Landing Click Count" rule.
 */
const landingClicksSchema = new mongoose.Schema(
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
    gclid: {
      type: String,
      default: null,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    landingPageUrl: {
      type: String,
      required: true,
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

landingClicksSchema.index({ campaignId: 1, timestamp: -1 });

module.exports = mongoose.model('LandingClicks', landingClicksSchema);
