/**
 * Sentry Configuration Module
 * Centralized error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
import { getOptionalEnv, getEnvAsBoolean } from './env.js';

let sentryInitialized = false;

/**
 * Initialize Sentry with comprehensive configuration
 */
export function initializeSentry(): void {
  const sentryDsn = getOptionalEnv('SENTRY_DSN', '');
  const environment = getOptionalEnv('SENTRY_ENVIRONMENT', 'development');

  // Skip initialization if no DSN provided
  if (!sentryDsn) {
    console.warn('[Sentry] No SENTRY_DSN provided - error tracking disabled');
    return;
  }

  if (sentryInitialized) {
    console.warn('[Sentry] Already initialized');
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment,

      // Performance Monitoring
      tracesSampleRate: parseFloat(getOptionalEnv('SENTRY_TRACES_SAMPLE_RATE', '0.1')),

      // Profiling (built-in for Sentry v10+)
      profilesSampleRate: parseFloat(getOptionalEnv('SENTRY_PROFILES_SAMPLE_RATE', '0.1')),

      // Error filtering - don't send noisy errors
      beforeSend(event, hint) {
        const error = hint.originalException;

        // Filter out known non-critical errors
        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message).toLowerCase();

          // Skip common benign errors
          if (message.includes('econnreset') ||
              message.includes('socket hang up') ||
              message.includes('network error')) {
            return null; // Don't send to Sentry
          }
        }

        return event;
      },

      // Additional context
      initialScope: {
        tags: {
          service: 'autoscale-facebook-automation',
          component: 'backend',
        },
      },
    });

    sentryInitialized = true;
    console.log(`[Sentry] ✅ Initialized successfully (environment: ${environment})`);
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Capture error with additional context
 */
export function captureError(error: Error, context?: Record<string, any>): void {
  if (!sentryInitialized) {
    console.error('[Sentry] Not initialized - error not sent:', error);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message with severity
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
): void {
  if (!sentryInitialized) {
    console.log('[Sentry] Not initialized - message not sent:', message);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Add breadcrumb for debugging context
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
): void {
  if (!sentryInitialized) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Set user context for error tracking
 */
export function setUser(userId: string, email?: string, username?: string): void {
  if (!sentryInitialized) {
    return;
  }

  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUser(): void {
  if (!sentryInitialized) {
    return;
  }

  Sentry.setUser(null);
}

/**
 * Start a span for performance monitoring (Sentry v10+)
 */
export function startSpan<T>(name: string, op: string, callback: () => T): T {
  return Sentry.startSpan(
    {
      name,
      op,
    },
    callback
  );
}

/**
 * Wrap async function with Sentry context (Sentry v10+)
 */
export function wrapWithSentry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return Sentry.startSpan(
      {
        name,
        op: 'function',
      },
      async () => {
        try {
          const result = await fn(...args);
          return result;
        } catch (error) {
          if (error instanceof Error) {
            captureError(error, {
              function: name,
              arguments: args,
            });
          }
          throw error;
        }
      }
    );
  }) as T;
}

/**
 * Check if Sentry is initialized
 */
export function isSentryEnabled(): boolean {
  return sentryInitialized;
}

// Export Sentry for advanced usage
export { Sentry };
