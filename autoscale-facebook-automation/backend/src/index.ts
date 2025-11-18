/**
 * Backend API - AutoScale Facebook Automation
 * Express server avec endpoints pour workflows Temporal
 */

// CRITICAL: Load environment variables FIRST before any other imports
import { config } from 'dotenv';
config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Connection, WorkflowClient } from '@temporalio/client';
import { facebookContentWorkflow } from './temporal/workflows/facebook-content.workflow.js';
import supabase from './services/supabase.service.js';
import { validateEnv, getOptionalEnv, getEnvAsInt } from './config/env.js';
import {
  validateWorkflowId,
  validateContentType,
  validateVariationIndex,
  validatePublishTime,
  validateLimit,
  validateOffset,
  sanitizeText,
} from './utils/validation.js';
import {
  initializeSentry,
  captureError,
  captureMessage,
  addBreadcrumb,
  isSentryEnabled,
  Sentry,
} from './config/sentry.js';

// Validate environment variables before starting server
try {
  validateEnv();
} catch (error) {
  console.error('[SERVER] Failed to start due to environment validation errors');
  process.exit(1);
}

// Initialize Sentry monitoring
initializeSentry();

const app = express();
const PORT = getEnvAsInt('PORT', 3001);
const NODE_ENV = getOptionalEnv('NODE_ENV', 'development');
const TEMPORAL_ADDRESS = getOptionalEnv('TEMPORAL_ADDRESS', 'localhost:7233');
const TASK_QUEUE = 'facebook-automation';

// ==========================================
// MIDDLEWARES
// ==========================================

// Sentry instrumentation (MUST be first) - v10+ uses setupExpressErrorHandler at the end
// No request handler needed in v10+

// Security headers
app.use(helmet());

// CORS - Secure configuration
const allowedOrigins = getOptionalEnv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map(origin => origin.trim());

if (NODE_ENV === 'production') {
  allowedOrigins.push('https://autoscaleai.ca', 'https://dashboard.autoscaleai.ca');
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    maxAge: 86400, // Cache preflight requests for 24 hours
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting - Global limit for all API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    message: 'Please try again later',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for health check
  skip: (req: Request) => req.path === '/health',
});

// Stricter rate limiting for expensive operations
const workflowLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 workflow triggers per minute per IP
  message: {
    error: 'Too many workflow requests',
    message: 'Please wait before triggering more workflows',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply global rate limiter to all /api routes
app.use('/api/', apiLimiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

// ==========================================
// TEMPORAL CLIENT SINGLETON (Thread-Safe)
// ==========================================

let temporalClient: WorkflowClient | null = null;
let temporalClientPromise: Promise<WorkflowClient> | null = null;

async function getTemporalClient(): Promise<WorkflowClient> {
  // If already initialized, return immediately
  if (temporalClient) {
    return temporalClient;
  }

  // If initialization in progress, wait for it
  if (temporalClientPromise) {
    return temporalClientPromise;
  }

  // Start initialization (race condition protected)
  temporalClientPromise = (async () => {
    try {
      console.log('[API] Connexion à Temporal Server...');
      const connection = await Connection.connect({
        address: TEMPORAL_ADDRESS,
      });
      temporalClient = new WorkflowClient({ connection });
      console.log('[API] ✅ Temporal Client connecté');
      return temporalClient;
    } catch (error) {
      // Reset promise on error so next call can retry
      temporalClientPromise = null;
      throw error;
    }
  })();

  return temporalClientPromise;
}

// ==========================================
// TYPES
// ==========================================

interface TriggerWorkflowBody {
  contentType?: 'case_study' | 'statistic' | 'tip' | 'news' | 'testimonial';
  templateId?: string;
}

interface ApprovalBody {
  approved: boolean;
  selectedVariation?: number;
  customEdits?: string;
  publishTime?: string; // ISO datetime
}

// ==========================================
// ROUTES
// ==========================================

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    temporalAddress: TEMPORAL_ADDRESS,
  });
});

/**
 * GET / - Root endpoint
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'AutoScale Facebook Automation API',
    version: '1.0.0',
    environment: NODE_ENV,
    endpoints: {
      health: 'GET /health',
      triggerWorkflow: 'POST /api/trigger-workflow',
      approveWorkflow: 'POST /api/approve/:workflowId',
      workflowStatus: 'GET /api/workflow/:workflowId',
    },
  });
});

/**
 * POST /api/trigger-workflow
 * Déclenche un nouveau workflow de génération Facebook
 */
