/**
 * Input Validation Utilities
 * Prevents SQL injection, XSS, and other injection attacks
 */

/**
 * Validates workflow ID format
 * Expected format: facebook-{type}-{timestamp}
 */
export function validateWorkflowId(workflowId: string): boolean {
  if (!workflowId || typeof workflowId !== 'string') {
    return false;
  }

  // Check length
  if (workflowId.length < 10 || workflowId.length > 100) {
    return false;
  }

  // Expected pattern: facebook-{alphanumeric-with-underscores}-{numbers}
  const pattern = /^facebook-[a-z_]+-\d+$/;
  return pattern.test(workflowId);
}

/**
 * Validates content type
 */
export function validateContentType(
  contentType: string
): contentType is 'case_study' | 'statistic' | 'tip' | 'news' | 'testimonial' {
  const validTypes = ['case_study', 'statistic', 'tip', 'news', 'testimonial'];
  return validTypes.includes(contentType);
}

/**
 * Validates variation index
 */
export function validateVariationIndex(index: number, maxIndex: number = 2): boolean {
  return Number.isInteger(index) && index >= 0 && index <= maxIndex;
}

/**
 * Validates publish time
 * Must be in the future but not more than 30 days ahead
 */
export function validatePublishTime(publishTime: string | Date): Date {
  const date = typeof publishTime === 'string' ? new Date(publishTime) : publishTime;

  // Check if valid date
  if (isNaN(date.getTime())) {
    throw new Error('Invalid publishTime format');
  }

  const now = new Date();
  const maxFuture = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Must be in the future
  if (date < now) {
    throw new Error('publishTime cannot be in the past');
  }

  // Cannot be more than 30 days in the future
  if (date > maxFuture) {
    throw new Error('publishTime cannot be more than 30 days in the future');
  }

  return date;
}

/**
 * Validates limit parameter for pagination
 */
export function validateLimit(limit: string | number | undefined, maxLimit: number = 100): number {
  if (limit === undefined) {
    return 10; // default
  }

  const parsed = typeof limit === 'string' ? parseInt(limit, 10) : limit;

  if (isNaN(parsed) || parsed < 1) {
    return 10; // default
  }

  // Cap at maximum
  return Math.min(parsed, maxLimit);
}

/**
 * Validates offset parameter for pagination
 */
export function validateOffset(offset: string | number | undefined): number {
  if (offset === undefined) {
    return 0; // default
  }

  const parsed = typeof offset === 'string' ? parseInt(offset, 10) : offset;

  if (isNaN(parsed) || parsed < 0) {
    return 0; // default
  }

  return parsed;
}

/**
 * Sanitizes text input to prevent XSS
 * Removes HTML tags and dangerous characters
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, (char) => {
      // Escape dangerous characters
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
        '&': '&amp;',
      };
      return escapeMap[char] || char;
    })
    .trim();
}
