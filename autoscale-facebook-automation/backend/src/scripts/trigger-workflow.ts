/**
 * Script Trigger Workflow
 * Déclenche manuellement un workflow Facebook content
 * Usage: npm run workflow:trigger -- --type case_study
 */

import { Connection, WorkflowClient } from '@temporalio/client';
import { facebookContentWorkflow } from '../temporal/workflows/facebook-content.workflow.js';
import { config } from 'dotenv';

// Load environment variables
config();

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
const TASK_QUEUE = 'facebook-automation';

/**
 * Types de contenu valides
 */
type ContentType = 'case_study' | 'statistic' | 'tip' | 'news' | 'testimonial';

const VALID_TYPES: ContentType[] = [
  'case_study',
  'statistic',
  'tip',
  'news',
  'testimonial',
];

/**
 * Parser les arguments CLI
 */
function parseArgs(): { contentType: ContentType; templateId?: string } {
  const args = process.argv.slice(2);

  let contentType: ContentType = 'statistic'; // Default
  let templateId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' && args[i + 1]) {
      const type = args[i + 1] as ContentType;
      if (VALID_TYPES.includes(type)) {
        contentType = type;
      } else {
        console.error(`❌ Type invalide: ${type}`);
        console.error(`Types valides: ${VALID_TYPES.join(', ')}`);
        process.exit(1);
      }
      i++;
    } else if (args[i] === '--template' && args[i + 1]) {
      templateId = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  return { contentType, templateId };
}

/**
 * Afficher l'aide
 */
function showHelp() {
  console.log(`
┌─────────────────────────────────────────────────┐
│  Trigger Facebook Content Workflow             │
└─────────────────────────────────────────────────┘

Usage:
  npm run workflow:trigger -- [options]

Options:
  --type <type>        Type de contenu à générer
                       Valeurs: case_study, statistic, tip, news, testimonial
                       Défaut: statistic

  --template <id>      ID du template à utiliser (optionnel)

  --help, -h           Afficher cette aide

Exemples:
  npm run workflow:trigger
  npm run workflow:trigger -- --type case_study
  npm run workflow:trigger -- --type tip --template abc-123

Types de contenu:
  • case_study    - Étude de cas client (PME québécoise)
  • statistic     - Statistique percutante (72% PME québécoises...)
  • tip           - Conseil pratique (amélioration service client)
  • news          - Actualité IA pour PME (subventions, tendances)
  • testimonial   - Témoignage client authentique
  `);
}

/**
 * Fonction principale
 */
async function main() {
  console.log('=============================================');
  console.log('🚀 Trigger Facebook Content Workflow');
  console.log('=============================================\n');

  const { contentType, templateId } = parseArgs();

  console.log('📋 Configuration:');
  console.log(`  • Type: ${contentType}`);
  console.log(`  • Template ID: ${templateId || '(auto)'}`);
  console.log(`  • Temporal: ${TEMPORAL_ADDRESS}`);
  console.log('');

  try {
    // Connexion à Temporal
    console.log('[1/3] Connexion à Temporal Server...');
    const connection = await Connection.connect({
      address: TEMPORAL_ADDRESS,
    });
    console.log('✅ Connecté\n');

    // Créer client
    const client = new WorkflowClient({ connection });

    // Générer workflow ID unique
    const workflowId = `facebook-content-${contentType}-${Date.now()}`;
    console.log('[2/3] Démarrage workflow...');
    console.log(`  • Workflow ID: ${workflowId}`);

    // Démarrer workflow
    const handle = await client.start(facebookContentWorkflow, {
      taskQueue: TASK_QUEUE,
      workflowId,
      args: [
        {
          contentType,
          templateId,
        },
      ],
    });

    console.log('✅ Workflow démarré\n');

    console.log('[3/3] Informations workflow:');
    console.log(`  • Workflow ID: ${workflowId}`);
    console.log(`  • Run ID: ${handle.firstExecutionRunId}`);
    console.log(`  • Task Queue: ${TASK_QUEUE}`);
    console.log('');

    console.log('📊 Temporal UI:');
    console.log(`  http://localhost:8233/namespaces/default/workflows/${workflowId}`);
    console.log('');

    console.log('⏳ Le workflow va:');
    console.log('  1. Générer 3 variations de texte (Claude Sonnet 4.5)');
    console.log('  2. Générer une image (DALL-E 3)');
    console.log('  3. Attendre votre approbation');
    console.log('  4. Publier sur Facebook (après approbation)');
    console.log('  5. Collecter analytics (24h après)');
    console.log('');

    console.log('✅ Pour approuver:');
    console.log(`  curl -X POST http://localhost:3001/api/approve/${workflowId} \\`);
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -d \'{"approved": true, "selectedVariation": 0}\'');
    console.log('');

    console.log('=============================================');
    console.log('✅ Workflow déclenché avec succès!');
    console.log('=============================================\n');

    // Fermer connexion
    await connection.close();
  } catch (error) {
    console.error('\n❌ Erreur lors du déclenchement du workflow:\n');

    if (error instanceof Error) {
      console.error('Message:', error.message);

      if (error.message.includes('ECONNREFUSED')) {
        console.error('\n💡 Solution:');
        console.error('  Temporal Server ne tourne pas. Démarrez-le avec:');
        console.error('  docker-compose up -d temporal');
        console.error('  ou');
        console.error('  temporal server start-dev\n');
      }
    }

    process.exit(1);
  }
}

// Exécuter
main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
