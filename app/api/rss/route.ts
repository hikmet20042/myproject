import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * RSS Feed for Blog Posts
 * Increases content distribution and helps with SEO
 * Access at: /api/rss
 */
export async function GET(request: NextRequest) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.az'
    const currentDate = new Date().toUTCString()

    // In build environments where Supabase admin credentials are not configured,
    // return a valid empty feed instead of failing prerender/export.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const emptyRss = `<?xml version="1.0" encoding="UTF-8"?>
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
      <url>${siteUrl}/icma360_logo.png</url>
      <title>icma360</title>
      <link>${siteUrl}</link>
    </image>
  </channel>
</rss>`

      return new NextResponse(emptyRss, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      })
    }

    const supabase = createSupabaseAdminClient()

    // Fetch latest 50 published blog posts
    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('id, title, content_html, abstract, author_name, created_at, updated_at, tags')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('RSS Feed Query Error:', error)
      return new NextResponse('Error generating RSS feed', { status: 500 })
    }

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
      <url>${siteUrl}/icma360_logo.png</url>
      <title>icma360</title>
      <link>${siteUrl}</link>
    </image>
    ${(blogs || []).map((blog: any) => `
    <item>
      <title><![CDATA[${blog.title}]]></title>
      <link>${siteUrl}/blogs/${blog.id}</link>
      <guid isPermaLink="true">${siteUrl}/blogs/${blog.id}</guid>
      <description><![CDATA[${blog.abstract || ''}]]></description>
      <content:encoded><![CDATA[${blog.content_html || ''}]]></content:encoded>
      <pubDate>${new Date(blog.created_at).toUTCString()}</pubDate>
      ${blog.updated_at ? `<dc:date>${new Date(blog.updated_at).toISOString()}</dc:date>` : ''}
      ${blog.author_name ? `<dc:creator><![CDATA[${blog.author_name}]]></dc:creator>` : ''}
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
