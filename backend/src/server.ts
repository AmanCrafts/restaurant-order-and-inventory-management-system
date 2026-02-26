import app from './app';
import { config, validateEnv } from './shared/config/env';
import logger from './shared/utils/logger';

// Validate environment variables
validateEnv();

// Start the server
app.listen(config.port, () => {
  logger.info('=================================');
  logger.info(`🚀 Server running on http://localhost:${config.port}`);
  logger.info(`📦 Environment: ${config.env}`);
  logger.info('=================================');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
