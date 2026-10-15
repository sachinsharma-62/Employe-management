import app from './app.js';
import env from './config/env.js';
import connectDB from './config/db.js';

const start = async () => {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`API server running on ${env.serverUrl} [${env.nodeEnv}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

start();
