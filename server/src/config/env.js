import dotenv from 'dotenv';

dotenv.config();

const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'MONGO_URI'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
    refreshTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  },
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
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
