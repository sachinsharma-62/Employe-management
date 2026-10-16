import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection string.
// Preferred variable is MONGODB_URI (used on Render / Atlas).
// MONGO_URI is kept as a fallback so existing local .env files keep working.
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

const required = {
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  MONGODB_URI: mongoUri,
};

for (const [key, value] of Object.entries(required)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

// CLIENT_URL may hold one or more comma-separated origins
// (e.g. "http://localhost:3000,https://your-app.vercel.app").
const clientUrls = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const port = Number(process.env.PORT) || 5000;

const cookieSameSite = process.env.COOKIE_SAMESITE || (isProd ? 'none' : 'lax');
// Browsers reject SameSite=None cookies that are not also Secure, so enforce it.
const cookieSecure =
  cookieSameSite === 'none'
    ? true
    : process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : isProd;

const env = {
  nodeEnv,
  isProd,
  port,
  // Bind to all interfaces so Render (and Docker) can reach the server.
  host: process.env.HOST || '0.0.0.0',
  mongoUri,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
    refreshTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  },
  // Cross-site cookies (Vercel frontend -> Render backend) need
  // SameSite=None + Secure. Locally we keep Lax + non-secure.
  cookieSecure,
  cookieSameSite,
  clientUrl: clientUrls[0] || 'http://localhost:3000',
  clientUrls,
  serverUrl: process.env.SERVER_URL || `http://localhost:${port}`,
  seed: {
    email: process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@office.com',
    password: process.env.SEED_SUPER_ADMIN_PASSWORD || 'Super@1234',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Office EMS <no-reply@office.com>',
  },
};

export default env;
