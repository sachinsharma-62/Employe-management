import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';
import { verifyAccessToken, verifyRefreshToken } from '../utils/tokens.js';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../utils/cookies.js';

const extractToken = (req, headerToken) => {
  if (headerToken) return headerToken;
  if (req.cookies?.[ACCESS_COOKIE]) return req.cookies[ACCESS_COOKIE];
  return null;
};

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = extractToken(req, bearer);

  if (!token) throw ApiError.unauthorized('Authentication required. Please log in.');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Your session has expired. Please log in again.');
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid session. Please log in again.');
    }
    throw err;
  }

  if (payload.type !== 'access') {
    throw ApiError.unauthorized('Invalid session. Please log in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists.');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated.');

  if (user.changedPasswordAfter(payload.iat)) {
    throw ApiError.unauthorized('Password was changed recently. Please log in again.');
  }

  req.user = user;
  next();
});

export const authorize =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required. Please log in.'));
    if (!allowedRoles || allowedRoles.length === 0) return next();
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to access this resource.'));
    }
    return next();
  };

export const extractRefreshToken = (req) => {
  if (req.cookies?.[REFRESH_COOKIE]) return req.cookies[REFRESH_COOKIE];
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim();
  if (req.body?.refreshToken) return req.body.refreshToken;
  return null;
};

export { verifyRefreshToken };
