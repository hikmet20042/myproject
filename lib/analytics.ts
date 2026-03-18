/**
 * Google Analytics 4 Integration
 * Tracks page views and custom events for SEO monitoring
 */

// Google Analytics Measurement ID (set in .env)
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''

// Check if GA is enabled
export const isGAEnabled = (): boolean => {
  return !!GA_MEASUREMENT_ID && typeof window !== 'undefined'
}

/**
 * Track page view in Google Analytics
 * Call this on every page navigation
 */
export const pageview = (url: string) => {
  if (!isGAEnabled()) return
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  })
}

/**
 * Track custom events
 * @param action - Event action (e.g., 'click', 'submit', 'search')
 * @param category - Event category (e.g., 'vacancy', 'blog', 'event')
 * @param label - Event label (e.g., vacancy title, search term)
 * @param value - Optional numeric value
 */
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (!isGAEnabled()) return
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

/**
 * Track search queries for SEO insights
 */
export const trackSearch = (searchTerm: string, resultCount: number) => {
  event({
    action: 'search',
    category: 'engagement',
    label: searchTerm,
    value: resultCount,
  })
}

/**
 * Track vacancy views
 */
export const trackVacancyView = (vacancyTitle: string, organization: string) => {
  event({
    action: 'view_vacancy',
    category: 'vacancy',
    label: `${vacancyTitle} - ${organization}`,
  })
}

/**
 * Track application submissions
 */
export const trackApplication = (vacancyTitle: string) => {
  event({
    action: 'submit_application',
    category: 'conversion',
    label: vacancyTitle,
    value: 1,
  })
}

/**
 * Track blog post reads
 */
export const trackBlogRead = (blogTitle: string, readTime: number) => {
  event({
    action: 'read_blog',
    category: 'content',
    label: blogTitle,
    value: readTime, // time in seconds
  })
}

/**
 * Track event registrations
 */
export const trackEventRegistration = (eventTitle: string) => {
  event({
    action: 'register_event',
    category: 'conversion',
    label: eventTitle,
    value: 1,
  })
}

/**
 * Track organization profile views
 */
export const trackOrganizationView = (organizationName: string) => {
  event({
    action: 'view_organization',
    category: 'organization',
    label: organizationName,
  })
}

/**
 * Track user engagement time on page
 */
export const trackEngagementTime = (pageName: string, timeInSeconds: number) => {
  event({
    action: 'engagement_time',
    category: 'engagement',
    label: pageName,
    value: timeInSeconds,
  })
}

/**
 * Track 404 errors for SEO
 */
export const track404 = (url: string, referrer: string) => {
  event({
    action: '404_error',
    category: 'error',
    label: `${url} (from: ${referrer})`,
  })
}

/**
 * Track outbound link clicks
 */
export const trackOutboundLink = (url: string, linkText: string) => {
  event({
    action: 'outbound_link_click',
    category: 'engagement',
    label: `${linkText} -> ${url}`,
  })
}

/**
 * Track social shares for content virality
 */
export const trackSocialShare = (platform: string, contentUrl: string) => {
  event({
    action: 'social_share',
    category: 'engagement',
    label: `${platform}: ${contentUrl}`,
  })
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}
