/**
 * Slug utilities for generating and normalizing URL-safe slugs.
 */

/**
 * Generate a URL-safe slug from a string.
 * - Lowercase
 * - Replace non-alphanumeric chars with hyphens
 * - Collapse consecutive hyphens
 * - Trim leading/trailing hyphens
 * - Append a random suffix to avoid collisions
 */
export function generateSlug(input: string, maxLength = 120): string {
  const base = input
    .toLowerCase()
    // Handle Azerbaijani-specific characters
    .replace(/[ə]/g, 'e')
    .replace(/[ı]/g, 'i')
    .replace(/[ö]/g, 'o')
    .replace(/[ü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ş]/g, 's')
    .replace(/[ğ]/g, 'g')
    // Replace non-alphanumeric with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Collapse consecutive hyphens
    .replace(/-+/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-|-$/g, '')
    .slice(0, maxLength)

  // Add short random suffix to avoid collisions
  const suffix = Math.random().toString(36).substring(2, 8)
  return `${base}-${suffix}`
}

/**
 * Normalize a slug (lowercase, trim, replace spaces).
 * Used for route parameter sanitization.
 */
export function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
