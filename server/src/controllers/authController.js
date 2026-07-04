const asyncHandler = require('../middlewares/asyncHandler');
const authService = require('../services/authService');
const User = require('../models/User');

/** POST /api/auth/login */
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'username and password are required' });
  }

  const user = await authService.findAuthenticatedUser(username, password);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }

  const token = authService.generateToken(user);
  res.json({
    success: true,
    data: { token, username: user.username, name: user.name, role: user.role },
  });
});

/** GET /api/auth/me - lets the frontend validate a stored token on load. */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user || !user.active) {
    return res.status(401).json({ success: false, message: 'Account no longer active' });
  }
  res.json({
    success: true,
    data: { username: user.username, name: user.name, role: user.role },
  });
});

module.exports = { login, getCurrentUser };
