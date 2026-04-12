/**
 * Image SEO Optimization Utility
 * Generates optimized alt text, titles, and metadata for images
 * Improves image search rankings and accessibility
 */

import { azerbaijanKeywords } from './seo'

export interface ImageMetadata {
  alt: string
  title: string
  description?: string
  width?: number
  height?: number
  format?: string
  keywords?: string[]
}

export interface ImageSEOSuggestions {
  alt: string
  title: string
  description: string
  keywords: string[]
  filenameOptimized: string
  recommendations: string[]
}

/**
 * Generate SEO-optimized alt text for images
 * @param context - Context where the image appears (page title, content, etc.)
 * @param imageType - Type of image (logo, profile, event, vacancy, etc.)
 * @param customText - Custom text to include
 */
export function generateAltText(
  context: string,
  imageType: 'logo' | 'profile' | 'event' | 'vacancy' | 'blog' | 'organization' | 'general' = 'general',
  customText?: string
): string {
  const templates: Record<string, string> = {
    logo: `icma360 - ${context} loqosu`,
    profile: `${context} profil şəkli`,
    event: `${context} tədbiri`,
    vacancy: `${context} iş elanı`,
    blog: `${context} - icma360 bloq şəkli`,
    organization: `${context} - təşkilat profil şəkli`,
    general: customText || context,
  }

  let alt = templates[imageType] || templates.general

  // Add location context if present
  if (context.includes('Bakı')) {
    alt += ' | Bakı, Azərbaycan'
  } else if (context.includes('Azərbaycan')) {
    alt += ' | Azərbaycan'
  }

  // Ensure alt text is not too long (max 125 characters recommended)
  if (alt.length > 125) {
    alt = alt.substring(0, 122) + '...'
  }

  return alt
}

/**
 * Generate SEO-optimized image filename
 * @param originalName - Original filename
 * @param context - Context for the image
 */
export function optimizeImageFilename(originalName: string, context: string): string {
  // Remove extension
  const ext = originalName.split('.').pop()
  let name = originalName.replace(`.${ext}`, '')

  // Create SEO-friendly filename
  const contextSlug = context
    .toLowerCase()
    .replace(/[^a-z0-9ığüşöçəа-я]+/gi, '-')
    .replace(/^-+|-+$/g, '')

  // Combine context with timestamp to ensure uniqueness
  const timestamp = Date.now()
  const optimized = `${contextSlug}-${timestamp}.${ext}`

  return optimized.toLowerCase()
}

/**
 * Analyze image and provide SEO suggestions
 */
export function analyzeImageSEO(
  currentAlt: string,
  currentFilename: string,
  context: string,
  imageType: 'logo' | 'profile' | 'event' | 'vacancy' | 'blog' | 'organization' | 'general' = 'general'
): ImageSEOSuggestions {
  const recommendations: string[] = []

  // Check alt text
  if (!currentAlt || currentAlt.trim() === '') {
    recommendations.push('❌ Alt text boşdur - mütləq əlavə edin')
  } else if (currentAlt.length < 10) {
    recommendations.push('⚠️ Alt text çox qısadır - daha ətraflı olmalıdır')
  } else if (currentAlt.length > 125) {
    recommendations.push('⚠️ Alt text çox uzundur - 125 simvoldan az olmalıdır')
  } else if (currentAlt.toLowerCase().includes('image') || currentAlt.toLowerCase().includes('photo')) {
    recommendations.push('⚠️ Alt text-də "image" və ya "photo" istifadə etməyin')
  } else {
    recommendations.push('✅ Alt text uzunluğu yaxşıdır')
  }

  // Check filename
  if (currentFilename.match(/img|image|photo|pic|screenshot|untitled/i)) {
    recommendations.push('❌ Fayl adı SEO-ya uyğun deyil - dəyişdirin')
  } else if (currentFilename.includes(' ')) {
    recommendations.push('⚠️ Fayl adında boşluq var - tire (-) istifadə edin')
  } else if (currentFilename.match(/[A-Z]/)) {
    recommendations.push('⚠️ Fayl adında böyük hərflər var - kiçik hərflərdən istifadə edin')
  } else {
    recommendations.push('✅ Fayl adı SEO-ya uyğundur')
  }

  // Extract keywords from context
  const keywords: string[] = []
  azerbaijanKeywords.forEach(keyword => {
    if (context.toLowerCase().includes(keyword.toLowerCase())) {
      keywords.push(keyword)
    }
  })

  // Generate optimized suggestions
  const optimizedAlt = generateAltText(context, imageType)
  const optimizedFilename = optimizeImageFilename(currentFilename, context)
  const title = context.length > 60 ? context.substring(0, 57) + '...' : context
  const description = `${context} - icma360 platformasında`

  return {
    alt: optimizedAlt,
    title,
    description,
    keywords: keywords.slice(0, 5),
    filenameOptimized: optimizedFilename,
    recommendations,
  }
}

/**
 * Generate JSON-LD ImageObject schema
 */
