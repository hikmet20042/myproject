/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL,
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: [
    '/admin/*',
    '/api/*',
    '/auth/*'
  ],
  additionalPaths: async (config) => {
    return [
      await config.transform(config, '/'),
      await config.transform(config, '/about'),
      await config.transform(config, '/blog'),
      await config.transform(config, '/resources'),
      await config.transform(config, '/submit'),
      await config.transform(config, '/stats')
    ]
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/auth']
      }
    ]
  }
}
