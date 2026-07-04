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
 * organically during a demo run. Occasionally marks one PAUSED so the
 * "live or not" status column has something to show in mock mode too.
 */
function generateMockMetrics() {
  return MOCK_CAMPAIGNS.map(({ campaignId, campaignName }, index) => {
    const clicks = randomInt(5, 60);
    const impressions = clicks * randomInt(8, 20);
    const spend = parseFloat((clicks * (Math.random() * 1.5 + 0.3)).toFixed(2));
    const conversions = Math.random() < 0.4 ? 0 : randomInt(1, 5);
    const cpc = clicks > 0 ? parseFloat((spend / clicks).toFixed(2)) : 0;
    const status = index === MOCK_CAMPAIGNS.length - 1 && Math.random() < 0.3 ? 'PAUSED' : 'ENABLED';

    return {
      campaignId,
      campaignName,
      spend,
      clicks,
      impressions,
      conversions,
      cpc,
      status,
      timestamp: new Date(),
    };
  });
}

let googleAdsClient = null;

/** Lazily builds the Google Ads API client only when real mode is active. */
function getGoogleAdsClient() {
  if (googleAdsClient) return googleAdsClient;

  // eslint-disable-next-line global-require
  const { GoogleAdsApi } = require('google-ads-api');

  googleAdsClient = new GoogleAdsApi({
    client_id: env.googleAds.clientId,
    client_secret: env.googleAds.clientSecret,
    developer_token: env.googleAds.developerToken,
  });

  return googleAdsClient;
}

/**
 * Discovers every client (non-manager) ad account linked directly under the
 * MCC given by GOOGLE_ADS_LOGIN_CUSTOMER_ID. New accounts added to the MCC
 * later show up automatically on the next cycle - no config change needed.
 */
async function listClientAccountIds() {
  const client = getGoogleAdsClient();
  const mccId = env.googleAds.loginCustomerId;

  const mcc = client.Customer({
    customer_id: mccId,
    login_customer_id: mccId,
    refresh_token: env.googleAds.refreshToken,
  });

  const rows = await mcc.query(`
    SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.status
    FROM customer_client
    WHERE customer_client.level <= 1
  `);

  return rows
    .filter((row) => !row.customer_client.manager && row.customer_client.status === 'ENABLED')
    .map((row) => String(row.customer_client.id));
}

const CAMPAIGN_METRICS_QUERY = `
  SELECT
    campaign.id,
    campaign.name,
    campaign.status,
    metrics.cost_micros,
    metrics.clicks,
    metrics.impressions,
    metrics.conversions,
    metrics.average_cpc
  FROM campaign
  WHERE segments.date DURING TODAY
`;

function mapCampaignRows(rows) {
  return rows.map((row) => ({
    campaignId: String(row.campaign.id),
    campaignName: row.campaign.name,
    status: row.campaign.status,
    spend: (row.metrics.cost_micros || 0) / 1_000_000,
    clicks: row.metrics.clicks || 0,
    impressions: row.metrics.impressions || 0,
    conversions: row.metrics.conversions || 0,
    cpc: (row.metrics.average_cpc || 0) / 1_000_000,
    timestamp: new Date(),
  }));
}

/**
 * Fetches real campaign metrics from the Google Ads API - every status
 * (ENABLED/PAUSED/REMOVED), not just live ones, so the dashboard can show
 * whether a campaign is actually running. If GOOGLE_ADS_LOGIN_CUSTOMER_ID is
 * set, treats GOOGLE_ADS_CUSTOMER_ID as an MCC and pulls campaigns from
 * every client account under it automatically; otherwise queries the single
 * GOOGLE_ADS_CUSTOMER_ID account directly.
 */
async function fetchLiveCampaignMetrics() {
  const client = getGoogleAdsClient();

  if (env.googleAds.loginCustomerId) {
    const clientAccountIds = await listClientAccountIds();
    logger.info(`Found ${clientAccountIds.length} client account(s) under MCC ${env.googleAds.loginCustomerId}`);

    const perAccountRows = await Promise.all(
      clientAccountIds.map(async (customerId) => {
        const customer = client.Customer({
          customer_id: customerId,
          login_customer_id: env.googleAds.loginCustomerId,
          refresh_token: env.googleAds.refreshToken,
        });
        const rows = await customer.query(CAMPAIGN_METRICS_QUERY);
        return mapCampaignRows(rows);
      })
    );

    return perAccountRows.flat();
  }

  const customer = client.Customer({
    customer_id: env.googleAds.customerId,
    refresh_token: env.googleAds.refreshToken,
  });
  const rows = await customer.query(CAMPAIGN_METRICS_QUERY);
  return mapCampaignRows(rows);
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
