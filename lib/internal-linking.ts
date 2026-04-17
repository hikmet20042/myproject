/**
 * Internal Linking Suggestions Utility
 * Automatically suggests relevant internal links based on content keywords
 * Improves SEO by distributing page authority across the site
 */

import { azerbaijanKeywords } from './seo'

interface InternalLink {
  text: string
  url: string
  relevance: number
}

interface ContentPage {
  url: string
  title: string
  keywords: string[]
  category: string
}

/**
 * Pre-defined internal pages for linking
 */
const internalPages: ContentPage[] = [
  // Homepage
  {
    url: '/',
    title: 'icma360 - Azərbaycanda Gənclər üçün #1 İmkan Platforması',
    keywords: ['iş', 'təcrübə', 'təlim', 'könüllülük', 'QHT', 'gənclər', 'imkanlar', 'Azərbaycan'],
    category: 'home',
  },
  
  // Resources
  {
    url: '/resources',
    title: 'Bütün İmkanlar',
    keywords: ['iş elanları', 'təcrübə', 'tədbirlər', 'vakansiya', 'imkanlar'],
    category: 'resources',
  },
  {
    url: '/resources?type=vacancy',
    title: 'İş Elanları',
    keywords: ['iş', 'vakansiya', 'iş elanları', 'karyera', 'məşğulluq'],
    category: 'vacancies',
  },
  {
    url: '/resources?type=internship',
    title: 'Təcrübə Proqramları',
    keywords: ['təcrübə', 'staj', 'təcrübə proqramı', 'praktika'],
    category: 'internships',
  },
  {
    url: '/resources?type=training',
    title: 'Təlim Proqramları',
    keywords: ['təlim', 'kurs', 'treninq', 'seminar', 'vorkşop'],
    category: 'training',
  },
  {
    url: '/resources?type=event',
    title: 'Tədbirlər',
    keywords: ['tədbir', 'konfrans', 'forum', 'networking', 'seminar'],
    category: 'events',
  },
  {
    url: '/resources?type=volunteer',
    title: 'Könüllülük İmkanları',
    keywords: ['könüllülük', 'könüllü', 'sosial fəaliyyət'],
    category: 'volunteer',
  },
  
  // Blogs
  {
    url: '/blogs',
    title: 'İcma Hekayələri',
    keywords: ['blog', 'hekayə', 'uğur hekayəsi', 'təcrübə', 'məsləhət'],
    category: 'blogs',
  },
  
  // Organizations
  {
    url: '/resources/organizations',
    title: 'Təşkilatlar Kataloqu',
    keywords: ['təşkilat', 'ictimai təşkilat', 'QHT', 'tərəfdaşlar'],
    category: 'organizations',
  },
  
  // About
  {
    url: '/about',
    title: 'Haqqımızda',
    keywords: ['icma360', 'haqqımızda', 'missiya', 'platforma'],
    category: 'about',
  },
  
  // City-specific
  {
    url: '/resources?location=Bakı',
    title: 'Bakıda İş və İmkanlar',
    keywords: ['Bakı', 'Bakıda iş', 'Bakıda təcrübə', 'Bakı imkanları'],
    category: 'location',
  },
  {
    url: '/resources?location=Sumqayıt',
    title: 'Sumqayıtda İmkanlar',
    keywords: ['Sumqayıt', 'Sumqayıtda iş'],
    category: 'location',
  },
  {
    url: '/resources?location=Gəncə',
    title: 'Gəncədə İmkanlar',
    keywords: ['Gəncə', 'Gəncədə iş'],
    category: 'location',
  },
]

/**
 * Extract keywords from content text
 */
export function extractKeywords(content: string): string[] {
  const text = content.toLowerCase()
  const foundKeywords: string[] = []
  
  // Check which Azerbaijan keywords are in the content
  azerbaijanKeywords.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword)
    }
  })
  
  return foundKeywords
}

/**
 * Calculate relevance score between content keywords and page keywords
 */
function calculateRelevance(contentKeywords: string[], pageKeywords: string[]): number {
  let score = 0
  
  contentKeywords.forEach(contentKw => {
    pageKeywords.forEach(pageKw => {
      if (contentKw.toLowerCase().includes(pageKw.toLowerCase()) || 
          pageKw.toLowerCase().includes(contentKw.toLowerCase())) {
        score++
      }
    })
  })
  
  return score
}

/**
 * Suggest internal links based on content
 * @param content - The text content to analyze
 * @param currentUrl - Current page URL to exclude from suggestions
 * @param maxLinks - Maximum number of links to suggest (default: 5)
 * @returns Array of suggested internal links sorted by relevance
 */
