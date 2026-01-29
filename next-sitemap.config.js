/** @type {import('next-sitemap').IConfig} */
const mongoose = require('mongoose')

// Dynamic routes fetcher
async function fetchDynamicPaths() {
  try {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) return { vacancies: [], events: [], blogs: [], ngos: [] }

    await mongoose.connect(mongoUri)
    
    const vacancies = await mongoose.connection.db.collection('vacancies')
      .find({ status: 'approved' })
      .project({ _id: 1 })
      .limit(1000)
      .toArray()
    
    const events = await mongoose.connection.db.collection('events')
      .find({ status: 'approved' })
      .project({ _id: 1 })
      .limit(1000)
      .toArray()
    
    const blogs = await mongoose.connection.db.collection('blogs')
      .find({ status: 'approved' })
      .project({ _id: 1 })
      .limit(1000)
      .toArray()
    
    const ngos = await mongoose.connection.db.collection('ngos')
      .find({ status: 'approved' })
      .project({ _id: 1 })
      .limit(1000)
      .toArray()
    
    await mongoose.connection.close()
    
    return { vacancies, events, blogs, ngos }
  } catch (error) {
    console.error('Error fetching dynamic paths:', error)
    return { vacancies: [], events: [], blogs: [], ngos: [] }
  }
}

module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az',
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
  
  // Multilingual support
  alternateRefs: [
    {
      href: process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az',
      hreflang: 'az',
    },
    {
      href: `${process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'}/en`,
      hreflang: 'en',
    },
    {
      href: process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az',
      hreflang: 'x-default',
    },
  ],

  additionalPaths: async (config) => {
    const paths = []
    const siteUrl = config.siteUrl || 'https://icma360.az'
    
    // Static pages with high priority
    const staticPages = [
      { url: '/', priority: 1.0, changefreq: 'daily' },
      { url: '/az', priority: 1.0, changefreq: 'daily' },
      { url: '/en', priority: 1.0, changefreq: 'daily' },
      { url: '/resources', priority: 0.9, changefreq: 'daily' },
      { url: '/az/resources', priority: 0.9, changefreq: 'daily' },
      { url: '/en/resources', priority: 0.9, changefreq: 'daily' },
      { url: '/blogs', priority: 0.8, changefreq: 'daily' },
      { url: '/az/blogs', priority: 0.8, changefreq: 'daily' },
      { url: '/en/blogs', priority: 0.8, changefreq: 'daily' },
      { url: '/about', priority: 0.7, changefreq: 'weekly' },
      { url: '/az/about', priority: 0.7, changefreq: 'weekly' },
      { url: '/en/about', priority: 0.7, changefreq: 'weekly' },
    ]
    
    staticPages.forEach(page => {
      paths.push(config.transform(config, page.url, page.priority, page.changefreq))
    })
    
    // Fetch dynamic content
    const { vacancies, events, blogs, ngos } = await fetchDynamicPaths()
    
    // Add vacancies (high priority for job listings)
    vacancies.forEach(vacancy => {
      paths.push(config.transform(config, `/resources/vacancies/${vacancy._id}`, 0.9, 'daily'))
      paths.push(config.transform(config, `/az/resources/vacancies/${vacancy._id}`, 0.9, 'daily'))
      paths.push(config.transform(config, `/en/resources/vacancies/${vacancy._id}`, 0.9, 'daily'))
    })
    
    // Add events
    events.forEach(event => {
      paths.push(config.transform(config, `/resources/events/${event._id}`, 0.8, 'daily'))
      paths.push(config.transform(config, `/az/resources/events/${event._id}`, 0.8, 'daily'))
      paths.push(config.transform(config, `/en/resources/events/${event._id}`, 0.8, 'daily'))
    })
    
    // Add blogs
    blogs.forEach(blog => {
      paths.push(config.transform(config, `/blogs/${blog._id}`, 0.7, 'weekly'))
      paths.push(config.transform(config, `/az/blogs/${blog._id}`, 0.7, 'weekly'))
      paths.push(config.transform(config, `/en/blogs/${blog._id}`, 0.7, 'weekly'))
    })
    
    // Add NGOs
    ngos.forEach(ngo => {
      paths.push(config.transform(config, `/resources/ngos/${ngo._id}`, 0.7, 'weekly'))
      paths.push(config.transform(config, `/az/resources/ngos/${ngo._id}`, 0.7, 'weekly'))
      paths.push(config.transform(config, `/en/resources/ngos/${ngo._id}`, 0.7, 'weekly'))
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
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'}/sitemap.xml`,
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
