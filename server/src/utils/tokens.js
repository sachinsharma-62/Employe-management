import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import env from '../config/env.js';

export const signAccessToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), role: user.role, type: 'access' },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessTtl }
  );

export const signRefreshToken = (user, jti) =>
  jwt.sign(
    { sub: user._id.toString(), role: user.role, type: 'refresh', jti },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshTtl }
  );

export const verifyAccessToken = (token) => jwt.verify(token, env.jwt.accessSecret);

export const verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret);

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const randomToken = (bytes = 48) => crypto.randomBytes(bytes).toString('hex');

export const parseTtlToMs = (ttl) => {
  const match = /^(\d+)([smhd])$/.exec(String(ttl).trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return value * unit;
};

export const REFRESH_TTL_MS = parseTtlToMs(env.jwt.refreshTtl);
export const RESET_TTL_MS = 15 * 60 * 1000;