export function suggestInternalLinks(
  content: string,
  currentUrl: string,
  maxLinks: number = 5
): InternalLink[] {
  // Extract keywords from content
  const contentKeywords = extractKeywords(content)
  
  if (contentKeywords.length === 0) {
    return []
  }
  
  // Calculate relevance scores for each internal page
  const scoredPages = internalPages
    .filter(page => page.url !== currentUrl) // Don't suggest current page
    .map(page => ({
      ...page,
      relevance: calculateRelevance(contentKeywords, page.keywords),
    }))
    .filter(page => page.relevance > 0) // Only include pages with some relevance
    .sort((a, b) => b.relevance - a.relevance) // Sort by relevance (highest first)
    .slice(0, maxLinks) // Limit to maxLinks
  
  // Convert to InternalLink format
  return scoredPages.map(page => ({
    text: page.title,
    url: page.url,
    relevance: page.relevance,
  }))
}

/**
 * Find anchor text suggestions for a specific URL
 * @param targetUrl - The URL to link to
 * @param content - Content where the link should be placed
 * @returns Suggested anchor text phrases found in content
 */
export function suggestAnchorText(targetUrl: string, content: string): string[] {
  const page = internalPages.find(p => p.url === targetUrl)
  if (!page) return []
  
  const suggestions: string[] = []
  const lowerContent = content.toLowerCase()
  
  // Find which keywords from the page appear in the content
  page.keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase()
    if (lowerContent.includes(keywordLower)) {
      // Find the actual text (with original case) in content
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const matches = content.match(regex)
      if (matches) {
        suggestions.push(...matches)
      }
    }
  })
  
  // Remove duplicates
  return Array.from(new Set(suggestions))
}

/**
 * Get related content suggestions for sidebar/footer
 * Useful for "Related Articles" or "You Might Be Interested In"
 */
export function getRelatedContent(
  category: string,
  currentUrl: string,
  limit: number = 3
): InternalLink[] {
  return internalPages
    .filter(page => page.category === category && page.url !== currentUrl)
    .slice(0, limit)
    .map(page => ({
      text: page.title,
      url: page.url,
      relevance: 1, // Same category = relevant
    }))
}

/**
 * Add custom internal page for dynamic content (e.g., specific blog posts, vacancies)
 * Call this when creating/updating content to make it available for internal linking
 */
export function registerInternalPage(page: ContentPage): void {
  // Check if page already exists
  const existingIndex = internalPages.findIndex(p => p.url === page.url)
  
  if (existingIndex >= 0) {
    // Update existing page
    internalPages[existingIndex] = page
  } else {
    // Add new page
    internalPages.push(page)
  }
}

/**
 * Generate internal link HTML
 */
export function generateInternalLinkHTML(link: InternalLink): string {
  return `<a href="${link.url}" class="text-blue-600 hover:text-blue-800 underline" rel="noopener">${link.text}</a>`
}

/**
 * Analyze content and return SEO recommendations including internal linking
 */
export interface SEOAnalysis {
  keywordDensity: { keyword: string; count: number; density: number }[]
  suggestedInternalLinks: InternalLink[]
  wordCount: number
  readingTime: number
  hasHeadings: boolean
  imageCount: number
  recommendations: string[]
}

export function analyzeSEO(content: string, currentUrl: string): SEOAnalysis {
  const words = content.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length
  const readingTime = Math.ceil(wordCount / 200) // Average reading speed 200 words/min
  
  // Extract keywords and calculate density
  const contentKeywords = extractKeywords(content)
  const keywordCounts = contentKeywords.reduce((acc, keyword) => {
    acc[keyword] = (acc[keyword] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const keywordDensity = Object.entries(keywordCounts)
    .map(([keyword, count]) => ({
      keyword,
      count,
      density: (count / wordCount) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  // Suggest internal links
  const suggestedInternalLinks = suggestInternalLinks(content, currentUrl, 5)
  
  // Check for headings
  const hasHeadings = /<h[1-6]/.test(content)
  
  // Count images
  const imageCount = (content.match(/<img/g) || []).length
  
  // Generate recommendations
  const recommendations: string[] = []
  
  if (wordCount < 300) {
    recommendations.push('Content is too short. Aim for at least 800 words for better SEO.')
  }
  
  if (!hasHeadings) {
    recommendations.push('Add headings (H2, H3) to structure your content.')
  }
  
  if (imageCount === 0) {
    recommendations.push('Add images with descriptive alt text to improve engagement.')
  }
  
  if (suggestedInternalLinks.length === 0) {
    recommendations.push('No relevant internal links found. Consider adding more context about your services.')
  } else if (suggestedInternalLinks.length < 3) {
    recommendations.push(`Add more internal links. ${suggestedInternalLinks.length} suggested.`)
  }
  
  const overusedKeywords = keywordDensity.filter(kw => kw.density > 3)
  if (overusedKeywords.length > 0) {
    recommendations.push(`Keyword stuffing detected: "${overusedKeywords[0].keyword}" appears too frequently.`)
  }
  
  if (keywordDensity.length === 0) {
    recommendations.push('No target keywords detected. Add relevant Azerbaijani keywords.')
  }
  
  return {
    keywordDensity,
    suggestedInternalLinks,
    wordCount,
    readingTime,
    hasHeadings,
    imageCount,
    recommendations,
  }
}
