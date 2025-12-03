/**
 * Environment Variable Validation
 * Validates required environment variables on server startup
 */

interface EnvConfig {
  // Server
  PORT: string;
  NODE_ENV: string;

  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Gemini AI
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;

  // CORS
  FRONTEND_URL: string;

  // JWT
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;

  // Email
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
}

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'FRONTEND_URL',
] as const;

const optionalEnvVars = [
  'PORT',
  'NODE_ENV',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'RESEND_API_KEY',
  'FROM_EMAIL',
] as const;

export function validateEnv(): EnvConfig {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // If missing required vars, throw error
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\n💡 Copy .env.example to .env and fill in the values\n');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Check optional but important variables
  if (!process.env.RESEND_API_KEY) {
    warnings.push('RESEND_API_KEY is not set - email invitations will not work');
  }

  if (!process.env.FROM_EMAIL) {
    warnings.push('FROM_EMAIL is not set - using default sender');
  }

  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'your_jwt_secret_change_this_in_production') {
    console.error('\n🚨 CRITICAL: JWT_SECRET is set to default value in production!');
    throw new Error('JWT_SECRET must be changed in production');
  }

  // Validate URL formats
  try {
    new URL(process.env.SUPABASE_URL!);
  } catch {
    throw new Error(`SUPABASE_URL is not a valid URL: ${process.env.SUPABASE_URL}`);
  }

  try {
    new URL(process.env.FRONTEND_URL!);
  } catch {
    throw new Error(`FRONTEND_URL is not a valid URL: ${process.env.FRONTEND_URL}`);
  }

  // Validate PORT
  const port = parseInt(process.env.PORT || '3001');
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be a valid port number (1-65535): ${process.env.PORT}`);
  }

  // Print warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment warnings:');
    warnings.forEach(w => console.warn(`   - ${w}`));
    console.warn('');
  }

  // Success
  console.log('✅ Environment variables validated successfully\n');

  return process.env as unknown as EnvConfig;
}

// Export validated config
export const env = validateEnv();
