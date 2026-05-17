/**
 * Canonical URL and Redirect Optimizer
 * Manages canonical tags, detects redirect chains, and optimizes URL structure
 */

export interface URLAnalysis {
  url: string
  isCanonical: boolean
  canonicalUrl?: string
  hasRedirect: boolean
  redirectChain?: string[]
  issues: string[]
  recommendations: string[]
  score: number
}

/**
 * URL normalization rules
 */
const NORMALIZATION_RULES = {
  // Remove trailing slashes (except root)
  trailingSlash: (url: string) => {
    if (url.endsWith('/') && url !== '/' && !url.match(/\/$/)) {
      return url.slice(0, -1)
    }
    return url
  },

  // Convert to lowercase (paths only, not query params)
  lowercase: (url: string) => {
    try {
      const urlObj = new URL(url)
      urlObj.pathname = urlObj.pathname.toLowerCase()
      return urlObj.toString()
    } catch {
      return url.toLowerCase()
    }
  },

  // Remove default ports
  removeDefaultPort: (url: string) => {
    return url.replace(/:80\//, '/').replace(/:443\//, '/')
  },

  // Sort query parameters alphabetically
  sortQueryParams: (url: string) => {
    try {
      const urlObj = new URL(url)
      const params = Array.from(urlObj.searchParams.entries())
      params.sort((a, b) => a[0].localeCompare(b[0]))
      urlObj.search = new URLSearchParams(params).toString()
      return urlObj.toString()
    } catch {
      return url
    }
  },

  // Remove tracking parameters
  removeTrackingParams: (url: string) => {
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref', '_ga']
    try {
      const urlObj = new URL(url)
      trackingParams.forEach(param => urlObj.searchParams.delete(param))
      return urlObj.toString()
    } catch {
      return url
    }
  },

  // Ensure HTTPS
  ensureHttps: (url: string) => {
    return url.replace(/^http:/, 'https:')
  },
}

/**
 * Generate canonical URL for a given URL
 */
export function generateCanonicalURL(url: string, options: {
  removeTrailingSlash?: boolean
  lowercase?: boolean
  removeTracking?: boolean
  sortParams?: boolean
  ensureHttps?: boolean
} = {}): string {
  let canonical = url

  // Apply normalization rules
  if (options.ensureHttps !== false) {
    canonical = NORMALIZATION_RULES.ensureHttps(canonical)
  }

  if (options.removeTracking !== false) {
    canonical = NORMALIZATION_RULES.removeTrackingParams(canonical)
  }

  if (options.lowercase !== false) {
    canonical = NORMALIZATION_RULES.lowercase(canonical)
  }

  if (options.removeTrailingSlash !== false) {
    canonical = NORMALIZATION_RULES.trailingSlash(canonical)
  }

  canonical = NORMALIZATION_RULES.removeDefaultPort(canonical)

  if (options.sortParams !== false) {
    canonical = NORMALIZATION_RULES.sortQueryParams(canonical)
  }

  return canonical
}

/**
 * Detect redirect chains (requires server-side implementation)
 */
export async function detectRedirectChain(url: string, maxDepth: number = 5): Promise<string[]> {
  const chain: string[] = [url]
  let currentUrl = url
  let depth = 0

  while (depth < maxDepth) {
    try {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
      })

      // Check for redirect status codes
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (location) {
          // Resolve relative URLs
          const nextUrl = new URL(location, currentUrl).toString()
          
          // Avoid infinite loops
          if (chain.includes(nextUrl)) {
            break
          }

          chain.push(nextUrl)
          currentUrl = nextUrl
          depth++
        } else {
          break
        }
      } else {
        // No more redirects
        break
      }
    } catch (error) {
      console.error('Error detecting redirect:', error)
      break
    }
  }

  return chain
}

/**
 * Analyze URL for SEO issues
 */
