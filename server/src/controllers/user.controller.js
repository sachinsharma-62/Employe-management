import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ALL_ROLES } from '../utils/roles.js';

// GET /api/users
export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const search = (req.query.search || '').trim();
  const role = req.query.role;

  const filter = {};
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
  }
  if (role && ALL_ROLES.includes(role)) filter.role = role;
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

// GET /api/users/:id
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  res.status(200).json({ success: true, user });
});

// PATCH /api/users/:id/role
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (req.user._id.toString() === req.params.id) {
    throw ApiError.badRequest('You cannot change your own role');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  user.role = role;
  await user.save();

  await RefreshToken.deleteMany({ user: user._id });

  res.status(200).json({
    success: true,
    message: `Role updated to ${role.replace('_', ' ')} `,
    user,
  });
});

// PATCH /api/users/:id/status
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  if (req.user._id.toString() === req.params.id && !isActive) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  user.isActive = isActive;
  if (!isActive) {
    user.lockedUntil = null;
    user.loginAttempts = 0;
  }
  await user.save();

  if (!isActive) await RefreshToken.deleteMany({ user: user._id });

  res.status(200).json({
    success: true,
    message: isActive ? 'Account activated' : 'Account deactivated',
    user,
  });
});
