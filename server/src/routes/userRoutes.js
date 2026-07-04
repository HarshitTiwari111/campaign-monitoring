const express = require('express');
const {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
  getMyProfile,
  updateMyProfile,
} = require('../controllers/userController');
const { requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Self-service profile - any authenticated user (checked in routes/index.js).
router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

// Admin-only user management.
router.get('/', requireRole('admin'), getUsers);
router.post('/', requireRole('admin'), createUser);
router.put('/:id', requireRole('admin'), updateUser);
router.delete('/:id', requireRole('admin'), deactivateUser);

module.exports = router;
