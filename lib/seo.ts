import { Metadata } from 'next'

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  ogImage?: string
  ogType?: 'website' | 'article' | 'profile'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  locale?: string
  alternateLocales?: string[]
  noindex?: boolean
  structuredData?: any
}

/**
 * Generate comprehensive metadata for SEO optimization
 * Includes Open Graph, Twitter Cards, and Schema.org structured data
 */
export function generateSEOMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    ogImage = '/og-image.png',
    ogType = 'website',
    publishedTime,
    modifiedTime,
    author,
    locale = 'az_AZ',
    alternateLocales = ['az_AZ'],
    noindex = false,
    structuredData
  } = config

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
  const fullImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`

  const metadata: Metadata = {
    title,
    description,
    keywords: keywords.join(', '),
    
    // Canonical URL
    alternates: canonical ? {
      canonical,
      languages: {
        'az': `${siteUrl}${canonical}`,
      }
    } : undefined,
    
    // Robots directives
    robots: noindex ? {
      index: false,
      follow: false,
    } : {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Open Graph
    openGraph: {
      type: ogType,
      locale,
      alternateLocale: alternateLocales,
      title,
      description,
      siteName: 'icma360',
      url: canonical ? `${siteUrl}${canonical}` : siteUrl,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && ogType === 'article' && { authors: [author] }),
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullImageUrl],
      creator: '@icma360',
      site: '@icma360',
    },
    
    // Additional metadata
    authors: author ? [{ name: author }] : undefined,
    creator: 'icma360',
    publisher: 'icma360',
    category: 'Youth Opportunities',
    
    // Verification
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    },
  }

  return metadata
}

/**
 * Generate JSON-LD structured data for rich snippets
 */
export function generateStructuredData(type: string, data: any): string {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
  
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  }

  return JSON.stringify(baseData)
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationSchema() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
  
  return generateStructuredData('Organization', {
    name: 'icma360',
    alternateName: 'icma360 Azərbaycan',
    url: siteUrl,
    logo: `${siteUrl}/icma360_logo.png`,
    description: 'Azərbaycanda gənclər üçün aparıcı imkan platforması - iş, təcrübə, təlim, könüllülük və QHT imkanlarını birləşdirən platforma',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AZ',
      addressRegion: 'Bakı',
      addressLocality: 'Azərbaycan Respublikası',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Müştəri Xidməti',
      availableLanguage: ['Azərbaycan dili', 'English'],
    },
    areaServed: {
      '@type': 'Country',
      name: 'Azərbaycan',
    },
    keywords: 'iş elanları, təcrübə proqramları, təlim, könüllülük, QHT, gənclər üçün imkanlar, Azərbaycan',
    sameAs: [
      // Add social media links
      'https://facebook.com/icma360',
      'https://twitter.com/icma360',
      'https://instagram.com/icma360',
    ],
  })
}

/**
 * Generate WebSite structured data with search functionality
 */
export function generateWebSiteSchema() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
  
  return generateStructuredData('WebSite', {
    name: 'icma360',
    alternateName: 'icma360 - Azərbaycan Gənclik Platforması',
    url: siteUrl,
    description: 'Azərbaycanda iş, təcrübə, təlim və könüllülük imkanlarını tapın. Gənclər üçün pulsuz platforma.',
    inLanguage: ['az', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/resources?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  })
}

/**
 * Generate LocalBusiness structured data for Azerbaijan
 */
export function generateLocalBusinessSchema() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
  
  return generateStructuredData('LocalBusiness', {
    '@type': ['Organization', 'LocalBusiness'],
    name: 'icma360',
    description: 'Azərbaycanda gənclər üçün aparıcı imkan platforması. İş, təcrübə, təlim, könüllülük və QHT imkanları.',
    url: siteUrl,
    logo: `${siteUrl}/icma360_logo.png`,
    image: `${siteUrl}/og-image.png`,
    telephone: '+994-XX-XXX-XX-XX', // Add your phone number
    email: 'info@icma360.az', // Add your email
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Bakı şəhəri', // Add specific street address
      addressLocality: 'Bakı',
      addressRegion: 'Bakı',
      postalCode: 'AZ1000', // Add your postal code
      addressCountry: 'AZ',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 40.4093,
      longitude: 49.8671,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    priceRange: 'Pulsuz',
    areaServed: [
      {
        '@type': 'City',
        name: 'Bakı',
      },
      {
        '@type': 'City',
        name: 'Sumqayıt',
      },
      {
        '@type': 'City',
        name: 'Gəncə',
      },
      {
        '@type': 'Country',
        name: 'Azərbaycan',
      },
    ],
    sameAs: [
      'https://facebook.com/icma360',
      'https://twitter.com/icma360',
      'https://instagram.com/icma360',
      'https://linkedin.com/company/icma360',
    ],
  })
}

/**
 * Generate JobPosting structured data
 */
export function generateJobPostingSchema(vacancy: any) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
  
  return generateStructuredData('JobPosting', {
    title: vacancy.title,
    description: vacancy.description,
    datePosted: vacancy.createdAt || vacancy.submittedAt,
    validThrough: vacancy.applicationDeadline,
    employmentType: vacancy.employmentType?.toUpperCase() || 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: vacancy.organization || vacancy.organizationName,
      sameAs: vacancy.website,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: vacancy.location?.city,
        addressCountry: vacancy.location?.country || 'AZ',
      },
    },
    baseSalary: vacancy.salary ? {
      '@type': 'MonetaryAmount',
      currency: 'AZN',
      value: {
        '@type': 'QuantitativeValue',
        value: vacancy.salary,
        unitText: 'MONTH',
      },
    } : undefined,
    url: `${siteUrl}/resources/vacancies/${vacancy._id}`,
  })
}

/**
 * Generate Event structured data
 */
export function generateEventSchema(event: any) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
  
  return generateStructuredData('Event', {
    name: event.title,
    description: event.description,
    startDate: event.eventDate,
    endDate: event.endDate || event.eventDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.location?.type === 'online' 
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: event.location?.type === 'online' ? {
      '@type': 'VirtualLocation',
      url: event.registrationLink,
    } : {
      '@type': 'Place',
      name: event.location?.city,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.location?.city,
        addressCountry: 'AZ',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: event.organizationName || event.organization,
      url: event.website,
    },
    url: `${siteUrl}/resources/events/${event._id}`,
    image: event.image || `${siteUrl}/og-image.png`,
  })
}

/**
 * Generate Article structured data for blogs
 */
export function generateArticleSchema(blog: any) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
  
  return generateStructuredData('Article', {
    headline: blog.title,
    description: blog.excerpt || blog.description,
    image: blog.featuredImage || `${siteUrl}/og-image.png`,
    datePublished: blog.submittedAt || blog.createdAt,
    dateModified: blog.updatedAt || blog.submittedAt || blog.createdAt,
    author: {
      '@type': 'Person',
      name: blog.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'icma360',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icma360_logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blogs/${blog._id}`,
    },
    keywords: blog.tags?.join(', '),
  })
}

