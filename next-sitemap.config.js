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
      .select('id')
      .eq('status', 'approved')
      .limit(1000)

    if (vacanciesError) throw vacanciesError

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .eq('status', 'approved')
      .limit(1000)

    if (eventsError) throw eventsError

    const { data: blogs, error: blogsError } = await supabase
      .from('blogs')
      .select('id')
      .eq('status', 'approved')
      .limit(1000)

    if (blogsError) throw blogsError

    const { data: organizations, error: organizationsError } = await supabase
      .from('organization_profiles')
      .select('account_id')
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
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: [
    '/admin/*',
    '/api/*',
    '/auth/*',
    '/dashboard/*',
    '/edit/*',
    '/submit/*',
    '/profile/*'
  ],
  
  // Azerbaijani-only alternates
  alternateRefs: [
    {
      href: process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org',
      hreflang: 'az',
    },
    {
      href: process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org',
      hreflang: 'x-default',
    },
  ],

  additionalPaths: async (config) => {
    const paths = []
    const siteUrl = config.siteUrl || 'https://icma360.org'
    
    // Static pages with high priority
    const staticPages = [
      { url: '/', priority: 1.0, changefreq: 'daily' },
      { url: '/resources', priority: 0.9, changefreq: 'daily' },
      { url: '/resources/organizations', priority: 0.8, changefreq: 'weekly' },
      { url: '/blogs', priority: 0.8, changefreq: 'daily' },
      { url: '/about', priority: 0.7, changefreq: 'weekly' },
    ]
    
    staticPages.forEach(page => {
      paths.push(config.transform(config, page.url, page.priority, page.changefreq))
    })
    
    // Fetch dynamic content
    const { vacancies, events, blogs, organizations } = await fetchDynamicPaths()
    
    // Add vacancies (high priority for job listings)
    vacancies.forEach(vacancy => {
      paths.push(config.transform(config, `/resources/vacancies/${vacancy.id}`, 0.9, 'daily'))
    })
    
    // Add events
    events.forEach(event => {
      paths.push(config.transform(config, `/resources/events/${event.id}`, 0.8, 'daily'))
    })
    
    // Add blogs
    blogs.forEach(blog => {
      paths.push(config.transform(config, `/blogs/${blog.id}`, 0.7, 'weekly'))
    })
    
    // Add organizations
    organizations.forEach(organization => {
      paths.push(config.transform(config, `/resources/organizations/${organization.account_id}`, 0.7, 'weekly'))
    })
    
    return paths
  },
  
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/auth', '/dashboard', '/edit', '/submit', '/profile']
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/api', '/auth', '/dashboard', '/edit', '/submit', '/profile'],
        crawlDelay: 0
      },
      {
        userAgent: 'bingbot',
        allow: '/',
        disallow: ['/admin', '/api', '/auth', '/dashboard', '/edit', '/submit', '/profile'],
        crawlDelay: 0
      }
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org'}/sitemap.xml`,
    ]
  },
  
  transform: async (config, path) => {
    // Custom transform to add lastmod dates
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    }
  },
}
