const asyncHandler = require('../middlewares/asyncHandler');
const User = require('../models/User');
const authService = require('../services/authService');

function toSafeUser(user) {
  return {
    _id: user._id,
    username: user.username,
    name: user.name,
    role: user.role,
    telegramChatId: user.telegramChatId,
    telegramBotToken: user.telegramBotToken,
    active: user.active,
    createdAt: user.createdAt,
  };
}

/** GET /api/users - admin only: list every media buyer + admin account. */
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: 1 });
  res.json({ success: true, data: users.map(toSafeUser) });
});

/** POST /api/users - admin only: create a new media buyer (or admin) account. */
const createUser = asyncHandler(async (req, res) => {
  const { username, password, name, role, telegramChatId, telegramBotToken } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ success: false, message: 'username, password, and name are required' });
  }

  const existing = await User.findOne({ username: username.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'That username is already taken' });
  }

  const passwordHash = await authService.hashPassword(password);
  const user = await User.create({
    username: username.toLowerCase(),
    passwordHash,
    name,
    role: role === 'admin' ? 'admin' : 'media_buyer',
    telegramChatId: telegramChatId || '',
    telegramBotToken: telegramBotToken || '',
  });

  res.status(201).json({ success: true, data: toSafeUser(user) });
});

/** PUT /api/users/:id - admin only: update name/role/telegram fields/active, optionally reset password. */
const updateUser = asyncHandler(async (req, res) => {
  const { name, role, telegramChatId, telegramBotToken, active, password } = req.body;
  const update = {};

  if (name !== undefined) update.name = name;
  if (role !== undefined) update.role = role === 'admin' ? 'admin' : 'media_buyer';
  if (telegramChatId !== undefined) update.telegramChatId = telegramChatId;
  if (telegramBotToken !== undefined) update.telegramBotToken = telegramBotToken;
  if (active !== undefined) update.active = active;
  if (password) update.passwordHash = await authService.hashPassword(password);

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, data: toSafeUser(user) });
});

/** DELETE /api/users/:id - admin only: deactivate (soft-delete) an account. */
const deactivateUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.userId) {
    return res.status(400).json({ success: false, message: "You can't deactivate your own account" });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, data: toSafeUser(user) });
});

/** GET /api/users/me - any logged-in user: their own profile. */
const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, data: toSafeUser(user) });
});

/** PUT /api/users/me - any logged-in user: self-service Telegram bot token + chat ID. */
const updateMyProfile = asyncHandler(async (req, res) => {
  const { telegramChatId, telegramBotToken } = req.body;
  const update = {};
  if (telegramChatId !== undefined) update.telegramChatId = telegramChatId || '';
  if (telegramBotToken !== undefined) update.telegramBotToken = telegramBotToken || '';

  const user = await User.findByIdAndUpdate(req.user.userId, update, { new: true, runValidators: true });
  res.json({ success: true, data: toSafeUser(user) });
});

module.exports = { getUsers, createUser, updateUser, deactivateUser, getMyProfile, updateMyProfile };
