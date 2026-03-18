import { azerbaijanKeywords } from './seo'

/**
 * Smart Meta Description Generator
 * Auto-generates compelling, keyword-rich meta descriptions in Azerbaijani
 */

export interface MetaDescriptionConfig {
  title: string
  content?: string
  type: 'vacancy' | 'event' | 'blog' | 'organization' | 'training' | 'general'
  keywords?: string[]
  location?: string
  organization?: string
  deadline?: string
  salary?: string | number
  customData?: Record<string, any>
}

/**
 * Character limits for meta descriptions
 */
const META_DESCRIPTION_LIMITS = {
  min: 120,
  ideal: 155,
  max: 160,
}

/**
 * Templates for different content types (in Azerbaijani)
 */
const TEMPLATES = {
  vacancy: [
    '{organization} tərəfindən {location} şəhərində {title} vakansiyası. {deadline_text}{salary_text} İndi müraciət edin!',
    '{location}da {title} iş elanı - {organization}. {salary_text}Son müraciət tarixi: {deadline}. Müraciət edin! 🇦🇿',
    '{title} işi {location} şəhərində. {organization} tərəfindən. {deadline_text}Azərbaycanda ən yaxşı iş imkanları icma360-da!',
  ],
  event: [
    '{title} - {location} şəhərində {date} tarixində. {organization} tərəfindən təşkil olunur. Qeydiyyatdan keçin!',
    '{location}da {title} tədbirinə dəvətlisiniz! {date} tarixində {organization} tərəfindən. Pulsuz iştirak edin! 🎯',
    '{title} tədbirinə qoşulun! {location}, {date}. {organization} təşkilatçılığı ilə. Gənclər üçün imkan!',
  ],
  blog: [
    '{title} - {excerpt} Azərbaycan gəncləri üçün karyera məsləhətləri və iş imkanları haqqında məqalə.',
    '{excerpt} Bakı və Azərbaycanda iş axtaranlar üçün faydalı məlumatlar. Daha çox oxuyun!',
    '{title}: {excerpt} icma360-da gənclərin peşəkar inkişafı üçün tövsiyələr və məsləhətlər.',
  ],
  organization: [
    '{organization} - {location} şəhərində fəaliyyət göstərən QHT. {description} Əməkdaşlıq imkanları və vakansiyalar.',
    '{organization} haqqında. {location}da {focus_areas} sahəsində fəaliyyət göstərən təşkilat. QHT kataloqu Azərbaycan.',
    '{location} şəhərindəki {organization} QHT-si. {description} Könüllü və iş imkanları mövcuddur.',
  ],
  training: [
    '{title} təlim proqramı - {location} şəhərində. {organization} tərəfindən. {deadline_text}Ödənişsiz sertifikat əldə edin!',
    '{location}da {title} təlimi. {duration} müddətində peşəkar bacarıqlar qazanın. {organization} təşkilatçılığı ilə.',
    '{title} - {location} şəhərində {organization} təlim proqramı. Gənclər üçün pulsuz təlim imkanı! 🎓',
  ],
  general: [
    '{description} Azərbaycan gəncləri üçün iş, təcrübə, təlim və könüllülük imkanları icma360-da.',
    '{description} Bakıda və Azərbaycanda ən yaxşı imkanları kəşf edin. Gənclər üçün pulsuz platforma.',
    '{description} icma360 - Azərbaycanda iş, təcrübə və təlim imkanlarını birləşdirən #1 platforma.',
  ],
}

/**
 * Generate meta description based on content type and data
 */
export function generateMetaDescription(config: MetaDescriptionConfig): string {
  const { title, content, type, keywords, location, organization, deadline, salary, customData } = config

  // Select template
  const templates = TEMPLATES[type] || TEMPLATES.general
  const template = templates[Math.floor(Math.random() * templates.length)]

  // Extract excerpt from content (first 50 words)
  const excerpt = content 
    ? content.replace(/<[^>]*>/g, '').substring(0, 150).trim() 
    : ''

  // Format deadline
  const deadlineText = deadline 
    ? `Son tarix: ${formatDate(deadline)}. ` 
    : ''

  // Format salary
  const salaryText = salary 
    ? `Maaş: ${salary} AZN. ` 
    : ''

  // Format date for events
  const date = customData?.eventDate 
    ? formatDate(customData.eventDate) 
    : ''

  // Format duration
  const duration = customData?.duration || ''

  // Format focus areas for organizations
  const focusAreas = customData?.focusAreas?.slice(0, 2).join(', ') || 'sosial'

  // Get description from custom data
  const description = customData?.description || excerpt || ''

  // Replace placeholders
  let metaDescription = template
    .replace('{title}', title)
    .replace('{location}', location || 'Bakı')
    .replace('{organization}', organization || 'icma360')
    .replace('{deadline}', deadline ? formatDate(deadline) : '')
    .replace('{deadline_text}', deadlineText)
    .replace('{salary_text}', salaryText)
    .replace('{excerpt}', excerpt)
    .replace('{date}', date)
    .replace('{duration}', duration)
    .replace('{focus_areas}', focusAreas)
    .replace('{description}', description)

  // Add keywords naturally if provided
  if (keywords && keywords.length > 0) {
    const keywordPhrase = keywords.slice(0, 2).join(', ')
    if (metaDescription.length + keywordPhrase.length + 10 < META_DESCRIPTION_LIMITS.max) {
      metaDescription += ` ${keywordPhrase}.`
    }
  }

  // Truncate to ideal length
  metaDescription = truncateToIdealLength(metaDescription)

  // Ensure minimum length by adding call-to-action
  if (metaDescription.length < META_DESCRIPTION_LIMITS.min) {
    metaDescription = addCallToAction(metaDescription, type)
  }

  return metaDescription
}

