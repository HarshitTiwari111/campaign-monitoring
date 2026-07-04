const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const User = require('../models/User');

const SALT_ROUNDS = 10;

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Looks up a user by username/password. Returns the User doc or null. */
async function findAuthenticatedUser(username, password) {
  const user = await User.findOne({ username: username.toLowerCase(), active: true });
  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  return isMatch ? user : null;
}

function generateToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), username: user.username, role: user.role },
    env.auth.jwtSecret,
    { expiresIn: env.auth.jwtExpiresIn }
  );
}

function verifyToken(token) {
  return jwt.verify(token, env.auth.jwtSecret);
}

module.exports = { hashPassword, findAuthenticatedUser, generateToken, verifyToken };
