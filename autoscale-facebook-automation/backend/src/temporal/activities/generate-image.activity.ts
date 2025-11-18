/**
 * Image Generation Activity
 *
 * Génère images optimisées Facebook avec DALL-E 3
 * Qualité HD, brand colors AutoScale AI
 */

import OpenAI from 'openai';
import { Context } from '@temporalio/activity';
import { supabase } from '../../services/supabase.service.js';
import axios from 'axios';
import { captureError, addBreadcrumb } from '../../config/sentry.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GenerateImageInput {
  contentText: string;
  contentType: 'case_study' | 'statistic' | 'tip' | 'news' | 'testimonial';
  style: 'professional-quebec-corporate' | 'modern-tech' | 'friendly-approachable';
}

export interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  supabasePath?: string;
  error?: string;
}

/**
 * Génère image Facebook optimisée avec DALL-E 3
 */
export async function generateImage(
  input: GenerateImageInput
): Promise<GenerateImageResult> {
  const context = Context.current();

  try {
    console.log('[Activity:GenerateImage] Starting DALL-E 3 generation...');
    context.heartbeat('Generating image with DALL-E 3');

    // Construire prompt DALL-E optimisé
    const imagePrompt = buildImagePrompt(input);

    // Générer image avec DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1792x1024', // Format landscape optimal Facebook (ratio 1.91:1)
      quality: 'hd', // Qualité maximale
      style: 'natural', // Pas vivid (trop saturé pour B2B)
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('DALL-E 3 returned no data');
    }

    const generatedUrl = response.data[0]?.url;
    if (!generatedUrl) {
      throw new Error('DALL-E 3 returned no image URL');
    }

    console.log('[Activity:GenerateImage] Image generated, downloading...');
    context.heartbeat('Downloading generated image');

    // Télécharger l'image
    const imageBuffer = await downloadImage(generatedUrl);

    // Upload vers Supabase Storage
    console.log('[Activity:GenerateImage] Uploading to Supabase Storage...');
    context.heartbeat('Uploading to Supabase');

    const fileName = `facebook/${Date.now()}_${input.contentType}.png`;

    // Upload vers Supabase Storage
    const uploadResult = await supabase.uploadImageToStorage(
      imageBuffer,
      fileName,
      'image/png'
    );

    // Validate upload succeeded and returned valid data
    if (!uploadResult.path || !uploadResult.publicUrl) {
      throw new Error('Supabase storage upload returned invalid result (missing path or publicUrl)');
    }

    const { path: supabasePath, publicUrl } = uploadResult;

    // Additional validation: ensure URL is properly formed
    if (!publicUrl.startsWith('http')) {
      throw new Error(`Invalid public URL returned from storage: ${publicUrl}`);
    }

    console.log(`[Activity:GenerateImage] Success! URL: ${publicUrl}`);

    return {
      success: true,
      imageUrl: publicUrl,
      supabasePath,
    };

  } catch (error) {
    console.error('[Activity:GenerateImage] Error:', error);

    // Send to Sentry with context
    if (error instanceof Error) {
      captureError(error, {
        activity: 'generateImage',
        contentType: input.contentType,
        style: input.style,
        hasImageUrl: !!input.contentText,
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
 * Construit prompt DALL-E 3 optimisé
 */
function buildImagePrompt(input: GenerateImageInput): string {
  const {  contentText, contentType, style } = input;

  // Extraire concept clé du texte (premier line ou stat)
  const keyPhrase = extractKeyPhrase(contentText);

  // Brand colors AutoScale AI
  const brandColors = {
    primary: '#2563EB', // Bleu professionnel
    secondary: '#64748B', // Gris moderne
    accent: '#3B82F6', // Bleu clair
    background: '#F8FAFC', // Blanc cassé
  };

  // Templates par type de contenu
  const templates: Record<string, string> = {
    case_study: `
Professional corporate image for LinkedIn/Facebook post.
Clean, modern design with soft gradient background (${brandColors.background} to white).
Central element: Icon of a telephone with AI circuit patterns in ${brandColors.primary} blue.
Overlay text in large, bold sans-serif font: "${keyPhrase}"
Small AutoScale AI logo in bottom right corner.
Style: Minimalist, trustworthy, Quebec corporate aesthetic.
No people, no clipart, photorealistic 3D elements.
    `,
    statistic: `
Data visualization style image for social media.
Background: Clean white with subtle ${brandColors.primary} blue accent lines.
Central graphic: Large bold number or percentage related to "${keyPhrase}"
Supporting icon: Phone or AI symbol in modern flat design.
Text overlay: Key statistic in ${brandColors.primary} blue.
Style: Infographic-inspired, professional, modern Quebec business.
    `,
    tip: `
Modern tip/advice image for Facebook.
Background: Soft gradient ${brandColors.background} to ${brandColors.accent}.
Icon: Light bulb or checklist in ${brandColors.primary} blue.
Text overlay: "${keyPhrase}" in clean sans-serif font.
Subtle geometric patterns for visual interest.
Style: Helpful, approachable, professional Quebec SMB.
    `,
    news: `
Breaking news style image for social media.
Background: Modern geometric shapes in ${brandColors.primary} and ${brandColors.secondary}.
Central element: AI/technology icon with notification badge.
Text: "${keyPhrase}" in bold, modern font.
Style: Contemporary, tech-forward, professional Quebec.
    `,
    testimonial: `
Client testimonial style image.
Background: Clean ${brandColors.background} with subtle texture.
Central element: Quote marks icon in ${brandColors.primary}.
Text: Key phrase from "${keyPhrase}" in elegant serif font.
Small business iconography (briefcase, handshake).
Style: Trustworthy, authentic, Quebec professional.
    `,
  };

  const basePrompt = templates[contentType] || templates.statistic;

  return `${basePrompt}

CRITICAL REQUIREMENTS:
- Landscape format (1.91:1 ratio)
- High contrast for mobile viewing
- No French/English text errors (keep text minimal)
- Quebec-appropriate professional aesthetic (not too flashy)
- Readable at small sizes (Facebook feed)
- Brand colors: ${brandColors.primary} (primary), ${brandColors.secondary} (secondary)
- Clean, modern, corporate but approachable
- No stock photo people

OUTPUT: Photorealistic, high-quality marketing image optimized for Facebook B2B audience.`;
}

/**
 * Extrait phrase clé du contenu (pour intégrer dans image)
 */
function extractKeyPhrase(text: string): string {
  // Extraire première phrase ou stat
  const firstSentence = text.split(/[.!?]/)[0];

  // Si contient chiffres/%, c'est probablement une stat
  if (/\d+%?/.test(firstSentence)) {
    return firstSentence.trim();
  }

  // Sinon, prendre 5-7 premiers mots
  const words = firstSentence.split(' ').slice(0, 7).join(' ');
  return words.length > 50 ? words.slice(0, 50) + '...' : words;
}

/**
 * Télécharge image depuis URL DALL-E avec validation
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000, // 30s timeout
    validateStatus: (status) => status === 200, // Only 200 is success
  });

  // Validate response has data
  if (!response.data || response.data.byteLength === 0) {
    throw new Error('Downloaded image is empty');
  }

  const buffer = Buffer.from(response.data);

  // Validate minimum size
  if (buffer.length < 100) {
    throw new Error(`Downloaded file too small to be valid image (${buffer.length} bytes)`);
  }

  // Check PNG magic bytes (89 50 4E 47) or JPEG magic bytes (FF D8 FF)
  const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

  if (!isPNG && !isJPEG) {
    throw new Error('Downloaded file is not a valid PNG or JPEG image (invalid magic bytes)');
  }

  console.log(`[DownloadImage] Successfully downloaded ${isPNG ? 'PNG' : 'JPEG'} image (${(buffer.length / 1024).toFixed(1)} KB)`);

  return buffer;
}
