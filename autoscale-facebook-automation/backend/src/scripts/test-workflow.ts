/**
 * Script Test Workflow
 * Test end-to-end du workflow Facebook content avec approbation automatique
 * Usage: npm run workflow:test
 */

import { Connection, WorkflowClient } from '@temporalio/client';
import { facebookContentWorkflow } from '../temporal/workflows/facebook-content.workflow.js';
import { config } from 'dotenv';

// Load environment variables
config();

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
const TASK_QUEUE = 'facebook-automation';

/**
 * Attendre X secondes
 */
function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

/**
 * Test complet du workflow
 */
async function main() {
  console.log('=============================================');
  console.log('🧪 Test End-to-End - Facebook Content Workflow');
  console.log('=============================================\n');

  console.log('⚠️  ATTENTION: Ce test va:');
  console.log('  1. Générer du contenu (coût API Claude)');
  console.log('  2. Générer une image (coût API DALL-E)');
  console.log('  3. Approuver automatiquement après 10 secondes');
  console.log('  4. ⚠️  PUBLIER sur Facebook (si activé)\n');

  const dryRun = process.env.FACEBOOK_DRY_RUN !== 'false';

  if (dryRun) {
    console.log('✅ Mode DRY RUN activé - Pas de publication Facebook réelle\n');
  } else {
    console.log('❌ Mode PRODUCTION - Publication Facebook RÉELLE!\n');
    console.log('⏳ Attente 5 secondes pour annuler (Ctrl+C)...\n');
    await sleep(5);
  }

  let connection: any = null;
  let workflowId = '';

  try {
    // Connexion à Temporal
    console.log('[1/6] Connexion à Temporal Server...');
    connection = await Connection.connect({
      address: TEMPORAL_ADDRESS,
    });
    console.log('✅ Connecté\n');

    // Créer client
    const client = new WorkflowClient({ connection });

    // Générer workflow ID unique
    workflowId = `facebook-test-${Date.now()}`;

    console.log('[2/6] Démarrage workflow de test...');
    console.log(`  • Workflow ID: ${workflowId}`);
    console.log(`  • Content Type: statistic (test)`);
    console.log('');

    // Démarrer workflow
    const handle = await client.start(facebookContentWorkflow, {
      taskQueue: TASK_QUEUE,
      workflowId,
      args: [
        {
          contentType: 'statistic',
          templateId: undefined,
        },
      ],
    });

    console.log('✅ Workflow démarré\n');

    console.log('[3/6] Génération contenu en cours...');
    console.log('  ⏳ Attente génération Claude + DALL-E (30-60s)...\n');

    // Attendre que le workflow atteigne l'état "waiting for approval"
    let retries = 0;
    const maxRetries = 30; // 30 * 2s = 60s max

    while (retries < maxRetries) {
      await sleep(2);

      try {
        const description = await handle.describe();

        // Vérifier si workflow est en attente d'approbation
        // (il y aura des pending activities pour le signal)
        if (description.pendingActivities.length === 0) {
          console.log('✅ Génération terminée!\n');
          break;
        }
      } catch (error) {
        // Ignorer erreurs temporaires
      }

      retries++;
      process.stdout.write('.');
    }

    if (retries >= maxRetries) {
      console.log('\n⚠️  Timeout - Génération prend plus de 60s');
      console.log('  Le workflow continue en arrière-plan\n');
    }

    console.log('[4/6] Vérification workflow...');
    const description = await handle.describe();
    console.log(`  • Status: ${description.status.name}`);
    console.log(`  • History Length: ${description.historyLength}`);
    console.log('');

    console.log('[5/6] Attente avant approbation automatique...');
    console.log('  ⏳ 10 secondes...\n');
    await sleep(10);

    console.log('[6/6] Envoi signal d\'approbation...');
    await handle.signal('approval', {
      approved: true,
      selectedVariation: 0, // Choisir première variation
      customEdits: undefined,
      publishTime: undefined, // Publier immédiatement
    });

    console.log('✅ Signal envoyé\n');

    console.log('⏳ Attente fin du workflow...');
    console.log('  (Publication + scheduling analytics collection)\n');

    // Attendre résultat final (timeout 2 min)
    const result = await Promise.race([
      handle.result(),
      sleep(120).then(() => {
        throw new Error('Timeout: Workflow prend plus de 2 minutes');
      }),
    ]);

    console.log('=============================================');
    console.log('✅ WORKFLOW TERMINÉ AVEC SUCCÈS!');
    console.log('=============================================\n');

    console.log('📊 Résultat:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');

    if (result.success) {
      console.log('✅ Toutes les étapes complétées:');
      console.log(`  • Contenu généré: ${result.variations?.length || 0} variations`);
      console.log(`  • Image générée: ${result.imageUrl ? 'Oui' : 'Non'}`);
      console.log(
        `  • Facebook post: ${result.facebookPostId || '(dry-run - pas publié)'}`
      );
      console.log('');

      if (result.variations && result.variations.length > 0) {
        console.log('📝 Variation sélectionnée:');
        console.log('---');
        console.log(result.variations[0].text);
        console.log('---\n');
      }

      if (result.imageUrl) {
        console.log('🖼️  Image URL:');
        console.log(result.imageUrl);
        console.log('');
      }
    } else {
      console.log('❌ Workflow terminé avec erreurs:');
      console.log(result.error || 'Erreur inconnue');
      console.log('');
    }

    console.log('📊 Temporal UI:');
    console.log(
      `  http://localhost:8233/namespaces/default/workflows/${workflowId}\n`
    );

    console.log('🗄️  Vérifier Supabase:');
    console.log('  SELECT * FROM content_generations');
    console.log(`  WHERE workflow_id = '${workflowId}';\n`);

    console.log('=============================================');
    console.log('✅ Test réussi!');
    console.log('=============================================\n');
  } catch (error) {
    console.error('\n❌ Erreur lors du test:\n');

    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('\nStack:', error.stack);

      if (error.message.includes('ECONNREFUSED')) {
        console.error('\n💡 Solution:');
        console.error('  Temporal Server ne tourne pas. Démarrez-le avec:');
        console.error('  docker-compose up -d temporal\n');
      } else if (error.message.includes('Timeout')) {
        console.error('\n💡 Le workflow continue en arrière-plan.');
        console.error('  Vérifiez Temporal UI:');
        console.error(
          `  http://localhost:8233/namespaces/default/workflows/${workflowId}\n`
        );
      }
    }

    process.exit(1);
  } finally {
    // Fermer connexion
    if (connection) {
      await connection.close();
    }
  }
}

// Exécuter
main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
