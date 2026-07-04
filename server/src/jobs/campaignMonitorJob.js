const cron = require('node-cron');
const env = require('../config/env');
const logger = require('../utils/logger');
const googleAdsService = require('../services/googleAdsService');
const ruleEngine = require('../services/ruleEngine');

let isRunning = false;

/**
 * Full workflow, run once per cycle:
 *   Fetch Campaign Data -> Store Data -> Evaluate Rules ->
 *   Generate Recommendation -> Send Telegram Alert -> Store Alert History
 *
 * The isRunning guard prevents overlapping cycles if a fetch+evaluate pass
 * ever takes longer than the cron interval (e.g. a slow Google Ads API call).
 */
async function runMonitoringCycle() {
  if (isRunning) {
    logger.warn('Previous monitoring cycle still running - skipping this tick');
    return;
  }

  isRunning = true;
  const startedAt = Date.now();

  try {
    const metricsDocs = await googleAdsService.fetchAndStoreCampaignMetrics();
    const activeRules = await ruleEngine.getActiveRules();

    if (activeRules.length === 0) {
      logger.warn('No active alert rules configured - run "npm run seed:rules" to load defaults');
    }

    for (const metricsDoc of metricsDocs) {
      await ruleEngine.evaluateAndAlert(metricsDoc, activeRules);
    }

    logger.info(`Monitoring cycle complete in ${Date.now() - startedAt}ms (${metricsDocs.length} campaigns)`);
  } catch (error) {
    logger.error(`Monitoring cycle failed: ${error.message}`);
  } finally {
    isRunning = false;
  }
}

/** Registers the cron job. Call once at server startup. */
function startCampaignMonitorJob() {
  cron.schedule(env.cron.campaignFetch, runMonitoringCycle);
  logger.info(`Campaign monitor job scheduled (cron: "${env.cron.campaignFetch}")`);
}

module.exports = { startCampaignMonitorJob, runMonitoringCycle };
