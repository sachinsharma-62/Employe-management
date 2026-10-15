import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import env from './config/env.js';
import routes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1);

// Health check endpoint (useful for Render, load balancers, uptime checks).
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
const allowedOrigins = new Set(env.clientUrls);
if (!env.isProd) {
  allowedOrigins.add('http://localhost:3000');
  allowedOrigins.add('http://127.0.0.1:3000');
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin / non-browser requests (no Origin header) are allowed.
      if (!origin) return callback(null, true);
      // For disallowed origins just omit the CORS headers (the browser blocks
      // the response); do not raise a server error.
      return callback(null, allowedOrigins.has(origin));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads', express.static(path.resolve('uploads')));

app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
