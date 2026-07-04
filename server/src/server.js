const env = require('./config/env');
const logger = require('./utils/logger');
const connectDB = require('./config/db');
const app = require('./app');
const { startCampaignMonitorJob } = require('./jobs/campaignMonitorJob');
const { seedDefaultRules } = require('./utils/seedAlertRules');
const { seedAdminUser } = require('./utils/seedAdminUser');

async function start() {
  await connectDB();

  // Idempotent - safe to run on every boot (upsert-based), so a fresh
  // deploy (e.g. Render) works without a separate manual seed step.
  await seedDefaultRules();
  await seedAdminUser();

  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`);
    startCampaignMonitorJob();
  });
}

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled rejection: ${err.message}`);
});

start();
