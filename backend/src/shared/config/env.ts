import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL || '',
    directUrl: process.env.DIRECT_URL || '',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
};

export function validateEnv(): void {
  const required = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = required.filter(
    (key) => !process.env[key] || process.env[key]?.startsWith('your_'),
  );

  if (missing.length > 0) {
    console.warn('⚠️  Missing required environment variables:');
    missing.forEach((key) => console.warn(`   - ${key}`));
    console.warn(
      '\nPlease update your .env file with valid values from your Supabase project.\n',
    );
  }
}

export default config;
