import app from './app';
import { config, validateEnv } from './config/config';

// Validate environment variables
validateEnv();

// Start the server
app.listen(config.port, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📦 Environment: ${config.env}`);
  console.log(`=================================`);
});
