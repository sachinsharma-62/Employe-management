import { rateLimit } from 'express-rate-limit';

const limiter = ({ windowMs = 15 * 60 * 1000, max = 100, message } = {}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: message || 'Too many requests. Please try again later.',
    },
  });

export const apiLimiter = limiter({ windowMs: 15 * 60 * 1000, max: 300 });

export const loginLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

export const passwordResetLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many password reset requests. Please try again later.',
});
