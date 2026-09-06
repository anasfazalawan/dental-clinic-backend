import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

/**
 * Centralized Environment Configuration
 * Strictly extracts all configuration directly from process.env without hardcoded fallbacks.
 */
export const env = {
  PORT: process.env.PORT ? Number(process.env.PORT) : undefined,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : [],
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};
