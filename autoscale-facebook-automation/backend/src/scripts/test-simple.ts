/**
 * Test Simple - Génération de contenu sans Temporal
 * Teste uniquement Claude API pour vérifier que les credentials fonctionnent
 */

import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

async function testSimple() {
  console.log('🧪 Test Simple - Génération de Contenu\n');

  // Vérifier variables d'environnement
  console.log('📋 Vérification variables d\'environnement:');
  console.log(`  • ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Défini' : '❌ Manquant'}`);
  console.log(`  • OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Défini' : '❌ Manquant'}`);
  console.log(`  • SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Défini' : '❌ Manquant'}`);
  console.log('');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY manquant dans .env');
    process.exit(1);
  }

  try {
    console.log('🤖 Test génération avec Claude Sonnet 4.5...\n');

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const systemPrompt = `Tu es un expert copywriter B2B pour AutoScale AI (réceptionniste IA téléphonique 24/7).
Ton audience: PME québécoises.
Génère du contenu Facebook professionnel et engageant.`;

    const userPrompt = `Génère un post Facebook (120-150 caractères) sur cette statistique:
"72% des PME ratent 30% de leurs appels entrants faute de disponibilité."

Style: Professionnel avec question engageante.
Inclure: 3 hashtags pertinents.
Ton: Français canadien naturel.`;

    console.log('⏳ Envoi requête à Claude Sonnet 4.5...');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const generatedText = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    console.log('✅ Génération réussie!\n');
    console.log('📝 Contenu généré:');
    console.log('═'.repeat(60));
    console.log(generatedText);
    console.log('═'.repeat(60));
    console.log('');

    console.log('📊 Métadonnées:');
    console.log(`  • Modèle: ${response.model}`);
    console.log(`  • Tokens utilisés: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`);
    console.log(`  • Stop reason: ${response.stop_reason}`);
    console.log('');

    // Validation basique
    console.log('🔍 Validation:');
    const hasHashtags = generatedText.includes('#');
    const length = generatedText.length;
    console.log(`  • Hashtags présents: ${hasHashtags ? '✅' : '❌'}`);
    console.log(`  • Longueur: ${length} caractères ${length >= 100 && length <= 200 ? '✅' : '⚠️'}`);
    console.log('');

    console.log('🎉 Test simple réussi!');
    console.log('\n📌 Prochaines étapes:');
    console.log('  1. Démarrer Temporal: docker run -p 7233:7233 temporalio/auto-setup:latest');
    console.log('  2. Lancer worker: npm run temporal:dev');
    console.log('  3. Test complet: npm run workflow:test\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error);
    if (error instanceof Error) {
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Exécuter
testSimple().catch(console.error);
