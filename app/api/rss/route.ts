import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import Blog from '@/lib/models/Blog'

/**
 * RSS Feed for Blog Posts
 * Increases content distribution and helps with SEO
 * Access at: /api/rss
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // Fetch latest 50 published blog posts
    const blogs = await Blog.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('title content excerpt author createdAt updatedAt slug category tags language')
      .lean()

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
    const currentDate = new Date().toUTCString()

    // Generate RSS XML
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>icma360 - İcma Hekayələri və Yeniliklər</title>
    <link>${siteUrl}</link>
    <description>Azərbaycanda gənclər üçün iş, təcrübə, təlim və könüllülük imkanları haqqında ən son xəbərlər və hekayələr</description>
    <language>az</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml" />
    <generator>icma360 RSS Generator</generator>
    <image>
      <url>${siteUrl}/logo.png</url>
      <title>icma360</title>
      <link>${siteUrl}</link>
    </image>
    ${blogs.map((blog: any) => `
    <item>
      <title><![CDATA[${blog.title}]]></title>
      <link>${siteUrl}/blogs/${blog._id}</link>
      <guid isPermaLink="true">${siteUrl}/blogs/${blog._id}</guid>
      <description><![CDATA[${blog.excerpt || blog.content?.substring(0, 200) + '...'}]]></description>
      <content:encoded><![CDATA[${blog.content}]]></content:encoded>
      <pubDate>${new Date(blog.createdAt).toUTCString()}</pubDate>
      ${blog.updatedAt ? `<dc:date>${new Date(blog.updatedAt).toISOString()}</dc:date>` : ''}
      ${blog.author?.name ? `<dc:creator><![CDATA[${blog.author.name}]]></dc:creator>` : ''}
      ${blog.category ? `<category><![CDATA[${blog.category}]]></category>` : ''}
      ${blog.tags?.map((tag: string) => `<category><![CDATA[${tag}]]></category>`).join('\n      ') || ''}
    </item>`).join('\n')}
  </channel>
</rss>`

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (error) {
    console.error('RSS Feed Error:', error)
    return new NextResponse('Error generating RSS feed', { status: 500 })
  }
}
