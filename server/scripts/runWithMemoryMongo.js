/**
 * Dev-only convenience runner: boots an in-memory MongoDB instance
 * (mongodb-memory-server) and points the app at it, so the whole stack can
 * run with zero local MongoDB install. NOT for production - data is wiped
 * every time this process exits.
 *
 * Usage: npm run dev:memory
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri('campaign_monitoring');
  process.env.MONGO_URI = uri;
  console.log(`[dev:memory] In-memory MongoDB started at ${uri}`);

  process.on('SIGINT', async () => {
    await mongod.stop();
    process.exit(0);
  });

  const connectDB = require('../src/config/db');
  await connectDB();

  const { seedDefaultRules } = require('../src/utils/seedAlertRules');
  await seedDefaultRules();

  const { seedAdminUser } = require('../src/utils/seedAdminUser');
  const admin = await seedAdminUser();
  console.log(`[dev:memory] Admin login: ${admin.username} / (see ADMIN_PASSWORD in .env)`);

  const app = require('../src/app');
  const env = require('../src/config/env');
  const { startCampaignMonitorJob } = require('../src/jobs/campaignMonitorJob');

  app.listen(env.port, () => {
    console.log(`[dev:memory] Server running on port ${env.port}`);
    startCampaignMonitorJob();
  });
}

main().catch((err) => {
  console.error('[dev:memory] Failed to start:', err);
  process.exit(1);
});
