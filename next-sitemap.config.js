/** @type {import('next-sitemap').IConfig} */
const { createClient } = require('@supabase/supabase-js')

// Dynamic routes fetcher
async function fetchDynamicPaths() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return { vacancies: [], events: [], blogs: [], organizations: [] }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: vacancies, error: vacanciesError } = await supabase
      .from('vacancies')
      .select('slug, updated_at')
      .eq('status', 'approved')
      .limit(1000)

    if (vacanciesError) throw vacanciesError

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('slug, updated_at')
      .eq('status', 'approved')
      .limit(1000)

    if (eventsError) throw eventsError

    const { data: blogs, error: blogsError } = await supabase
      .from('blogs')
      .select('slug, updated_at')
      .eq('status', 'approved')
      .limit(1000)

    if (blogsError) throw blogsError

    const { data: organizations, error: organizationsError } = await supabase
      .from('organization_profiles')
      .select('slug, updated_at')
      .eq('moderation_status', 'approved')
      .limit(1000)

    if (organizationsError) throw organizationsError

    return { vacancies: vacancies || [], events: events || [], blogs: blogs || [], organizations: organizations || [] }
  } catch (error) {
    console.error('Error fetching dynamic paths:', error)
    return { vacancies: [], events: [], blogs: [], organizations: [] }
  }
}

module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org',
  generateRobotsTxt: false,
  sitemapSize: 5000,
  changefreq: 'daily',
  priority: 0.7,
  autoLastmod: true,
  exclude: [
    '/admin/*',
    '/api/*',
    '/auth/*',
    '/dashboard/*',
    '/edit/*',
    '/submit/*',
    '/profile/*',
    '/onboarding/*',
    '/notifications/*',
    '/saved/*',
    '/organization/pending',
    '/organization/profile',
    '/search*',
    '/indexnow-key.txt',
  ],
  
  alternateRefs: [
    {
      href: process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org',
      hreflang: 'az',
    },
    {
      href: `${process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org'}/en`,
      hreflang: 'en',
    },
    {
      href: process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org',
      hreflang: 'x-default',
    },
  ],

  additionalPaths: async (config) => {
    const paths = []
    
    // Static pages with high priority
    const staticPages = [
      { url: '/', priority: 1.0, changefreq: 'daily' },
      { url: '/resources', priority: 0.9, changefreq: 'daily' },
      { url: '/resources/organizations', priority: 0.8, changefreq: 'weekly' },
      { url: '/resources/vacancies', priority: 0.9, changefreq: 'daily' },
      { url: '/resources/events', priority: 0.8, changefreq: 'daily' },
      { url: '/resources/materials', priority: 0.7, changefreq: 'weekly' },
      { url: '/blogs', priority: 0.8, changefreq: 'daily' },
      { url: '/about', priority: 0.7, changefreq: 'monthly' },
      { url: '/privacy', priority: 0.3, changefreq: 'monthly' },
    ]
    
    staticPages.forEach(page => {
      paths.push({
        loc: page.url,
        lastmod: new Date().toISOString(),
        changefreq: page.changefreq,
        priority: page.priority,
        alternateRefs: config.alternateRefs ?? [],
      })
    })
    
    // Fetch dynamic content
    const { vacancies, events, blogs, organizations } = await fetchDynamicPaths()
    
    // Add vacancies
    vacancies.forEach(vacancy => {
      paths.push({
        loc: `/resources/vacancies/${vacancy.slug}`,
        lastmod: vacancy.updated_at ? new Date(vacancy.updated_at).toISOString() : new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.9,
        alternateRefs: config.alternateRefs ?? [],
      })
    })

    // Add events
    events.forEach(event => {
      paths.push({
        loc: `/resources/events/${event.slug}`,
        lastmod: event.updated_at ? new Date(event.updated_at).toISOString() : new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.8,
        alternateRefs: config.alternateRefs ?? [],
      })
    })

    // Add blogs
    blogs.forEach(blog => {
      paths.push({
        loc: `/blogs/${blog.slug}`,
        lastmod: blog.updated_at ? new Date(blog.updated_at).toISOString() : new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.7,
        alternateRefs: config.alternateRefs ?? [],
      })
    })

    // Add organizations
    organizations.forEach(organization => {
      paths.push({
        loc: `/o/${organization.slug}`,
        lastmod: organization.updated_at ? new Date(organization.updated_at).toISOString() : new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.7,
        alternateRefs: config.alternateRefs ?? [],
      })
    })
    
    return paths
  },
  
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/auth', '/dashboard', '/edit', '/submit', '/profile', '/onboarding', '/notifications', '/saved']
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/api', '/auth', '/dashboard', '/edit', '/submit', '/profile', '/onboarding', '/notifications', '/saved'],
        crawlDelay: 0
      },
      {
        userAgent: 'bingbot',
        allow: '/',
        disallow: ['/admin', '/api', '/auth', '/dashboard', '/edit', '/submit', '/profile', '/onboarding', '/notifications', '/saved'],
        crawlDelay: 0
      }
    ]
    // additionalSitemaps removed: next-sitemap generates the main sitemap automatically
    // Adding it here creates a circular reference
  },
}
