// index.js
import dotenv from 'dotenv';
dotenv.config();

import TwitterPipeline from './TwitterPipeline.js';
import Logger from './Logger.js';

process.on('unhandledRejection', (error) => {
  Logger.error(`❌ Unhandled promise rejection: ${error.message}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  Logger.error(`❌ Uncaught exception: ${error.message}`);
  process.exit(1);
});

const args = process.argv.slice(2);
// Accept comma-separated list of usernames or default to single user
const usernames = args[0] ? args[0].split(',').map(u => u.trim()) : ['degenspartan'];

let currentPipeline = null;

const cleanup = async () => {
  Logger.warn('\n🛑 Received termination signal. Cleaning up...');
  try {
    if (currentPipeline?.scraper) {
      await currentPipeline.scraper.logout();
      Logger.success('🔒 Logged out successfully.');
    }
  } catch (error) {
    Logger.error(`❌ Error during cleanup: ${error.message}`);
  }
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Process users sequentially
const processUsers = async () => {
  for (const username of usernames) {
    Logger.info(`\n🎯 Processing user: @${username}`);
    currentPipeline = new TwitterPipeline(username);
    try {
      await currentPipeline.run();
    } catch (error) {
      Logger.error(`Failed to process @${username}: ${error.message}`);
      // Continue with next user instead of exiting
      continue;
    }
  }
};

processUsers().catch((error) => {
  Logger.error(`Pipeline execution failed: ${error.message}`);
  process.exit(1);
});
