/**
 * Content Generation Activity
 *
 * Génère 3 variations de contenu avec Claude Sonnet 4.5 (via kie.ai)
 * Qualité maximale garantie
 */

import Anthropic from '@anthropic-ai/sdk';
import { Context } from '@temporalio/activity';
import { CONTENT_PROMPTS } from '../../config/prompts.config.js';
import { supabase } from '../../services/supabase.service.js';
import { calculateEngagementScore } from '../../services/ml-optimizer.service.js';
import { captureError, addBreadcrumb } from '../../config/sentry.js';

const anthropic = new Anthropic({
  apiKey: process.env.KAI_API_KEY || process.env.ANTHROPIC_API_KEY,
});

export interface GenerateContentInput {
  contentType: 'case_study' | 'statistic' | 'tip' | 'news' | 'testimonial';
  templateId?: string;
  overridePrompt?: string;
}

export interface ContentVariation {
  text: string;
  style: 'professional' | 'storytelling' | 'question';
  score: number; // Engagement prédit (0-100)
  hashtags: string[];
  promptUsed: string;
}

export interface GenerateContentResult {
  success: boolean;
  variations?: ContentVariation[];
  error?: string;
}

/**
 * Validates input to prevent prompt injection and DoS attacks
 */
function validateContentInput(input: GenerateContentInput): void {
  // Validate content type
  const validTypes = ['case_study', 'statistic', 'tip', 'news', 'testimonial'];
  if (!validTypes.includes(input.contentType)) {
    throw new Error(`Invalid content type: ${input.contentType}`);
  }

  // Validate override prompt if provided
  if (input.overridePrompt) {
    // Check length to prevent DoS via API cost
    if (input.overridePrompt.length > 2000) {
      throw new Error('Override prompt too long (max 2000 characters)');
    }

    // Check for prompt injection patterns
    const suspiciousPatterns = [
      /ignore\s+previous\s+instructions/i,
      /disregard\s+all\s+prior/i,
      /system\s*:\s*role/i,
      /forget\s+everything/i,
      /<\s*script/i, // XSS attempt
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input.overridePrompt)) {
        throw new Error('Invalid prompt content detected - potential injection attempt');
      }
    }
  }

  // Validate template ID format if provided
  if (input.templateId && !/^[a-zA-Z0-9_-]{1,50}$/.test(input.templateId)) {
    throw new Error('Invalid template ID format');
  }
}

/**
 * Génère 3 variations de contenu Facebook optimisées
 */