export function analyzeURL(url: string): URLAnalysis {
  const issues: string[] = []
  const recommendations: string[] = []
  let score = 100

  const canonical = generateCanonicalURL(url)
  const isCanonical = url === canonical

  // Check URL structure
  try {
    const urlObj = new URL(url)

    // Check protocol
    if (urlObj.protocol === 'http:') {
      issues.push('HTTP istifadə olunur - HTTPS-ə keçin')
      recommendations.push('HTTPS protokolunu aktivləşdirin')
      score -= 20
    }

    // Check URL length
    if (url.length > 100) {
      issues.push(`URL çox uzundur (${url.length} simvol)`)
      recommendations.push('URL-i 60-80 simvol aralığında saxlayın')
      score -= 10
    }

    // Check for special characters
    if (/[^a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]/.test(urlObj.pathname)) {
      issues.push('URL-də xüsusi simvollar var')
      recommendations.push('Yalnız alfanumerik simvollar və tire istifadə edin')
      score -= 5
    }

    // Check for underscores (use hyphens instead)
    if (urlObj.pathname.includes('_')) {
      issues.push('URL-də alt xətt (_) var')
      recommendations.push('Alt xətt əvəzinə tire (-) istifadə edin')
      score -= 5
    }

    // Check for uppercase letters
    if (urlObj.pathname !== urlObj.pathname.toLowerCase()) {
      issues.push('URL-də böyük hərflər var')
      recommendations.push('Bütün URL-ləri kiçik hərflərlə yazın')
      score -= 5
    }

    // Check trailing slash
    if (urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
      issues.push('URL sonunda əlavə slash var')
      recommendations.push('Son slash-ı silin və ya konsistent olun')
      score -= 3
    }

    // Check query parameters
    const params = Array.from(urlObj.searchParams.keys())
    if (params.length > 3) {
      issues.push(`Çox query parametr (${params.length})`)
      recommendations.push('Query parametrləri azaldın və ya SEO-friendly URL istifadə edin')
      score -= 5
    }

    // Check for tracking parameters
    const trackingParams = ['utm_source', 'fbclid', 'gclid']
    const hasTracking = trackingParams.some(param => urlObj.searchParams.has(param))
    if (hasTracking) {
      recommendations.push('Canonical URL-də tracking parametrləri silin')
      score -= 2
    }

    // Check for session IDs
    if (/sessionid|sid|jsessionid/i.test(url)) {
      issues.push('URL-də session ID var')
      recommendations.push('Session ID-ləri URL-dən çıxarın')
      score -= 15
    }

    // Check for numbered pages without context
    if (/\/\d+$/.test(urlObj.pathname)) {
      recommendations.push('Nömrəli səhifələrə kontekst əlavə edin (/page/1 və ya /blog/123-title)')
    }

    // Check for file extensions (should use clean URLs)
    if (/\.(html|php|asp|aspx)$/.test(urlObj.pathname)) {
      recommendations.push('Fayl uzantılarını silin - təmiz URL istifadə edin')
      score -= 5
    }

  } catch (error) {
    issues.push('Yanlış URL formatı')
    score = 0
  }

  // Positive signals
  if (score === 100) {
    recommendations.push('✅ URL struktur mükəmməldir!')
  }

  return {
    url,
    isCanonical,
    canonicalUrl: isCanonical ? undefined : canonical,
    hasRedirect: false, // Will be updated by detectRedirectChain
    issues,
    recommendations,
    score,
  }
}

/**
 * Generate SEO-friendly URL slug from text
 */
export function generateSlug(text: string, options: {
  maxLength?: number
  locale?: 'az' | 'en'
} = {}): string {
  const { maxLength = 60, locale = 'az' } = options

  // Azerbaijani character mappings
  const azCharMap: Record<string, string> = {
    'ə': 'e',
    'ı': 'i',
    'ö': 'o',
    'ü': 'u',
    'ğ': 'g',
    'ş': 's',
    'ç': 'c',
    'Ə': 'e',
    'I': 'i',
    'Ö': 'o',
    'Ü': 'u',
    'Ğ': 'g',
    'Ş': 's',
    'Ç': 'c',
  }

  let slug = text.toLowerCase()

  // Replace Azerbaijani characters if needed
  if (locale === 'az') {
    Object.entries(azCharMap).forEach(([from, to]) => {
      slug = slug.replace(new RegExp(from, 'g'), to)
    })
  }

  // Replace spaces and special characters with hyphens
  slug = slug
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')     // Remove leading/trailing hyphens

  // Truncate to max length at word boundary
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength)
    const lastHyphen = slug.lastIndexOf('-')
    if (lastHyphen > maxLength / 2) {
      slug = slug.substring(0, lastHyphen)
    }
  }

  return slug
}

/**
 * Get canonical URL for different content types
 */
