import app from "./app.js";
import env from "./config/env.js";
import connectDB from "./config/db.js";

const RETRY_DELAY_MS = 3000;
const MAX_ATTEMPTS = env.isProd ? 5 : 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectWithRetry = async () => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await connectDB();
      return;
    } catch (err) {
      console.error(
        `MongoDB connection failed (attempt ${attempt}/${MAX_ATTEMPTS}): ${err.message}`
      );
      if (attempt === MAX_ATTEMPTS) throw err;
      await sleep(RETRY_DELAY_MS);
    }
  }
};

const start = async () => {
  try {
    await connectWithRetry();
  } catch (err) {
    console.error('\nCould not connect to MongoDB. Error details:');
    console.error(err?.stack || err);
    console.error('\nTroubleshooting Checklist:');
    console.error('  1. MongoDB Atlas Network Access: Make sure IP 0.0.0.0/0 (Allow from Anywhere) is active.');
    console.error('  2. Verify MONGODB_URI in Render environment variables or server/.env.');
    console.error('  3. If running locally without Atlas, use: npm run dev:memory\n');
    process.exit(1);
  }

  const server = app.listen(env.port, env.host, () => {
    console.log(
      `API server running on http://${env.host}:${env.port} [${env.nodeEnv}]`,
    );
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${env.port} is already in use. Stop the other process or set a different PORT in server/.env.`,
      );
    } else {
      console.error("Server error:", err.message);
    }
    process.exit(1);
  });
};

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  // In development keep serving so a transient error does not crash nodemon.
  if (env.isProd) process.exit(1);
});

start();
