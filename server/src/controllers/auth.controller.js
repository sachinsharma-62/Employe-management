import crypto from 'node:crypto';
import env from '../config/env.js';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import PasswordReset from '../models/PasswordReset.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { isSmtpConfigured, sendPasswordResetMail } from '../utils/mailer.js';
import {
  REFRESH_TTL_MS,
  RESET_TTL_MS,
  hashToken,
  parseTtlToMs,
  randomToken,
  signAccessToken,
  signRefreshToken,
} from '../utils/tokens.js';
import {
  clearAuthCookies,
  setAuthCookies,
} from '../utils/cookies.js';
import { extractRefreshToken, verifyRefreshToken } from '../middleware/auth.js';

const ACCESS_MAX_AGE = parseTtlToMs(env.jwt.accessTtl);

const issueSession = async (req, res, user) => {
  const refreshToken = signRefreshToken(user, crypto.randomUUID());
  const accessToken = signAccessToken(user);

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || '',
  });

  setAuthCookies(res, {
    accessToken,
    accessMaxAge: ACCESS_MAX_AGE,
    refreshToken,
    refreshMaxAge: REFRESH_TTL_MS,
  });
};

const revokeSessionFromRequest = async (req) => {
  const token = extractRefreshToken(req);
  if (!token) return;
  try {
    const payload = verifyRefreshToken(token);
    await RefreshToken.deleteOne({ user: payload.sub, tokenHash: hashToken(token) });
  } catch {
    // token already invalid - nothing to revoke
  }
};

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  if (user.isLocked()) {
    const minutes = Math.ceil((user.lockedUntil - Date.now()) / 60000);
    throw ApiError.tooMany(
      `Account is temporarily locked due to failed login attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
    );
  }

  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated.');

  const match = await user.comparePassword(password);
  if (!match) {
    await user.recordFailedLogin();
    throw ApiError.unauthorized('Invalid email or password');
  }

  await user.resetLoginAttempts();
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  await issueSession(req, res, user);

  res.status(200).json({ success: true, message: 'Logged in successfully', user });
});

// POST /api/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
  const token = extractRefreshToken(req);
  if (!token) throw ApiError.unauthorized('No active session found');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please log in again.');
  }

  if (payload.type !== 'refresh') {
    throw ApiError.unauthorized('Invalid session. Please log in again.');
  }

  const tokenHash = hashToken(token);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored) {
    await RefreshToken.deleteMany({ user: payload.sub });
    clearAuthCookies(res);
    throw ApiError.unauthorized('Your session has been revoked. Please log in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    await RefreshToken.deleteOne({ _id: stored._id });
    clearAuthCookies(res);
    throw ApiError.unauthorized('Your session has expired. Please log in again.');
  }

  await RefreshToken.deleteOne({ _id: stored._id });
  await issueSession(req, res, user);

  res.status(200).json({ success: true, message: 'Session refreshed', user });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  await revokeSessionFromRequest(req);
  clearAuthCookies(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/logout-all
export const logoutAll = asyncHandler(async (req, res) => {
  await RefreshToken.deleteMany({ user: req.user._id });
  clearAuthCookies(res);
  res.status(200).json({
    success: true,
    message: 'Signed out from all devices',
  });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const response = {
    success: true,
    message:
      'If an account exists with that email, a password reset link has been sent.',
  };

  const user = await User.findOne({ email });
  if (!user || !user.isActive) return res.status(200).json(response);

  await PasswordReset.updateMany(
    { user: user._id, usedAt: null },
    { usedAt: new Date() }
  );

  const rawToken = randomToken();
  await PasswordReset.create({
    user: user._id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
  });

  const resetUrl = `${env.clientUrl}/reset-password/${rawToken}`;
  const result = await sendPasswordResetMail({
    to: user.email,
    name: user.fullName,
    resetUrl,
  });

  if (result.skipped && !env.isProd) {
    response.devResetUrl = resetUrl;
  }

  return res.status(200).json(response);
});

// POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const record = await PasswordReset.findOne({ tokenHash: hashToken(token) });
  if (!record || !record.isValid()) {
    throw ApiError.badRequest('Reset link is invalid or has expired. Please request a new one.');
  }

  const user = await User.findById(record.user);
  if (!user || !user.isActive) {
    throw ApiError.badRequest('Reset link is invalid or has expired. Please request a new one.');
  }

  user.password = newPassword;
  await user.save();

  record.usedAt = new Date();
  await record.save({ validateBeforeSave: false });

  await RefreshToken.deleteMany({ user: user._id });
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully. You can now log in.',
  });
});

// POST /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const match = await user.comparePassword(currentPassword);
  if (!match) throw ApiError.badRequest('Current password is incorrect');

  if (currentPassword === newPassword) {
    throw ApiError.badRequest('New password must be different from the current password');
  }

  user.password = newPassword;
  await user.save();

  await RefreshToken.deleteMany({ user: user._id });
  await issueSession(req, res, user);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Other sessions have been signed out.',
  });
});

// PATCH /api/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, email } = req.body;
  const user = req.user;

  if (email && email.toLowerCase() !== user.email) {
    const exists = await User.exists({ email: email.toLowerCase(), _id: { $ne: user._id } });
    if (exists) throw ApiError.conflict('That email is already in use by another account');
    user.email = email.toLowerCase();
  }

  user.firstName = firstName;
  user.lastName = lastName;

  if (req.file) {
    user.avatar = `/uploads/avatars/${req.file.filename}`;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user,
  });
});

// GET /api/auth/security-info
export const securityInfo = asyncHandler(async (req, res) => {
  const [activeSessions, resetRequests] = await Promise.all([
    RefreshToken.countDocuments({ user: req.user._id, expiresAt: { $gt: new Date() } }),
    PasswordReset.countDocuments({
      user: req.user._id,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    }),
  ]);

  res.status(200).json({
    success: true,
    security: {
      lastLoginAt: req.user.lastLoginAt,
      passwordChangedAt: req.user.passwordChangedAt,
      accountCreated: req.user.createdAt,
      role: req.user.role,
      activeSessions,
      pendingPasswordResets: resetRequests,
      emailVerified: true,
      smtpConfigured: isSmtpConfigured(),
    },
  });
});
