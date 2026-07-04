const mongoose = require('mongoose');

/**
 * One document per UNIQUE gclid ever seen. The unique index on `gclid` is
 * the actual duplicate-prevention mechanism (see gclidService.recordGclid).
 */
const gclidLogsSchema = new mongoose.Schema(
  {
    gclid: {
      type: String,
      required: true,
      unique: true,
    },
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    campaignName: {
      type: String,
      required: true,
    },
    landingPageUrl: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    firstSeenAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GclidLogs', gclidLogsSchema);
