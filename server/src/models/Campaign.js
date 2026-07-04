const mongoose = require('mongoose');

/**
 * Assignment registry: maps a Google Ads campaignId to the media buyer who
 * owns it. Kept separate from CampaignMetrics (which is a per-minute time
 * series) so assignment doesn't need to be rewritten on every poll cycle -
 * googleAdsService upserts one row here per campaign it discovers.
 */
const campaignSchema = new mongoose.Schema(
  {
    campaignId: {
      type: String,
      required: true,
      unique: true,
    },
    campaignName: {
      type: String,
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campaign', campaignSchema);
