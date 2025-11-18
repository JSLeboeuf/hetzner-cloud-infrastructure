/**
 * Facebook Content Generation Workflow
 *
 * Workflow Temporal orchestrant la génération complète et publication de contenu Facebook
 * avec qualité maximale et compliance garantie.
 *
 * Durée totale: 4-6 heures (non-bloquant)
 * Fiabilité: 99.95%+ (durable execution)
 */

import {
  proxyActivities,
  sleep,
  defineSignal,
  setHandler,
  condition,
} from '@temporalio/workflow';
import type * as activities from '../activities/index.js';

// Proxy activities avec timeouts configurés
const {
  generateContentVariations,
  generateImage,
  notifyApprovalReady,
  publishToFacebook,
  collectAnalytics,
  optimizePrompts,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
  retry: {
    initialInterval: '30 seconds',
    maximumInterval: '5 minutes',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

// Signals pour contrôle externe
export const approvalSignal = defineSignal<[ApprovalDecision]>('approval');
export const cancelSignal = defineSignal('cancel');

// Types
export interface WorkflowInput {
  contentType: 'case_study' | 'statistic' | 'tip' | 'news' | 'testimonial';
  scheduledPublishTime?: Date;
  templateId?: string;
  overridePrompt?: string;
}

export interface ApprovalDecision {
  approved: boolean;
  selectedVariation: number; // 0, 1, ou 2
  customEdits?: string; // Si l'utilisateur a édité le texte
  publishTime?: Date; // Override timing si besoin
}

export interface WorkflowResult {
  success: boolean;
  postId?: string;
  facebookPostId?: string;
  variation: number;
  publishedAt?: Date;
  imageUrl?: string;
  variations?: Array<{
    text: string;
    style: string;
    score: number;
  }>;
  metrics?: {
    generationTime: number;
    approvalTime: number;
    totalTime: number;
  };
  error?: string;
}

/**
 * Workflow principal de génération de contenu Facebook
 */
export async function facebookContentWorkflow(
  input: WorkflowInput
): Promise<WorkflowResult> {
  const startTime = Date.now();
  let approvalReceived = false;
  let approvalDecision: ApprovalDecision | null = null;
  let workflowCancelled = false;

  // Setup signal handlers with race condition protection
  setHandler(approvalSignal, (decision: ApprovalDecision) => {
    // Prevent duplicate approvals (race condition protection)
    if (approvalReceived) {
      console.warn('[Workflow] Approval already received, ignoring duplicate signal');
      return;
    }

    // Validate signal structure (defensive programming - runtime type safety)
    if (typeof decision !== 'object' || decision === null) {
      console.error('[Workflow] Invalid approval signal: not an object');
      return;
    }

    if (typeof decision.approved !== 'boolean') {
      console.error('[Workflow] Invalid approval signal: missing or invalid "approved" field');
      return;
    }

    if (decision.approved && decision.selectedVariation !== undefined) {
      if (typeof decision.selectedVariation !== 'number' ||
          decision.selectedVariation < 0 ||
          decision.selectedVariation > 2) {
        console.error('[Workflow] Invalid approval signal: invalid "selectedVariation" field');
        return;
      }
    }

    approvalReceived = true;
    approvalDecision = decision;
    console.log('[Workflow] Approval received:', {
      approved: decision.approved,
      variation: decision.selectedVariation
    });
  });

  setHandler(cancelSignal, () => {
    workflowCancelled = true;
  });

  try {
    // =====================================
    // ÉTAPE 1: Génération de contenu (Claude Sonnet 4.5)
    // =====================================
    console.log('[Workflow] Starting content generation...');

    const contentResult = await generateContentVariations({
      contentType: input.contentType,
      templateId: input.templateId,
      overridePrompt: input.overridePrompt,
    });

    if (!contentResult.success || !contentResult.variations) {
      throw new Error(`Content generation failed: ${contentResult.error}`);
    }

    console.log('[Workflow] Generated 3 content variations successfully');
    const generationEndTime = Date.now();

    // =====================================
    // ÉTAPE 2: Génération d'image (DALL-E 3)
    // =====================================
    console.log('[Workflow] Starting image generation...');

    const imageResult = await generateImage({
      contentText: contentResult.variations[0].text, // Use best variation
      contentType: input.contentType,
      style: 'professional-quebec-corporate',
    });

    if (!imageResult.success || !imageResult.imageUrl) {
      throw new Error(`Image generation failed: ${imageResult.error}`);
    }

    console.log('[Workflow] Image generated and uploaded successfully');

    // =====================================
    // ÉTAPE 3: Notification pour approbation
    // =====================================
    console.log('[Workflow] Sending approval notification...');

    await notifyApprovalReady({
      variations: contentResult.variations,
      imageUrl: imageResult.imageUrl,
      contentType: input.contentType,
      workflowId: '' // Will be filled by activity
    });

    // =====================================
    // ÉTAPE 4: Attente approbation humaine
    // (Temporal WAIT - peut durer heures/jours)
    // =====================================
    console.log('[Workflow] Waiting for human approval...');

    // Attendre approbation ou annulation (max 7 jours)
    const approved = await condition(
      () => approvalReceived || workflowCancelled,
      '7 days'
    );

    if (workflowCancelled) {
      console.log('[Workflow] Workflow cancelled by user');
      return {
        success: false,
        variation: -1,
        error: 'Workflow cancelled by user',
      };
    }

    if (!approved || !approvalDecision) {
      console.log('[Workflow] Approval timeout (7 days)');
      return {
        success: false,
        variation: -1,
        error: 'Approval timeout - no response within 7 days',
      };
    }

    // Type assertion: at this point, approvalDecision is definitely not null
    const decision: ApprovalDecision = approvalDecision;

    if (!decision.approved) {
      console.log('[Workflow] Content rejected by user');
      return {
        success: false,
        variation: decision.selectedVariation,
        error: 'Content rejected during approval',
      };
    }

    console.log(`[Workflow] Content approved! Variation ${decision.selectedVariation}`);
    const approvalEndTime = Date.now();

    // =====================================
    // ÉTAPE 5: Publication avec timing intelligent
    // =====================================

    // Validate that variations exist and are valid (defensive programming)
    if (!contentResult.variations || !Array.isArray(contentResult.variations) || contentResult.variations.length === 0) {
      throw new Error('No content variations available - content generation may have failed');
    }

    // Validate selectedVariation index
    if (
      typeof decision.selectedVariation !== 'number' ||
      decision.selectedVariation < 0 ||
      decision.selectedVariation >= contentResult.variations.length
    ) {
      throw new Error(
        `Invalid variation index: ${decision.selectedVariation} (must be 0-${contentResult.variations.length - 1})`
      );
    }

    const selectedVariation = contentResult.variations[decision.selectedVariation];

    // Additional safety check - ensure variation has required properties
    if (!selectedVariation || typeof selectedVariation.text !== 'string' || !selectedVariation.text) {
      throw new Error(`Selected variation ${decision.selectedVariation} is invalid or missing text`);
    }

    // Validate that customEdits is reasonable if provided
    if (decision.customEdits && decision.customEdits.length > 5000) {
      throw new Error('Custom edits too long (max 5000 characters)');
    }

    const finalText = decision.customEdits || selectedVariation.text;

    // Calculer timing optimal (si pas override)
    let publishTime = decision.publishTime || input.scheduledPublishTime;

    if (!publishTime) {
      // Générer timing randomisé dans fenêtre optimale (13h-16h ±30min)
      // IMPORTANT: Use America/Toronto timezone (EST/EDT)
      const now = new Date();

      // Get tomorrow at 14:00 in America/Toronto timezone
      // We use toLocaleString to convert to Toronto time, then create a new Date
      const torontoTime = new Date(
        now.toLocaleString('en-US', { timeZone: 'America/Toronto' })
      );

      // Set to next day at 14:00 Toronto time
      const tomorrow = new Date(torontoTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      // Add random offset ±30min
      const randomOffset = Math.floor(Math.random() * 60) - 30; // minutes
      tomorrow.setMinutes(randomOffset);

      // Convert back to UTC for internal storage
      publishTime = new Date(
        tomorrow.toLocaleString('en-US', { timeZone: 'UTC' })
      );

      console.log(`[Workflow] Scheduled publish time: ${publishTime.toISOString()} (${tomorrow.toLocaleString('en-US', { timeZone: 'America/Toronto' })} Toronto time)`);
    }

    // Attendre jusqu'au moment optimal
    const waitTime = publishTime.getTime() - Date.now();
    if (waitTime > 0) {
      console.log(`[Workflow] Waiting ${Math.round(waitTime / 60000)} minutes until publish time...`);
      await sleep(waitTime);
    }

    console.log('[Workflow] Publishing to Facebook...');

    const publishResult = await publishToFacebook({
      text: finalText,
      imageUrl: imageResult.imageUrl,
      scheduledTime: publishTime,
    });

    if (!publishResult.success || !publishResult.postId) {
      throw new Error(`Facebook publishing failed: ${publishResult.error}`);
    }

    console.log(`[Workflow] Published successfully! Post ID: ${publishResult.postId}`);

    // =====================================
    // ÉTAPE 6: Collecte analytics (24h après)
    // =====================================
    // Analytics collection is optional - don't fail the entire workflow if it fails
    try {
      console.log('[Workflow] Scheduling analytics collection in 24h...');
      await sleep('24 hours');

      const analyticsResult = await collectAnalytics({
        postId: publishResult.postId,
        publishedAt: publishTime,
        variationIndex: decision.selectedVariation,
        contentType: input.contentType,
      });

      // =====================================
      // ÉTAPE 7: ML Optimization (optionnel)
      // =====================================
      if (analyticsResult.success && analyticsResult.metrics) {
        console.log('[Workflow] Running ML optimization...');

        await optimizePrompts({
          contentType: input.contentType,
          variationIndex: decision.selectedVariation,
          metrics: analyticsResult.metrics,
          originalPrompt: selectedVariation.promptUsed,
        });
      } else {
        console.log('[Workflow] Skipping ML optimization - analytics collection failed or no metrics');
      }
    } catch (error) {
      // Log error but don't fail the workflow - analytics is optional
      console.error('[Workflow] Analytics collection failed:', error);
      console.log('[Workflow] Continuing workflow despite analytics failure');
    }

    // =====================================
    // Workflow terminé avec succès
    // =====================================
    const endTime = Date.now();

    return {
      success: true,
      postId: publishResult.postId,
      facebookPostId: publishResult.postId,
      variation: decision.selectedVariation,
      publishedAt: publishTime,
      imageUrl: imageResult.imageUrl,
      variations: contentResult.variations,
      metrics: {
        generationTime: generationEndTime - startTime,
        approvalTime: approvalEndTime - generationEndTime,
        totalTime: endTime - startTime,
      },
    };

  } catch (error) {
    console.error('[Workflow] Fatal error:', error);

    return {
      success: false,
      variation: -1,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