app.post(
  '/api/trigger-workflow',
  workflowLimiter, // Apply stricter rate limit for workflow triggers
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contentType, templateId }: TriggerWorkflowBody = req.body;

      // Validate content type
      const type = contentType || 'statistic';
      if (!validateContentType(type)) {
        return res.status(400).json({
          error: 'Invalid content type',
          validTypes: ['case_study', 'statistic', 'tip', 'news', 'testimonial'],
        });
      }

      // Validate template ID if provided
      if (templateId && typeof templateId !== 'string') {
        return res.status(400).json({
          error: 'Invalid template ID',
        });
      }
      if (templateId && !/^[a-zA-Z0-9_-]{1,50}$/.test(templateId)) {
        return res.status(400).json({
          error: 'Invalid template ID format (alphanumeric, underscore, dash only, max 50 chars)',
        });
      }

      // Générer workflow ID unique
      const workflowId = `facebook-content-${type}-${Date.now()}`;

      console.log('[API] Déclenchement workflow:', workflowId);

      // Obtenir client Temporal
      const client = await getTemporalClient();

      // Démarrer workflow
      const handle = await client.start(facebookContentWorkflow, {
        taskQueue: TASK_QUEUE,
        workflowId,
        args: [
          {
            contentType: type,
            templateId,
          },
        ],
      });

      console.log('[API] ✅ Workflow démarré:', workflowId);

      res.status(202).json({
        success: true,
        workflowId,
        runId: handle.firstExecutionRunId,
        message: 'Workflow démarré avec succès',
        dashboardUrl: `http://localhost:8233/namespaces/default/workflows/${workflowId}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/approve/:workflowId
 * Envoie signal d'approbation au workflow
 */
app.post(
  '/api/approve/:workflowId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workflowId } = req.params;
      const { approved, selectedVariation, customEdits, publishTime }: ApprovalBody =
        req.body;

      // Validate workflow ID format (SQL injection protection)
      if (!validateWorkflowId(workflowId)) {
        return res.status(400).json({
          error: 'Invalid workflow ID format',
        });
      }

      // Validate approved field
      if (typeof approved !== 'boolean') {
        return res.status(400).json({
          error: 'Field "approved" (boolean) is required',
        });
      }

      // Validate selectedVariation when approved
      if (approved) {
        if (selectedVariation === undefined) {
          return res.status(400).json({
            error: 'Field "selectedVariation" is required when approved=true',
          });
        }

        if (!validateVariationIndex(selectedVariation)) {
          return res.status(400).json({
            error: 'Invalid selectedVariation (must be 0, 1, or 2)',
          });
        }
      }

      // Validate and sanitize customEdits
      let sanitizedEdits: string | undefined;
      if (customEdits) {
        if (typeof customEdits !== 'string') {
          return res.status(400).json({
            error: 'Field "customEdits" must be a string',
          });
        }
        if (customEdits.length > 5000) {
          return res.status(400).json({
            error: 'Field "customEdits" too long (max 5000 characters)',
          });
        }
        sanitizedEdits = sanitizeText(customEdits);
      }

      // Validate publishTime
      let validatedPublishTime: Date | undefined;
      if (publishTime) {
        try {
          validatedPublishTime = validatePublishTime(publishTime);
        } catch (error) {
          return res.status(400).json({
            error: error instanceof Error ? error.message : 'Invalid publishTime',
          });
        }
      }

      console.log('[API] Approbation workflow:', workflowId, {
        approved,
        selectedVariation,
      });

      // Obtenir client Temporal
      const client = await getTemporalClient();

      // Récupérer handle workflow
      const handle = client.getHandle(workflowId);

      // Envoyer signal d'approbation (using validated/sanitized values)
      await handle.signal('approval', {
        approved,
        selectedVariation,
        customEdits: sanitizedEdits,
        publishTime: validatedPublishTime,
      });

      console.log('[API] ✅ Signal envoyé:', workflowId);

      // Mettre à jour Supabase
      await supabase.updateApprovalQueueItem(workflowId, {
        status: approved ? 'approved' : 'rejected',
        approved_by: 'api', // TODO: Authentification utilisateur
        approved_at: new Date().toISOString(),
      });

      res.json({
        success: true,
        workflowId,
        message: approved
          ? `Workflow approuvé - Variation ${selectedVariation} sera publiée`
          : 'Workflow rejeté',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/workflow/:workflowId
 * Récupère le status d'un workflow
 */
app.get(
  '/api/workflow/:workflowId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workflowId } = req.params;

      // Validate workflow ID format (SQL injection protection)
      if (!validateWorkflowId(workflowId)) {
        return res.status(400).json({
          error: 'Invalid workflow ID format',
        });
      }

      console.log('[API] Status workflow:', workflowId);

      // Obtenir client Temporal
      const client = await getTemporalClient();

      // Récupérer handle workflow
      const handle = client.getHandle(workflowId);

      // Récupérer description
      const description = await handle.describe();

      res.json({
        success: true,
        workflow: {
          id: workflowId,
          runId: description.runId,
          status: description.status.name,
          startTime: description.startTime,
          closeTime: description.closeTime,
          historyLength: description.historyLength,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/pending-approvals
 * Liste des workflows en attente d'approbation
 */
app.get(
  '/api/pending-approvals',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and sanitize pagination parameters
      const limit = validateLimit(req.query.limit as string | undefined);
      const offset = validateOffset(req.query.offset as string | undefined);

      console.log('[API] Récupération pending approvals', { limit, offset });

      const { data, error, count } = await supabase
        .getClient()
        .from('approval_queue')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      res.json({
        success: true,
        count: data.length,
        total: count || 0,
        limit,
        offset,
        approvals: data,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/recent-posts
 * Posts Facebook récents
 */
app.get(
  '/api/recent-posts',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use validation utility (consistent with other endpoints, prevents DoS)
      const limit = validateLimit(req.query.limit as string | undefined);

      console.log('[API] Récupération recent posts:', limit);

      const { data, error } = await supabase
        .getClient()
        .from('facebook_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      res.json({
        success: true,
        count: data.length,
        posts: data,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// ERROR HANDLING
// ==========================================

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  });
});

/**
 * Global error handler (Sentry v10+ auto-instruments Express errors)
 * NEVER exposes stack traces to prevent information leakage
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log full error details server-side
  console.error('[API] ❌ Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Send to Sentry with additional context
  if (isSentryEnabled()) {
    captureError(err, {
      path: req.path,
      method: req.method,
      query: req.query,
      body: req.body,
      ip: req.ip,
    });
  }

  // NEVER expose stack traces or detailed error messages to client
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred. Please try again later.',
    // In development, hint where to find details
    ...(NODE_ENV === 'development' && {
      hint: 'Check server logs or Sentry for detailed error information',
    }),
  });
});

// ==========================================
// SERVER START
// ==========================================

async function startServer() {
  console.log('=============================================');
  console.log('🚀 AutoScale Facebook Automation - Backend API');
  console.log('=============================================');
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`📍 Temporal Address: ${TEMPORAL_ADDRESS}`);
  console.log('=============================================\n');

  try {
    // Pré-connexion Temporal (optionnel mais utile)
    await getTemporalClient();

    // Test connexion Supabase
    const { data, error } = await supabase
      .getClient()
      .from('system_logs')
      .select('id')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    console.log('[API] ✅ Supabase connecté\n');

    // Démarrer serveur
    app.listen(PORT, () => {
      console.log('=============================================');
      console.log(`✅ API Server running on port ${PORT}`);
      console.log('=============================================');
      console.log(`\n📍 Local: http://localhost:${PORT}`);
      console.log(`📍 Health: http://localhost:${PORT}/health`);
      console.log(`📍 Temporal UI: http://localhost:8233\n`);
    });
  } catch (error) {
    console.error('[API] ❌ Erreur démarrage:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[API] ⚠️  SIGINT reçu - Arrêt gracieux...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[API] ⚠️  SIGTERM reçu - Arrêt gracieux...');
  process.exit(0);
});

// Démarrer serveur
startServer().catch((error) => {
  console.error('[API] ❌ Fatal error:', error);
  process.exit(1);
});
