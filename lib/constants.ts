/**
 * Application-wide constants.
 * Import from here instead of duplicating env-var-or-default patterns.
 */

export const SITE_URL: string =
  process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org'
