import app from './app.js';
import { config } from './config/config.js';
import { connectDB } from './config/db.js';

async function startServer() {
  try {
    await connectDB();

    app.listen(config.port, () => {
      console.log(`StartupFund API server listening on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start StartupFund:', error.message);
    process.exit(1);
  }
}

startServer();