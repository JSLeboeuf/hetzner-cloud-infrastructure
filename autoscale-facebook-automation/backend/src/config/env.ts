/**
 * Environment Variable Validation
 * Ensures all required environment variables are set at startup
 */

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  validate?: (value: string) => boolean;
}

const ENV_VARIABLES: EnvVar[] = [
  // Supabase
  {
    name: 'SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    validate: (val) => val.startsWith('https://') && val.includes('.supabase.co'),
  },
  {
    name: 'SUPABASE_SERVICE_KEY',
    required: true,
    description: 'Supabase service role key',
    validate: (val) => val.startsWith('eyJ') && val.length > 100,
  },

  // AI Providers
  {
    name: 'KAI_API_KEY',
    required: true,
    description: 'kie.ai API key for Claude Sonnet 4.5',
    validate: (val) => val.length >= 32,
  },
  {
    name: 'OPENAI_API_KEY',
    required: true,
    description: 'OpenAI API key for DALL-E 3',
    validate: (val) => val.startsWith('sk-') && val.length > 20,
  },

  // Facebook
  {
    name: 'FACEBOOK_PAGE_ID',
    required: true,
    description: 'Facebook Page ID',
    validate: (val) => /^\d+$/.test(val),
  },
  {
    name: 'FACEBOOK_ACCESS_TOKEN',
    required: true,
    description: 'Facebook permanent page access token',
    validate: (val) => val.length > 50,
  },

  // Temporal
  {
    name: 'TEMPORAL_ADDRESS',
    required: false,
    description: 'Temporal server address (defaults to localhost:7233)',
  },
  {
    name: 'TEMPORAL_NAMESPACE',
    required: false,
    description: 'Temporal namespace (defaults to default)',
  },

  // Application
  {
    name: 'NODE_ENV',
    required: false,
    description: 'Node environment (development, production)',
    validate: (val) => ['development', 'production', 'test'].includes(val),
  },
  {
    name: 'PORT',
    required: false,
    description: 'Server port (defaults to 3001)',
    validate: (val) => !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) < 65536,
  },
  {
    name: 'LOG_LEVEL',
    required: false,
    description: 'Log level (error, warn, info, debug)',
    validate: (val) => ['error', 'warn', 'info', 'debug'].includes(val),
  },
  {
    name: 'ALLOWED_ORIGINS',
    required: false,
    description: 'Comma-separated list of allowed CORS origins',
  },

  // Monitoring (Sentry)
  {
    name: 'SENTRY_DSN',
    required: false,
    description: 'Sentry DSN for error tracking',
    validate: (val) => val.startsWith('https://') && val.includes('sentry.io'),
  },
  {
    name: 'SENTRY_AUTH_TOKEN',
    required: false,
    description: 'Sentry authentication token',
  },
  {
    name: 'SENTRY_ENVIRONMENT',
    required: false,
    description: 'Sentry environment (development, staging, production)',
    validate: (val) => ['development', 'staging', 'production'].includes(val),
  },
  {
    name: 'SENTRY_TRACES_SAMPLE_RATE',
    required: false,
    description: 'Sentry traces sample rate (0.0 to 1.0)',
    validate: (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 1;
    },
  },
];

/**
 * Validates all required environment variables
 * Throws error if any required variable is missing or invalid
 */
export function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('[ENV] Validating environment variables...');

  for (const envVar of ENV_VARIABLES) {
    const value = process.env[envVar.name];

    // Check if required variable exists
    if (envVar.required && !value) {
      errors.push(`Missing required environment variable: ${envVar.name} (${envVar.description})`);
      continue;
    }

    // Warn if optional variable is missing
    if (!envVar.required && !value) {
      warnings.push(`Optional environment variable not set: ${envVar.name} (${envVar.description})`);
      continue;
    }

    // Validate value if validation function exists
    if (value && envVar.validate) {
      try {
        if (!envVar.validate(value)) {
          errors.push(
            `Invalid value for ${envVar.name}: validation failed (${envVar.description})`
          );
        }
      } catch (error) {
        errors.push(`Error validating ${envVar.name}: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('[ENV] Warnings:');
    warnings.forEach((warning) => console.warn(`  ⚠️  ${warning}`));
  }

  // Throw error if any required variables are missing or invalid
  if (errors.length > 0) {
    console.error('[ENV] ❌ Environment validation failed:');
    errors.forEach((error) => console.error(`  ❌ ${error}`));
    console.error('\n[ENV] Please check your .env file and ensure all required variables are set.');
    console.error('[ENV] See .env.example for reference.\n');
    throw new Error(`Environment validation failed with ${errors.length} error(s)`);
  }

  console.log('[ENV] ✅ All required environment variables validated successfully');
}

/**
 * Gets a required environment variable
 * Throws error if not found (should not happen after validateEnv)
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Gets an optional environment variable with default value
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Gets an environment variable as integer
 */
export function getEnvAsInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`[ENV] Invalid integer value for ${key}: ${value}, using default: ${defaultValue}`);
    return defaultValue;
  }

  return parsed;
}

/**
 * Gets an environment variable as boolean
 */
export function getEnvAsBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;

  return value.toLowerCase() === 'true' || value === '1';
}
