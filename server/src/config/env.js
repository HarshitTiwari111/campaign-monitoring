require('dotenv').config();

/**
 * Centralized, validated access to environment variables.
 * Every other module reads config through here instead of process.env directly,
 * so a missing/misconfigured value fails fast at boot instead of deep in a cron cycle.
 */
const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campaign_monitoring',

  googleAds: {
    mockMode: (process.env.GOOGLE_ADS_MOCK_MODE || 'true').toLowerCase() === 'true',
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || '',
    loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '',
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    // Fallback destination for alerts on campaigns nobody has been assigned to
    // yet. Once a campaign is assigned, its alerts go to that media buyer's
    // own telegramChatId instead (see ruleEngine.js).
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  },

  cron: {
    campaignFetch: process.env.CAMPAIGN_FETCH_CRON || '*/1 * * * *',
    ruleEvaluation: process.env.RULE_EVALUATION_CRON || '*/1 * * * *',
  },

  alerts: {
    defaultCooldownMinutes: parseInt(process.env.DEFAULT_ALERT_COOLDOWN_MINUTES, 10) || 15,
    defaultSpendLimit: parseFloat(process.env.DEFAULT_SPEND_LIMIT) || 50,
  },

  auth: {
    // Used only once, by scripts/seedAdminUser.js, to bootstrap the first
    // admin account in the Users collection. Login itself always checks the
    // database (see authService.findAuthenticatedUser), never these env vars.
    seedAdminUsername: process.env.ADMIN_USERNAME || 'admin',
    seedAdminPassword: process.env.ADMIN_PASSWORD || 'admin123',
    seedAdminName: process.env.ADMIN_NAME || 'Admin',
    jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

module.exports = env;