/**
 * Generate meta description from raw text content
 */
export function generateFromContent(
  content: string,
  type: MetaDescriptionConfig['type'] = 'general'
): string {
  // Remove HTML tags
  const cleanContent = content.replace(/<[^>]*>/g, '').trim()

  // Extract first meaningful sentence(s)
  const sentences = cleanContent.split(/[.!?]/).filter(s => s.trim().length > 20)
  let description = sentences[0]?.trim() || cleanContent.substring(0, 100)

  // Add second sentence if there's room
  if (description.length < META_DESCRIPTION_LIMITS.ideal - 50 && sentences[1]) {
    description += '. ' + sentences[1].trim()
  }

  // Ensure it ends properly
  if (!description.match(/[.!?]$/)) {
    description += '.'
  }

  // Add context-specific suffix
  const suffix = getContextSuffix(type)
  if (description.length + suffix.length <= META_DESCRIPTION_LIMITS.max) {
    description += ' ' + suffix
  }

  return truncateToIdealLength(description)
}

/**
 * Optimize existing meta description
 */
export function optimizeMetaDescription(description: string, keywords?: string[]): {
  optimized: string
  score: number
  suggestions: string[]
} {
  const suggestions: string[] = []
  let score = 100
  let optimized = description

  // Check length
  if (description.length < META_DESCRIPTION_LIMITS.min) {
    suggestions.push(`Meta təsvir çox qısadır (${description.length} simvol). Minimum ${META_DESCRIPTION_LIMITS.min} simvol olmalıdır.`)
    score -= 20
  } else if (description.length > META_DESCRIPTION_LIMITS.max) {
    suggestions.push(`Meta təsvir çox uzundur (${description.length} simvol). Maksimum ${META_DESCRIPTION_LIMITS.max} simvol olmalıdır.`)
    optimized = truncateToIdealLength(description)
    score -= 15
  } else {
    suggestions.push('✅ Uzunluq ideal intervalda')
  }

  // Check for call-to-action
  const ctaPatterns = /müraciət|qeydiyyat|oxu|kəşf|qoşul|əldə et|öyrən/i
  if (!ctaPatterns.test(description)) {
    suggestions.push('Hərəkətə çağırış əlavə edin (müraciət edin, qeydiyyatdan keçin, və s.)')
    score -= 10
  } else {
    suggestions.push('✅ Hərəkətə çağırış var')
  }

  // Check for keywords
  if (keywords && keywords.length > 0) {
    const foundKeywords = keywords.filter(kw => 
      description.toLowerCase().includes(kw.toLowerCase())
    )
    if (foundKeywords.length === 0) {
      suggestions.push('Açar sözlər əlavə edin')
      score -= 15
    } else {
      suggestions.push(`✅ ${foundKeywords.length} açar söz tapıldı`)
    }
  }

  // Check for location mention
  const azCities = ['Bakı', 'Sumqayıt', 'Gəncə', 'Azərbaycan']
  const hasLocation = azCities.some(city => description.includes(city))
  if (!hasLocation) {
    suggestions.push('Şəhər və ya ölkə adı əlavə edin (Bakı, Azərbaycan)')
    score -= 10
  } else {
    suggestions.push('✅ Coğrafi məlumat var')
  }

  // Check for duplicate words
  const words = description.toLowerCase().split(/\s+/)
  const duplicates = words.filter((word, index) => 
    word.length > 4 && words.indexOf(word) !== index
  )
  if (duplicates.length > 2) {
    suggestions.push('Təkrarlanan sözləri azaldın')
    score -= 5
  }

  return { optimized, score, suggestions }
}

/**
 * Generate multiple variations for A/B testing
 */
