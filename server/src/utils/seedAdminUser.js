/**
 * Bootstraps the first admin account so there's a way to log in at all on a
 * fresh database. Safe to re-run: does nothing if an admin already exists.
 * Usage: npm run seed:admin
 */
const User = require('../models/User');
const authService = require('../services/authService');
const env = require('../config/env');
const logger = require('./logger');

async function seedAdminUser() {
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    logger.info(`Admin already exists (${existingAdmin.username}) - skipping seed`);
    return existingAdmin;
  }

  const passwordHash = await authService.hashPassword(env.auth.seedAdminPassword);
  const admin = await User.create({
    username: env.auth.seedAdminUsername.toLowerCase(),
    passwordHash,
    name: env.auth.seedAdminName,
    role: 'admin',
    active: true,
  });

  logger.info(`Created initial admin account: ${admin.username}`);
  return admin;
}

if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');

  (async () => {
    await mongoose.connect(env.mongoUri);
    logger.info('Connected to MongoDB for admin seeding');
    await seedAdminUser();
    await mongoose.disconnect();
    process.exit(0);
  })().catch((err) => {
    logger.error(`Admin seeding failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { seedAdminUser };
