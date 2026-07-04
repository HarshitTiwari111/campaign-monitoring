const env = require('../config/env');
const logger = require('../utils/logger');
const CampaignMetrics = require('../models/CampaignMetrics');
const Campaign = require('../models/Campaign');

/**
 * Mock campaign catalogue used when GOOGLE_ADS_MOCK_MODE=true. Lets the whole
 * pipeline (fetch -> store -> rules -> Telegram) run end-to-end without real
 * Google Ads credentials, which is the default for local development.
 */
const MOCK_CAMPAIGNS = [
  { campaignId: '1000000001', campaignName: 'CPS - Weight Loss - US' },
  { campaignId: '1000000002', campaignName: 'CPS - Skincare - UK' },
  { campaignId: '1000000003', campaignName: 'CPS - Finance Leads - CA' },
  { campaignId: '1000000004', campaignName: 'CPS - Insurance Quotes - AU' },
  { campaignId: '1000000005', campaignName: 'CPS - Crypto Signup - IN' },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates plausible-looking metrics per mock campaign so every rule
 * (spend limit, zero conversions, high clicks/low gclid, etc.) can trigger
 * organically during a demo run.
 */
function generateMockMetrics() {
  return MOCK_CAMPAIGNS.map(({ campaignId, campaignName }) => {
    const clicks = randomInt(5, 60);
    const impressions = clicks * randomInt(8, 20);
    const spend = parseFloat((clicks * (Math.random() * 1.5 + 0.3)).toFixed(2));
    const conversions = Math.random() < 0.4 ? 0 : randomInt(1, 5);
    const cpc = clicks > 0 ? parseFloat((spend / clicks).toFixed(2)) : 0;

    return {
      campaignId,
      campaignName,
      spend,
      clicks,
      impressions,
      conversions,
      cpc,
      timestamp: new Date(),
    };
  });
}

let googleAdsClient = null;
let googleAdsCustomer = null;

/** Lazily builds the Google Ads API client only when real mode is active. */
function getGoogleAdsCustomer() {
  if (googleAdsCustomer) return googleAdsCustomer;

  // eslint-disable-next-line global-require
  const { GoogleAdsApi } = require('google-ads-api');

  googleAdsClient = new GoogleAdsApi({
    client_id: env.googleAds.clientId,
    client_secret: env.googleAds.clientSecret,
    developer_token: env.googleAds.developerToken,
  });

  googleAdsCustomer = googleAdsClient.Customer({
    customer_id: env.googleAds.customerId,
    login_customer_id: env.googleAds.loginCustomerId || undefined,
    refresh_token: env.googleAds.refreshToken,
  });

  return googleAdsCustomer;
}

const CAMPAIGN_METRICS_QUERY = `
  SELECT
    campaign.id,
    campaign.name,
    metrics.cost_micros,
    metrics.clicks,
    metrics.impressions,
    metrics.conversions,
    metrics.average_cpc
  FROM campaign
  WHERE segments.date DURING TODAY
    AND campaign.status = 'ENABLED'
`;

/** Fetches real, live campaign metrics from the Google Ads API. */
async function fetchLiveCampaignMetrics() {
  const customer = getGoogleAdsCustomer();
  const rows = await customer.query(CAMPAIGN_METRICS_QUERY);

  return rows.map((row) => ({
    campaignId: String(row.campaign.id),
    campaignName: row.campaign.name,
    spend: (row.metrics.cost_micros || 0) / 1_000_000,
    clicks: row.metrics.clicks || 0,
    impressions: row.metrics.impressions || 0,
    conversions: row.metrics.conversions || 0,
    cpc: (row.metrics.average_cpc || 0) / 1_000_000,
    timestamp: new Date(),
  }));
}

/**
 * Fetches campaign data (mock or live, per GOOGLE_ADS_MOCK_MODE) and persists
 * one CampaignMetrics document per campaign. Returns the persisted docs so
 * the caller (scheduler) can feed them straight into the rule engine.
 */
async function fetchAndStoreCampaignMetrics() {
  const metrics = env.googleAds.mockMode ? generateMockMetrics() : await fetchLiveCampaignMetrics();

  const savedDocs = await CampaignMetrics.insertMany(metrics);
  logger.info(`Fetched & stored metrics for ${savedDocs.length} campaign(s) [mode=${env.googleAds.mockMode ? 'MOCK' : 'LIVE'}]`);

  // Register every campaign in the assignment table (upsert-only-on-insert,
  // so an admin's existing assignedTo is never clobbered on later cycles).
  await Promise.all(
    metrics.map(({ campaignId, campaignName }) =>
      Campaign.findOneAndUpdate(
        { campaignId },
        { $setOnInsert: { campaignId, campaignName } },
        { upsert: true }
      )
    )
  );

  return savedDocs;
}

module.exports = {
  fetchAndStoreCampaignMetrics,
  generateMockMetrics,
};