export function generateVariations(config: MetaDescriptionConfig, count: number = 3): string[] {
  const variations: string[] = []
  const templates = TEMPLATES[config.type] || TEMPLATES.general

  for (let i = 0; i < Math.min(count, templates.length); i++) {
    const template = templates[i]
    const variation = generateMetaDescription({
      ...config,
      customData: { ...config.customData, _templateIndex: i },
    })
    variations.push(variation)
  }

  return variations
}

/**
 * Analyze meta description performance potential
 */
export function analyzeMetaDescription(description: string): {
  score: number
  length: number
  rating: 'excellent' | 'good' | 'fair' | 'poor'
  issues: string[]
  strengths: string[]
} {
  const issues: string[] = []
  const strengths: string[] = []
  let score = 100

  const length = description.length

  // Length analysis
  if (length < META_DESCRIPTION_LIMITS.min) {
    issues.push('Çox qısa - daha ətraflı məlumat əlavə edin')
    score -= 25
  } else if (length >= META_DESCRIPTION_LIMITS.min && length <= META_DESCRIPTION_LIMITS.ideal) {
    strengths.push('İdeal uzunluq')
  } else if (length <= META_DESCRIPTION_LIMITS.max) {
    strengths.push('Yaxşı uzunluq')
  } else {
    issues.push('Çox uzun - Google kəsəcək')
    score -= 20
  }

  // Uniqueness
  if (/lorem ipsum|sample|example/i.test(description)) {
    issues.push('Nümunə mətn - unikal məzmun yazın')
    score -= 30
  }

  // Action words
  const actionWords = ['müraciət', 'qeydiyyat', 'kəşf', 'oxu', 'öyrən', 'əldə', 'qoşul']
  const hasAction = actionWords.some(word => description.toLowerCase().includes(word))
  if (hasAction) {
    strengths.push('Hərəkətə çağırış var')
  } else {
    issues.push('Hərəkətə çağırış yoxdur')
    score -= 15
  }

  // Numbers/specifics
  if (/\d+/.test(description)) {
    strengths.push('Konkret rəqəmlər var')
  }

  // Emojis (1-2 is good) - using simpler detection
  const commonEmojis = ['🇦🇿', '✅', '🎯', '🎓', '💼', '🏢', '📅', '🔥', '⭐', '👍']
  const emojiCount = commonEmojis.filter(emoji => description.includes(emoji)).length
  if (emojiCount === 1 || emojiCount === 2) {
    strengths.push('Emojilər diqqət çəkir')
  } else if (emojiCount > 2) {
    issues.push('Çox emoji - 1-2 ədəd kifayətdir')
    score -= 5
  }

  // Rating
  let rating: 'excellent' | 'good' | 'fair' | 'poor'
  if (score >= 90) rating = 'excellent'
  else if (score >= 75) rating = 'good'
  else if (score >= 60) rating = 'fair'
  else rating = 'poor'

  return { score, length, rating, issues, strengths }
}

// Helper functions

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const months = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'
  ]
  return `${date.getDate()} ${months[date.getMonth()]}`
}

function truncateToIdealLength(text: string): string {
  if (text.length <= META_DESCRIPTION_LIMITS.ideal) {
    return text
  }

  // Truncate at last complete word before limit
  const truncated = text.substring(0, META_DESCRIPTION_LIMITS.ideal)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > META_DESCRIPTION_LIMITS.min) {
    return truncated.substring(0, lastSpace) + '...'
  }
  
  return truncated + '...'
}

function addCallToAction(text: string, type: MetaDescriptionConfig['type']): string {
  const ctas = {
    vacancy: ' İndi müraciət edin!',
    event: ' Qeydiyyatdan keçin!',
    blog: ' Daha çox oxuyun!',
    organization: ' Ətraflı məlumat əldə edin!',
    training: ' Qeydiyyat açıqdır!',
    general: ' Kəşf edin!',
  }

  const cta = ctas[type] || ctas.general
  
  if (text.length + cta.length <= META_DESCRIPTION_LIMITS.max) {
    return text + cta
  }
  
  return text
}

function getContextSuffix(type: MetaDescriptionConfig['type']): string {
  const suffixes = {
    vacancy: 'Azərbaycanda iş imkanları icma360-da.',
    event: 'Gənclər üçün tədbir.',
    blog: 'icma360 bloqu.',
    organization: 'Azərbaycan təşkilat kataloqu.',
    training: 'Pulsuz təlim proqramı.',
    general: 'icma360 - Gənclər üçün #1 platforma.',
  }

  return suffixes[type] || suffixes.general
}

/**
 * Batch generate meta descriptions for multiple items
 */
export function batchGenerate(items: MetaDescriptionConfig[]): Array<{
  original: MetaDescriptionConfig
  description: string
  score: number
}> {
  return items.map(item => {
    const description = generateMetaDescription(item)
    const { score } = analyzeMetaDescription(description)
    return { original: item, description, score }
  })
}
