/**
 * Temporal Worker
 * Exécute les workflows et activities
 * Production-ready avec error handling et logging
 */

import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities/index.js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuration du worker
 */
const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE || 'default';
const TASK_QUEUE = 'facebook-automation';

/**
 * Créer et démarrer le Temporal Worker
 */
async function run() {
  console.log('=============================================');
  console.log('🚀 Temporal Worker - AutoScale Facebook Automation');
  console.log('=============================================');
  console.log(`📍 Temporal Address: ${TEMPORAL_ADDRESS}`);
  console.log(`📍 Namespace: ${TEMPORAL_NAMESPACE}`);
  console.log(`📍 Task Queue: ${TASK_QUEUE}`);
  console.log(`📍 Node Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=============================================\n');

  try {
    // Connexion à Temporal Server
    console.log('[Worker] Connexion à Temporal Server...');
    const connection = await NativeConnection.connect({
      address: TEMPORAL_ADDRESS,
    });
    console.log('[Worker] ✅ Connecté à Temporal Server\n');

    // Workflow files path (compiled TypeScript)
    const workflowsPath = path.join(__dirname, 'workflows');
    console.log(`[Worker] Workflows path: ${workflowsPath}`);

    // Créer le worker
    const worker = await Worker.create({
      connection,
      namespace: TEMPORAL_NAMESPACE,
      taskQueue: TASK_QUEUE,
      workflowsPath,
      activities,
      maxConcurrentActivityTaskExecutions: 5, // Limite concurrence activities
      maxConcurrentWorkflowTaskExecutions: 10, // Limite concurrence workflows
    });

    console.log('[Worker] ✅ Worker créé avec succès');
    console.log('[Worker] Activities enregistrées:');
    console.log('  - generateContentVariations');
    console.log('  - generateImage');
    console.log('  - publishToFacebook');
    console.log('  - notifyApprovalReady');
    console.log('  - collectAnalytics');
    console.log('  - optimizePrompts');
    console.log('');

    // Démarrer le worker
    console.log('[Worker] 🎯 Démarrage du worker...\n');
    console.log('=============================================');
    console.log('✅ Worker actif - En attente de workflows');
    console.log('=============================================\n');

    await worker.run();

    // Ce code ne sera jamais atteint sauf si worker.run() se termine
    console.log('[Worker] Worker arrêté');
  } catch (error) {
    console.error('[Worker] ❌ Erreur fatale:', error);

    if (error instanceof Error) {
      console.error('[Worker] Message:', error.message);
      console.error('[Worker] Stack:', error.stack);
    }

    // Log des erreurs courantes avec solutions
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.error('\n❌ ERREUR: Impossible de se connecter à Temporal Server');
      console.error('💡 Solutions:');
      console.error('  1. Vérifier que Temporal Server tourne:');
      console.error('     docker-compose ps temporal');
      console.error('  2. Vérifier TEMPORAL_ADDRESS dans .env');
      console.error(`     Actuel: ${TEMPORAL_ADDRESS}`);
      console.error('  3. Démarrer Temporal:');
      console.error('     docker-compose up -d temporal\n');
    }

    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\n[Worker] ⚠️  Signal SIGINT reçu - Arrêt gracieux...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Worker] ⚠️  Signal SIGTERM reçu - Arrêt gracieux...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Worker] ❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Ne pas exit en production, juste logger
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('[Worker] ❌ Uncaught Exception:', error);
  // Exit car état corrompu
  process.exit(1);
});

// Démarrer le worker
run().catch((error) => {
  console.error('[Worker] ❌ Erreur lors du démarrage:', error);
  process.exit(1);
});
