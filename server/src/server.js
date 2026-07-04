const env = require('./config/env');
const logger = require('./utils/logger');
const connectDB = require('./config/db');
const app = require('./app');
const { startCampaignMonitorJob } = require('./jobs/campaignMonitorJob');

async function start() {
  await connectDB();

  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`);
    startCampaignMonitorJob();
  });
}

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled rejection: ${err.message}`);
});

start();