export function getContentCanonicalURL(
  contentType: 'vacancy' | 'event' | 'blog' | 'organization' | 'material',
  id: string,
  slug?: string,
  locale: 'az' | 'en' = 'az'
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org'
  const routeKey = slug || id
  
  const paths: Record<string, string> = {
    vacancy: `/resources/vacancies/${routeKey}`,
    event: `/resources/events/${routeKey}`,
    blog: `/blogs/${routeKey}`,
    organization: `/o/${routeKey}`,
    material: `/resources/materials/${routeKey}`,
  }

  let path = paths[contentType] || `/${contentType}/${id}`

  return `${baseUrl}/${locale}${path}`
}

/**
 * Validate canonical tag implementation
 */
export function validateCanonicalTag(html: string, expectedUrl: string): {
  isValid: boolean
  foundUrl?: string
  issues: string[]
} {
  const issues: string[] = []
  
  // Extract canonical tag
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i)
  
  if (!canonicalMatch) {
    return {
      isValid: false,
      issues: ['Canonical tag tapılmadı'],
    }
  }

  // Extract href
  const hrefMatch = canonicalMatch[0].match(/href=["']([^"']+)["']/i)
  
  if (!hrefMatch) {
    return {
      isValid: false,
      issues: ['Canonical tag-da href atributu yoxdur'],
    }
  }

  const foundUrl = hrefMatch[1]

  // Normalize both URLs for comparison
  const normalizedExpected = generateCanonicalURL(expectedUrl)
  const normalizedFound = generateCanonicalURL(foundUrl)

  const isValid = normalizedExpected === normalizedFound

  if (!isValid) {
    issues.push(`Canonical URL uyğun gəlmir: gözlənilən ${normalizedExpected}, tapıldı ${normalizedFound}`)
  }

  // Check for multiple canonical tags
  const allCanonicals = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/gi)
  if (allCanonicals && allCanonicals.length > 1) {
    issues.push(`Çoxlu canonical tag tapıldı (${allCanonicals.length})`)
  }

  return {
    isValid,
    foundUrl,
    issues,
  }
}

/**
 * Generate redirect rules for common URL variations
 */
export function generateRedirectRules(canonicalUrl: string): Array<{
  from: string
  to: string
  type: '301' | '302'
  reason: string
}> {
  const rules: Array<{ from: string; to: string; type: '301' | '302'; reason: string }> = []

  try {
    const urlObj = new URL(canonicalUrl)

    // HTTP to HTTPS redirect
    if (urlObj.protocol === 'https:') {
      rules.push({
        from: canonicalUrl.replace('https:', 'http:'),
        to: canonicalUrl,
        type: '301',
        reason: 'HTTP to HTTPS təhlükəsizlik redirect',
      })
    }

    // Trailing slash variations
    if (!urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
      const withSlash = canonicalUrl + '/'
      rules.push({
        from: withSlash,
        to: canonicalUrl,
        type: '301',
        reason: 'Trailing slash normalize',
      })
    }

    // www variations (if site uses www or non-www)
    const hasWWW = urlObj.hostname.startsWith('www.')
    if (hasWWW) {
      const withoutWWW = canonicalUrl.replace('://www.', '://')
      rules.push({
        from: withoutWWW,
        to: canonicalUrl,
        type: '301',
        reason: 'www versiyasına redirect',
      })
    } else {
      const withWWW = canonicalUrl.replace('://', '://www.')
      rules.push({
        from: withWWW,
        to: canonicalUrl,
        type: '301',
        reason: 'www-siz versiyaya redirect',
      })
    }

  } catch (error) {
    console.error('Error generating redirect rules:', error)
  }

  return rules
}

/**
 * Batch analyze multiple URLs
 */
export function batchAnalyzeURLs(urls: string[]): URLAnalysis[] {
  return urls.map(url => analyzeURL(url))
}

/**
 * Generate sitemap-friendly URL list
 */
export function generateSitemapURLs(urls: Array<{
  url: string
  lastmod?: Date
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}>): string {
  const sitemapUrls = urls.map(({ url, lastmod, changefreq, priority }) => {
    const canonical = generateCanonicalURL(url)
    const lastmodStr = lastmod ? lastmod.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    
    return `  <url>
    <loc>${canonical}</loc>
    <lastmod>${lastmodStr}</lastmod>
    <changefreq>${changefreq || 'weekly'}</changefreq>
    <priority>${priority || 0.5}</priority>
  </url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls}
</urlset>`
}