export async function generateContentVariations(
  input: GenerateContentInput
): Promise<GenerateContentResult> {
  const context = Context.current();

  try {
    console.log(`[Activity:GenerateContent] Starting for type: ${input.contentType}`);

    // Validate input to prevent attacks
    validateContentInput(input);

    // Récupérer le prompt optimal (template ou custom)
    const basePrompt = input.overridePrompt ||
      await getOptimizedPrompt(input.contentType, input.templateId);

    const variations: ContentVariation[] = [];

    // Générer 3 variations avec styles différents
    const styles: Array<'professional' | 'storytelling' | 'question'> = [
      'professional',
      'storytelling',
      'question',
    ];

    const MAX_RETRIES = 2;

    for (const style of styles) {
      let attempt = 0;
      let generatedText = '';
      let fullPrompt = '';
      let validation: { valid: boolean; reason?: string } = { valid: false, reason: '' };

      // Retry logic with exponential backoff
      while (attempt <= MAX_RETRIES) {
        try {
          context.heartbeat(`Generating ${style} variation (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);

          fullPrompt = buildPrompt(basePrompt, style, input.contentType);

          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514', // Claude Sonnet 4.5 (latest)
            max_tokens: 500,
            temperature: 0.7 + (attempt * 0.1), // Increase temperature slightly on retries
            system: SYSTEM_PROMPT_FACEBOOK,
            messages: [
              {
                role: 'user',
                content: fullPrompt,
              },
            ],
          });

          // Heartbeat after API call to prevent timeout
          context.heartbeat(`Validating ${style} content`);

          // Validate response structure (prevent null/undefined access)
          if (!response.content || !Array.isArray(response.content) || response.content.length === 0) {
            throw new Error(`Claude returned invalid response structure for ${style} variation`);
          }

          const firstContent = response.content[0];
          if (!firstContent || typeof firstContent !== 'object') {
            throw new Error(`Claude returned invalid content object for ${style} variation`);
          }

          generatedText = firstContent.type === 'text' && 'text' in firstContent
            ? firstContent.text
            : '';

          if (!generatedText) {
            throw new Error(`Claude returned empty response for ${style} variation`);
          }

          // Validation anti-clichés IA
          validation = validateContent(generatedText);
          if (validation.valid) {
            break; // Success! Exit retry loop
          }

          console.warn(`[Activity:GenerateContent] Validation failed for ${style} (attempt ${attempt + 1}): ${validation.reason}`);
          attempt++;

          // Don't retry if we've exhausted attempts
          if (attempt > MAX_RETRIES) {
            break;
          }

        } catch (error) {
          console.error(`[Activity:GenerateContent] Error generating ${style} (attempt ${attempt + 1}):`, error);
          attempt++;

          if (attempt > MAX_RETRIES) {
            throw error; // Re-throw on final attempt
          }
        }
      }

      // Skip this style if validation failed after all retries
      if (!validation.valid) {
        console.error(`[Activity:GenerateContent] Failed to generate valid ${style} variation after ${MAX_RETRIES + 1} attempts`);
        continue;
      }

      // Extraire hashtags
      const hashtags = extractHashtags(generatedText, input.contentType);

      // Heartbeat before async scoring operation
      context.heartbeat(`Calculating engagement score for ${style}`);

      // Calculer score engagement prédit (ML)
      const score = await calculateEngagementScore({
        text: generatedText,
        contentType: input.contentType,
        style,
        hashtags,
      });

      variations.push({
        text: generatedText,
        style,
        score,
        hashtags,
        promptUsed: fullPrompt,
      });

      console.log(`[Activity:GenerateContent] Generated ${style} variation (score: ${score})`);
    }

    // Assurer au moins 2 variations valides
    if (variations.length < 2) {
      throw new Error(`Only generated ${variations.length} valid variations (minimum 2 required)`);
    }

    // Heartbeat before database operation
    context.heartbeat('Saving to database');

    // Stocker dans Supabase pour historique (CRITICAL: check for errors)
    try {
      await supabase.createContentGeneration({
        content_type: input.contentType,
        variations: variations.map(v => ({
          text: v.text,
          style: v.style,
          score: v.score,
          hashtags: v.hashtags,
        })),
        template_id: input.templateId,
      });
    } catch (dbError) {
      console.error('[Activity:GenerateContent] Database insert failed:', dbError);
      throw new Error(`Failed to save content to database: ${dbError instanceof Error ? dbError.message : 'unknown error'}`);
    }

    return {
      success: true,
      variations,
    };

  } catch (error) {
    console.error('[Activity:GenerateContent] Error:', error);

    // Send to Sentry with context
    if (error instanceof Error) {
      captureError(error, {
        activity: 'generateContentVariations',
        contentType: input.contentType,
        templateId: input.templateId,
        hasOverridePrompt: !!input.overridePrompt,
      });
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ================================
// Helper Functions
// ================================

/**
 * Récupère le prompt optimisé (ML ou template)
 */
async function getOptimizedPrompt(
  contentType: string,
  templateId?: string
): Promise<string> {
  // Si templateId spécifié, utiliser ce template
  if (templateId) {
    const { data } = await supabase.getClient()
      .from('content_templates')
      .select('template_text')
      .eq('id', templateId)
      .single();

    if (data) return data.template_text;
  }

  // Sinon, récupérer le prompt optimisé par ML (meilleur performant)
  const { data: optimized } = await supabase.getClient()
    .from('ai_prompts')
    .select('prompt_text')
    .eq('prompt_type', `claude_${contentType}`)
    .eq('active', true)
    .order('performance_score', { ascending: false })
    .limit(1)
    .single();

  if (optimized) return optimized.prompt_text;

  // Fallback: prompt par défaut
  return CONTENT_PROMPTS[contentType] || CONTENT_PROMPTS.default;
}

/**
 * Construit le prompt complet avec style
 */
function buildPrompt(
  basePrompt: string,
  style: 'professional' | 'storytelling' | 'question',
  contentType: string
): string {
  const styleInstructions = {
    professional: `
Style: Professionnel et basé sur données
- Commencer par une statistique ou fait concret
- Inclure des chiffres/pourcentages
- Ton expert mais accessible
- CTA: proposition de valeur claire
`,
    storytelling: `
Style: Storytelling client
- Commencer par une mini-histoire (2-3 phrases)
- Utiliser un exemple concret d'entreprise québécoise
- Ton humain et authentique
- CTA: invitation à partager leur histoire
`,
    question: `
Style: Question engageante
- Commencer par une question percutante
- Créer de la réflexion
- Pas de réponse directe (engagement)
- CTA: encourager commentaires/discussion
`,
  };

  return `${basePrompt}

${styleInstructions[style]}

Contexte AutoScale AI:
- Réceptionniste IA téléphonique 24/7
- Cible: PME québécoises
- Focus: Ne jamais manquer un appel, qualifier leads
- Secteur: Services (émondage, plomberie, etc.)
- Avantage clé: Disponibilité + qualification automatique

IMPORTANT:
- 120-180 caractères (optimal Facebook)
- Français canadien naturel (pas France)
- ZÉRO clichés IA ("paysage changeant", "révolutionnaire", etc.)
- Maximum 2 emojis (stratégiques)
- 3-5 hashtags (#IAQuébec #PMEQuébec #Automation...)

Génère UNIQUEMENT le texte du post (pas de titre ni meta-texte).
`;
}

/**
 * Validation anti-clichés IA
 */
function validateContent(text: string): { valid: boolean; reason?: string } {
  const aiCliches = [
    /paysage.*changeant/i,
    /révolutionnaire/i,
    /game[ -]changer/i,
    /disruptif/i,
    /dans le monde d'aujourd'hui/i,
    /à l'ère (du|de la)/i,
    /il est important de noter/i,
    /en conclusion/i,
  ];

  for (const cliche of aiCliches) {
    if (cliche.test(text)) {
      return {
        valid: false,
        reason: `Contains AI cliche: ${cliche.source}`,
      };
    }
  }

  // Vérifier longueur
  if (text.length < 50) {
    return { valid: false, reason: 'Text too short (< 50 chars)' };
  }

  if (text.length > 500) {
    return { valid: false, reason: 'Text too long (> 500 chars)' };
  }

  // Vérifier trop d'emojis
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 3) {
    return { valid: false, reason: `Too many emojis (${emojiCount} > 3)` };
  }

  return { valid: true };
}

/**
 * Extrait et optimise les hashtags
 */
function extractHashtags(text: string, contentType: string): string[] {
  const baseHashtags = ['#IAQuébec', '#PMEQuébec', '#AutomationTéléphonique'];

  const contentHashtags: Record<string, string[]> = {
    case_study: ['#ÉtudeDeCas', '#ROI', '#Témoignage'],
    statistic: ['#Statistiques', '#Données', '#Insights'],
    tip: ['#Conseil', '#BonnesPratiques', '#Astuce'],
    news: ['#Actualité', '#Innovation', '#TechQuébec'],
    testimonial: ['#Témoignage', '#ClientSatisfait', '#Succès'],
  };

  // Combiner base + spécifiques
  const allHashtags = [
    ...baseHashtags,
    ...(contentHashtags[contentType] || []),
  ];

  // Limiter à 5 hashtags max
  return allHashtags.slice(0, 5);
}

// ================================
// System Prompt (Qualité Maximale)
// ================================

const SYSTEM_PROMPT_FACEBOOK = `Tu es un expert copywriter B2B spécialisé en IA et automation pour PME québécoises.

MISSION: Créer du contenu Facebook engageant, authentique et professionnel pour AutoScale AI.

RÈGLES ABSOLUES:
1. Français canadien NATUREL (pas France) - utilise "vous" formel
2. ZÉRO clichés IA ou marketing générique
3. Concret, spécifique, avec exemples réels
4. Ton professionnel mais accessible (pas corporate froid)
5. Focus bénéfices clients (pas features techniques)

INTERDICTIONS:
❌ "révolutionnaire", "game-changer", "disruptif"
❌ "dans le monde d'aujourd'hui", "à l'ère du numérique"
❌ Superlatifs exagérés ("le meilleur", "numéro 1")
❌ Jargon technique complexe
❌ Promesses irréalistes

CE QUI FONCTIONNE:
✅ Statistiques concrètes ("72% des PME ratent 30% de leurs appels")
✅ Exemples réels sectoriels (plombier, émondeur, électricien)
✅ Questions qui font réfléchir
✅ Problèmes spécifiques + solution claire
✅ Ton humain authentique

STRUCTURE OPTIMALE:
[Hook percutant - 1 phrase]
[Problème/Bénéfice - 2-3 phrases]
[CTA doux - 1 phrase]
[Hashtags - 3-5 stratégiques]

Longueur: 120-180 caractères = sweet spot engagement Facebook B2B.

GO!`;
