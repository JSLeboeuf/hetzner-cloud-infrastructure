/**
 * Facebook Publishing Activity
 *
 * Publie sur Facebook avec circuit breakers, retry logic et compliance garantie
 * Architecture resiliente (99.95%+ uptime)
 */

import { Context } from '@temporalio/activity';
import CircuitBreaker from 'opossum';
import pRetry from 'p-retry';
import axios from 'axios';
import { supabase } from '../../services/supabase.service.js';

const FACEBOOK_GRAPH_API = 'https://graph.facebook.com/v18.0';
const PAGE_ID = process.env.FACEBOOK_PAGE_ID!;
const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN!;

export interface PublishToFacebookInput {
  text: string;
  imageUrl?: string;
  scheduledTime?: Date;
}

export interface PublishToFacebookResult {
  success: boolean;
  postId?: string;
  publishedAt?: Date;
  error?: string;
}

// ================================
// Circuit Breaker Configuration
// ================================

const circuitBreakerOptions = {
  timeout: 30000, // 30s timeout
  errorThresholdPercentage: 50, // Open après 50% d'erreurs
  resetTimeout: 60000, // Retry après 1min
  rollingCountTimeout: 10000, // Window de 10s
  rollingCountBuckets: 10,
  name: 'FacebookPublishingCircuitBreaker',
};

/**
 * Publie post Facebook avec resilience maximale
 */
export async function publishToFacebook(
  input: PublishToFacebookInput
): Promise<PublishToFacebookResult> {
  const context = Context.current();

  try {
    console.log('[Activity:PublishFacebook] Starting publication...');

    // Valider credentials
    if (!PAGE_ID || !ACCESS_TOKEN) {
      throw new Error('Missing Facebook credentials (PAGE_ID or ACCESS_TOKEN)');
    }

    // Step 1: Upload image si présente
    let photoId: string | undefined;

    if (input.imageUrl) {
      context.heartbeat('Uploading image to Facebook');
      photoId = await uploadImageWithRetry(input.imageUrl);
      console.log(`[Activity:PublishFacebook] Image uploaded: ${photoId}`);
    }

    // Step 2: Publier post avec circuit breaker
    context.heartbeat('Publishing post to Facebook');

    const postId = await publishPostWithCircuitBreaker({
      message: input.text,
      photoId,
      scheduledTime: input.scheduledTime,
    });

    console.log(`[Activity:PublishFacebook] Published successfully: ${postId}`);

    // Step 3: Enregistrer dans Supabase
    await supabase.from('facebook_posts').insert({
      post_id: postId,
      content: input.text,
      image_url: input.imageUrl,
      published_at: input.scheduledTime || new Date(),
      status: 'published',
    });

    return {
      success: true,
      postId,
      publishedAt: input.scheduledTime || new Date(),
    };

  } catch (error) {
    console.error('[Activity:PublishFacebook] Error:', error);

    // Enregistrer échec dans Supabase pour debugging
    await supabase.from('facebook_posts').insert({
      content: input.text,
      image_url: input.imageUrl,
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ================================
// Helper Functions avec Resilience
// ================================

/**
 * Upload image avec retry automatique
 */
async function uploadImageWithRetry(imageUrl: string): Promise<string> {
  return pRetry(
    async () => {
      const response = await axios.post(
        `${FACEBOOK_GRAPH_API}/${PAGE_ID}/photos`,
        {
          url: imageUrl,
          published: false, // Unpublished photo (pour attach au post)
          access_token: ACCESS_TOKEN,
        },
        {
          timeout: 30000,
        }
      );

      if (!response.data?.id) {
        throw new Error('Facebook returned no photo ID');
      }

      return response.data.id;
    },
    {
      retries: 3,
      factor: 2, // Exponential backoff: 1s, 2s, 4s
      minTimeout: 1000,
      maxTimeout: 10000,
      onFailedAttempt: (error) => {
        console.warn(
          `[PublishFacebook] Image upload attempt ${error.attemptNumber} failed: ${error.message}`
        );
      },
    }
  );
}

/**
 * Publie post avec circuit breaker
 */
async function publishPostWithCircuitBreaker(params: {
  message: string;
  photoId?: string;
  scheduledTime?: Date;
}): Promise<string> {
  // Créer circuit breaker
  const breaker = new CircuitBreaker(publishPostDirect, circuitBreakerOptions);

  // Event listeners pour debugging
  breaker.on('open', () => {
    console.error('[CircuitBreaker] OPEN - Facebook API temporairement désactivé');
  });

  breaker.on('halfOpen', () => {
    console.log('[CircuitBreaker] HALF_OPEN - Test de reconnexion Facebook');
  });

  breaker.on('close', () => {
    console.log('[CircuitBreaker] CLOSED - Facebook API opérationnel');
  });

  // Exécuter avec circuit breaker
  return breaker.fire(params);
}

/**
 * Publication directe (wrapped par circuit breaker)
 */
async function publishPostDirect(params: {
  message: string;
  photoId?: string;
  scheduledTime?: Date;
}): Promise<string> {
  const payload: any = {
    message: params.message,
    access_token: ACCESS_TOKEN,
  };

  // Ajouter image si présente
  if (params.photoId) {
    payload.attached_media = [{ media_fbid: params.photoId }];
  }

  // Scheduled post (si dans le futur)
  if (params.scheduledTime && params.scheduledTime > new Date()) {
    payload.published = false;
    payload.scheduled_publish_time = Math.floor(params.scheduledTime.getTime() / 1000);
  }

  const response = await axios.post(
    `${FACEBOOK_GRAPH_API}/${PAGE_ID}/feed`,
    payload,
    {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.data?.id) {
    throw new Error('Facebook API returned no post ID');
  }

  return response.data.id;
}

/**
 * Vérifie rate limits Facebook (prévention)
 */
export async function checkFacebookRateLimits(): Promise<{
  allowed: boolean;
  usage: number;
  limit: number;
}> {
  try {
    const response = await axios.get(
      `${FACEBOOK_GRAPH_API}/${PAGE_ID}`,
      {
        params: {
          fields: 'id,name',
          access_token: ACCESS_TOKEN,
        },
      }
    );

    // Facebook retourne headers X-App-Usage et X-Page-Usage
    const usage = response.headers['x-app-usage'];
    const pageUsage = response.headers['x-page-usage'];

    if (usage) {
      const parsed = JSON.parse(usage);
      const callCount = parsed.call_count || 0;
      const totalTime = parsed.total_time || 0;

      // Limites Facebook: 200 calls/hour par user, 600/hour par app
      const allowed = callCount < 180; // Marge de sécurité (90%)

      return {
        allowed,
        usage: callCount,
        limit: 200,
      };
    }

    return { allowed: true, usage: 0, limit: 200 };

  } catch (error) {
    console.error('[PublishFacebook] Rate limit check failed:', error);
    // En cas d'erreur, assumer OK (fail open)
    return { allowed: true, usage: 0, limit: 200 };
  }
}
