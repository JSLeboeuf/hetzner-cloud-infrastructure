/**
 * ML Optimizer Service (MVP Stub)
 * Calcule un score d'engagement prédit basé sur des heuristiques simples
 * TODO Phase 2: Implémenter XGBoost/LSTM models
 */

export interface ContentScoreInput {
  text: string;
  contentType: string;
  style: 'professional' | 'storytelling' | 'question';
  hashtags: string[];
}

/**
 * Calcule un score d'engagement prédit (0-100)
 * Version MVP: heuristiques simples
 * Version future: ML models (XGBoost, LSTM)
 */
export async function calculateEngagementScore(
  input: ContentScoreInput
): Promise<number> {
  let score = 50; // Base score

  // Longueur optimale (120-180 caractères)
  const textLength = input.text.length;
  if (textLength >= 120 && textLength <= 180) {
    score += 15;
  } else if (textLength >= 100 && textLength <= 200) {
    score += 10;
  } else if (textLength < 50 || textLength > 300) {
    score -= 15;
  }

  // Présence de question (engagement boost)
  if (input.text.includes('?')) {
    score += 10;
  }

  // Style scoring
  if (input.style === 'question') {
    score += 8; // Questions = plus d'engagement
  } else if (input.style === 'storytelling') {
    score += 5; // Storytelling = engagement moyen-haut
  }

  // Hashtags (3-5 optimal)
  const hashtagCount = input.hashtags.length;
  if (hashtagCount >= 3 && hashtagCount <= 5) {
    score += 5;
  } else if (hashtagCount > 5) {
    score -= 5; // Trop de hashtags = spam
  }

  // Emojis (1-3 optimal)
  const emojiCount = (input.text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount >= 1 && emojiCount <= 3) {
    score += 5;
  } else if (emojiCount > 5) {
    score -= 10;
  }

  // Chiffres/stats (engagement boost)
  if (/\d+%/.test(input.text) || /\d+\s*(personnes|clients|appels)/.test(input.text)) {
    score += 8;
  }

  // Cap entre 0-100
  return Math.max(0, Math.min(100, score));
}
