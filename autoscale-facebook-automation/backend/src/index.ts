/**
 * Backend API - AutoScale Facebook Automation
 * Express server avec endpoints pour workflows Temporal
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { Connection, WorkflowClient } from '@temporalio/client';
import { facebookContentWorkflow } from './temporal/workflows/facebook-content.workflow.js';
import supabase from './services/supabase.service.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
const TASK_QUEUE = 'facebook-automation';

// ==========================================
// MIDDLEWARES
// ==========================================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin:
      NODE_ENV === 'production'
        ? ['https://autoscaleai.ca', 'https://dashboard.autoscaleai.ca']
        : '*',
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

// ==========================================
// TEMPORAL CLIENT SINGLETON
// ==========================================

let temporalClient: WorkflowClient | null = null;

async function getTemporalClient(): Promise<WorkflowClient> {
  if (!temporalClient) {
    console.log('[API] Connexion à Temporal Server...');
    const connection = await Connection.connect({
      address: TEMPORAL_ADDRESS,
    });
    temporalClient = new WorkflowClient({ connection });
    console.log('[API] ✅ Temporal Client connecté');
  }
  return temporalClient;
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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contentType, templateId }: TriggerWorkflowBody = req.body;

      // Validation
      const validTypes = [
        'case_study',
        'statistic',
        'tip',
        'news',
        'testimonial',
      ];
      const type = contentType || 'statistic';

      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: 'Invalid content type',
          validTypes,
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

      // Validation
      if (typeof approved !== 'boolean') {
        return res.status(400).json({
          error: 'Field "approved" (boolean) is required',
        });
      }

      if (approved && selectedVariation === undefined) {
        return res.status(400).json({
          error: 'Field "selectedVariation" is required when approved=true',
        });
      }

      console.log('[API] Approbation workflow:', workflowId, {
        approved,
        selectedVariation,
      });

      // Obtenir client Temporal
      const client = await getTemporalClient();

      // Récupérer handle workflow
      const handle = client.getHandle(workflowId);

      // Envoyer signal d'approbation
      await handle.signal('approval', {
        approved,
        selectedVariation,
        customEdits,
        publishTime: publishTime ? new Date(publishTime) : undefined,
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
      console.log('[API] Récupération pending approvals');

      const { data, error } = await supabase
        .getClient()
        .from('approval_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      res.json({
        success: true,
        count: data.length,
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
      const limit = parseInt(req.query.limit as string) || 10;

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
 * Global error handler
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API] ❌ Error:', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : undefined,
    stack: NODE_ENV === 'development' ? err.stack : undefined,
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