export function generateImageSchema(image: {
  url: string
  alt: string
  width?: number
  height?: number
  caption?: string
  author?: string
}): string {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org'
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    url: image.url.startsWith('http') ? image.url : `${siteUrl}${image.url}`,
    name: image.alt,
    description: image.caption || image.alt,
    ...(image.width && { width: `${image.width}px` }),
    ...(image.height && { height: `${image.height}px` }),
    ...(image.author && {
      author: {
        '@type': 'Person',
        name: image.author,
      },
    }),
  }

  return JSON.stringify(schema)
}

/**
 * Get recommended image dimensions for different use cases
 */
export function getRecommendedDimensions(imageType: string): { width: number; height: number; aspectRatio: string } {
  const dimensions: Record<string, { width: number; height: number; aspectRatio: string }> = {
    'og-image': { width: 1200, height: 630, aspectRatio: '1.91:1' },
    'twitter-card': { width: 1200, height: 600, aspectRatio: '2:1' },
    'blog-featured': { width: 1200, height: 675, aspectRatio: '16:9' },
    'profile-picture': { width: 400, height: 400, aspectRatio: '1:1' },
    'logo': { width: 512, height: 512, aspectRatio: '1:1' },
    'event-banner': { width: 1920, height: 1080, aspectRatio: '16:9' },
    'thumbnail': { width: 320, height: 180, aspectRatio: '16:9' },
    'hero-image': { width: 1920, height: 1080, aspectRatio: '16:9' },
  }

  return dimensions[imageType] || dimensions['blog-featured']
}

/**
 * Check if image meets SEO requirements
 */
export function validateImageSEO(image: {
  url: string
  alt?: string
  width?: number
  height?: number
  fileSize?: number // in bytes
}): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // Check alt text
  if (!image.alt) {
    errors.push('Alt text yoxdur')
  } else if (image.alt.length < 5) {
    errors.push('Alt text çox qısadır (minimum 5 simvol)')
  } else if (image.alt.length > 125) {
    warnings.push('Alt text çox uzundur (maksimum 125 simvol tövsiyə olunur)')
  }

  // Check dimensions
  if (image.width && image.height) {
    if (image.width < 200 || image.height < 200) {
      warnings.push('Şəkil çox kiçikdir - minimum 200x200px olmalıdır')
    }
    if (image.width > 3840 || image.height > 2160) {
      warnings.push('Şəkil çox böyükdür - optimizasiya edin')
    }
  }

  // Check file size
  if (image.fileSize) {
    const sizeInKB = image.fileSize / 1024
    const sizeInMB = sizeInKB / 1024

    if (sizeInMB > 2) {
      errors.push(`Fayl ölçüsü çox böyükdür: ${sizeInMB.toFixed(2)}MB (maksimum 2MB)`)
    } else if (sizeInKB > 500) {
      warnings.push(`Fayl ölçüsü böyükdür: ${sizeInKB.toFixed(0)}KB - sıxışdırma tövsiyə olunur`)
    }
  }

  // Check file format from URL
  const format = image.url.split('.').pop()?.toLowerCase()
  if (format && !['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg'].includes(format)) {
    warnings.push(`Fayl formatı SEO üçün optimal deyil: ${format}. WebP və ya AVIF istifadə edin`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(baseUrl: string, sizes: number[] = [320, 640, 768, 1024, 1280, 1536]): string {
  return sizes
    .map(size => `${baseUrl}?w=${size} ${size}w`)
    .join(', ')
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(breakpoints?: Record<string, string>): string {
  const defaultBreakpoints = {
    '(max-width: 640px)': '100vw',
    '(max-width: 1024px)': '768px',
    default: '1024px',
  }

  const bp = breakpoints || defaultBreakpoints
  const entries = Object.entries(bp)
  
  return entries
    .filter(([key]) => key !== 'default')
    .map(([media, size]) => `${media} ${size}`)
    .concat(bp.default || '1024px')
    .join(', ')
}

/**
 * Bulk image SEO report
 */
export function generateImageSEOReport(images: Array<{
  url: string
  alt?: string
  width?: number
  height?: number
  fileSize?: number
}>): {
  totalImages: number
  imagesWithAlt: number
  imagesWithoutAlt: number
  oversizedImages: number
  optimizationPotential: string
  score: number
} {
  const totalImages = images.length
  const imagesWithAlt = images.filter(img => img.alt && img.alt.length > 0).length
  const imagesWithoutAlt = totalImages - imagesWithAlt
  const oversizedImages = images.filter(img => img.fileSize && img.fileSize > 2 * 1024 * 1024).length

  // Calculate SEO score (0-100)
  const altScore = (imagesWithAlt / totalImages) * 60 // 60% weight
  const sizeScore = ((totalImages - oversizedImages) / totalImages) * 40 // 40% weight
  const score = Math.round(altScore + sizeScore)

  let optimizationPotential = 'Əla'
  if (score < 50) optimizationPotential = 'Zəif - təcili optimallaşdırma lazımdır'
  else if (score < 70) optimizationPotential = 'Orta - yaxşılaşdırma mümkündür'
  else if (score < 90) optimizationPotential = 'Yaxşı - kiçik təkmilləşdirmələr'

  return {
    totalImages,
    imagesWithAlt,
    imagesWithoutAlt,
    oversizedImages,
    optimizationPotential,
    score,
  }
}