/**
 * Generate organization structured data with ratings
 */
export function generateOrganizationProfileSchema(organization: any, includeRating = false) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
  
  const schema: any = {
    '@type': 'Organization',
    name: organization.organizationName,
    description: organization.description,
    url: organization.website,
    logo: organization.logo,
    address: {
      '@type': 'PostalAddress',
      addressLocality: organization.location?.city,
      addressCountry: 'AZ',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: organization.contactPhone,
      email: organization.contactEmail,
      contactType: 'Customer Service',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Azerbaijan',
    },
    knowsAbout: organization.focusAreas?.join(', '),
    sameAs: [
      organization.website,
      organization.facebook,
      organization.twitter,
      organization.linkedin,
    ].filter(Boolean),
  }

  // Add aggregate rating if available
  if (includeRating && organization.rating && organization.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: organization.rating,
      reviewCount: organization.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return generateStructuredData('Organization', schema)
}

/**
 * Generate Review schema for individual reviews
 */
export function generateReviewSchema(review: any, itemType: 'Organization' | 'JobPosting' | 'Event' = 'Organization') {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
  
  return generateStructuredData('Review', {
    itemReviewed: {
      '@type': itemType,
      name: review.itemName,
    },
    author: {
      '@type': 'Person',
      name: review.authorName,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.comment,
    datePublished: review.createdAt,
  })
}

/**
 * Generate AggregateRating schema for items with multiple reviews
 */
export function generateAggregateRatingSchema(data: {
  itemType: string
  itemName: string
  ratingValue: number
  reviewCount: number
  bestRating?: number
  worstRating?: number
}) {
  return generateStructuredData('AggregateRating', {
    itemReviewed: {
      '@type': data.itemType,
      name: data.itemName,
    },
    ratingValue: data.ratingValue,
    reviewCount: data.reviewCount,
    bestRating: data.bestRating || 5,
    worstRating: data.worstRating || 1,
  })
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
  
  return generateStructuredData('BreadcrumbList', {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.url}`,
    })),
  })
}

/**
 * Azerbaijan-specific keywords for opportunities
 * Heavily focused on Azerbaijani language for local market
 */
export const azerbaijanKeywords = [
  // Azerbaijani - Job/Work related (İş)
  'Azərbaycanda iş',
  'Bakıda iş',
  'iş elanları',
  'iş elanları Bakı',
  'iş elanları Azərbaycan',
  'boş iş yeri',
  'iş axtarıram',
  'Azərbaycanda iş imkanları',
  'Bakıda iş imkanları',
  'gənclər üçün iş',
  'tələbələr üçün iş',
  'yeni iş',
  'iş təklifləri',
  'Sumqayıtda iş',
  'Gəncədə iş',
  'part time iş',
  'full time iş',
  'distant iş',
  'uzaqdan iş',
  'könüllü iş',
  
  // Azerbaijani - Internship/Experience (Təcrübə)
  'təcrübə proqramı',
  'Azərbaycanda təcrübə',
  'Bakıda təcrübə',
  'ödənişli təcrübə',
  'staj',
  'staj proqramları',
  'tələbə təcrübəsi',
  'yay təcrübəsi',
  'praktika',
  'gənclər üçün təcrübə',
  'təcrübə imkanları',
  
  // Azerbaijani - Training/Education (Təlim)
  'təlim proqramları',
  'Azərbaycanda təlim',
  'Bakıda təlim',
  'pulsuz təlim',
  'onlayn təlim',
  'treninqlər',
  'seminarlar',
  'vorkşoplar',
  'sertifikat proqramları',
  'peşəkar inkişaf',
  'bacarıq inkişafı',
  'karyera təlimi',
  
  // Azerbaijani - Volunteering (Könüllülük)
  'könüllülük',
  'Azərbaycanda könüllülük',
  'Bakıda könüllülük',
  'könüllü proqramlar',
  'könüllü olmaq',
  'könüllü imkanları',
  'sosial könüllülük',
  
  // Azerbaijani - Youth (Gənclər)
  'gənclər üçün imkanlar',
  'Azərbaycanda gənclər',
  'gənclərin inkişafı',
  'gənclik proqramları',
  'gənclik layihələri',
  'gənc lider',
  'gənclik təşkilatları',
  'gənclər üçün qrant',
  'gənc peşəkarlar',
  
  // Azerbaijani - Organizations (QHT)
  'QHT',
  'Azərbaycanda QHT',
  'Bakıda QHT',
  'QHT siyahısı',
  'QHT-lər',
  'ictimai təşkilat',
  'qeyri-hökumət təşkilatı',
  'QHT vakansiyaları',
  
  // Azerbaijani - Scholarships/Grants (Təqaüd/Qrant)
  'təqaüd',
  'təqaüd proqramları',
  'Azərbaycanda təqaüd',
  'xaricdə təqaüd',
  'qrant',
  'qrant proqramları',
  'maliyyə dəstəyi',
  'pulsuz təhsil',
  
  // Azerbaijani - Events (Tədbirlər)
  'tədbirlər Bakı',
  'tədbirlər Azərbaycan',
  'gənclik tədbirləri',
  'konfranslar',
  'forum',
  'networking tədbirləri',
  'karyera günləri',
  'iş yarmarkaları',
  
  // Azerbaijani - Career (Karyera)
  'karyera',
  'karyera inkişafı',
  'karyera imkanları',
  'karyera məsləhəti',
  'peşə seçimi',
  'iş təcrübəsi',
  'CV hazırlanması',
  'müsahibəyə hazırlıq',
  
  // Azerbaijani - Students (Tələbələr)
  'tələbələr üçün',
  'tələbə işi',
  'tələbə təcrübəsi',
  'məzun',
  'yeni məzun',
  'universitet tələbələri',
  
  // English terms (secondary, for bilingual users)
  'opportunities Azerbaijan',
  'jobs Azerbaijan',
  'internships Baku',
  'Azerbaijan youth',
  'Baku opportunities',
]

/**
 * Generate location-specific keywords
 */
export function getLocationKeywords(city?: string): string[] {
  const baseKeywords = [...azerbaijanKeywords]
  
  if (city) {
    const citySpecific = [
      // Azerbaijani location-based
      `${city}da iş`,
      `${city}da iş elanları`,
      `${city}da təcrübə`,
      `${city}da təlim`,
      `${city}da könüllülük`,
      `${city}da vakansiya`,
      `${city}da tədbirlər`,
      `${city}da QHT`,
      `${city} iş imkanları`,
      `${city} gənclik proqramları`,
      // English (secondary)
      `${city} jobs`,
      `${city} opportunities`,
      `${city} internships`,
    ]
    return [...baseKeywords, ...citySpecific]
  }
  
  return baseKeywords
}

/**
 * Generate HowTo structured data for guides and tutorials
 */
export function generateHowToSchema(data: {
  name: string
  description: string
  image?: string
  totalTime?: string
  steps: Array<{
    name: string
    text: string
    image?: string
    url?: string
  }>
}) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
  
  return generateStructuredData('HowTo', {
    name: data.name,
    description: data.description,
    image: data.image || `${siteUrl}/og-image.png`,
    totalTime: data.totalTime || 'PT10M',
    step: data.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
      url: step.url,
    })),
  })
}

/**
 * Generate Course structured data for training programs
 */
export function generateCourseSchema(course: {
  name: string
  description: string
  provider: string
  url?: string
  image?: string
  datePublished?: string
  courseMode?: 'online' | 'offline' | 'hybrid'
  duration?: string
  price?: number
  currency?: string
  hasCourseInstance?: Array<{
    startDate: string
    endDate?: string
    location?: string
    instructor?: string
  }>
}) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
  
  const schema: any = {
    name: course.name,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: course.provider,
      sameAs: course.url,
    },
    image: course.image || `${siteUrl}/og-image.png`,
    datePublished: course.datePublished,
  }

  // Add course mode
  if (course.courseMode) {
    const modeMap = {
      online: 'https://schema.org/OnlineEventAttendanceMode',
      offline: 'https://schema.org/OfflineEventAttendanceMode',
      hybrid: 'https://schema.org/MixedEventAttendanceMode',
    }
    schema.courseMode = modeMap[course.courseMode]
  }

  // Add duration
  if (course.duration) {
    schema.timeRequired = course.duration // e.g., "P4W" for 4 weeks
  }

  // Add price
  if (course.price !== undefined) {
    schema.offers = {
      '@type': 'Offer',
      price: course.price,
      priceCurrency: course.currency || 'AZN',
      availability: 'https://schema.org/InStock',
    }
  }

  // Add course instances
  if (course.hasCourseInstance && course.hasCourseInstance.length > 0) {
    schema.hasCourseInstance = course.hasCourseInstance.map((instance) => ({
      '@type': 'CourseInstance',
      courseMode: schema.courseMode,
      startDate: instance.startDate,
      endDate: instance.endDate,
      location: instance.location ? {
        '@type': 'Place',
        name: instance.location,
      } : undefined,
      instructor: instance.instructor ? {
        '@type': 'Person',
        name: instance.instructor,
      } : undefined,
    }))
  }

  return generateStructuredData('Course', schema)
}

/**
 * Generate QAPage structured data for Q&A content
 */
export function generateQAPageSchema(data: {
  question: string
  answer: string
  author?: string
  dateCreated?: string
  upvoteCount?: number
  acceptedAnswer?: boolean
}) {
  return generateStructuredData('QAPage', {
    mainEntity: {
      '@type': 'Question',
      name: data.question,
      text: data.question,
      answerCount: 1,
      upvoteCount: data.upvoteCount || 0,
      dateCreated: data.dateCreated,
      author: data.author ? {
        '@type': 'Person',
        name: data.author,
      } : undefined,
      acceptedAnswer: {
        '@type': 'Answer',
        text: data.answer,
        dateCreated: data.dateCreated,
        upvoteCount: data.upvoteCount || 0,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    },
  })
}

/**
 * Generate FAQPage structured data for FAQ sections
 */
export function generateFAQPageSchema(faqs: Array<{ question: string; answer: string }>) {
  return generateStructuredData('FAQPage', {
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  })
}

/**
 * Generate VideoObject structured data for video content
 */
export function generateVideoSchema(video: {
  name: string
  description: string
  thumbnailUrl: string
  uploadDate: string
  duration?: string
  contentUrl?: string
  embedUrl?: string
}) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
  
  return generateStructuredData('VideoObject', {
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    duration: video.duration, // ISO 8601 format, e.g., "PT5M30S"
    contentUrl: video.contentUrl,
    embedUrl: video.embedUrl,
    publisher: {
      '@type': 'Organization',
      name: 'icma360',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icma360_logo.png`,
      },
    },
  })
}

/**
 * Generate ItemList structured data for lists/collections
 */
export function generateItemListSchema(data: {
  name: string
  description?: string
  items: Array<{
    name: string
    url: string
    image?: string
    description?: string
  }>
}) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
  
  return generateStructuredData('ItemList', {
    name: data.name,
    description: data.description,
    numberOfItems: data.items.length,
    itemListElement: data.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Thing',
        name: item.name,
        url: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
        image: item.image,
        description: item.description,
      },
    })),
  })
}
