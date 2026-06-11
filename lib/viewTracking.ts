/**
 * View tracking utilities for blogs, events, and vacancies.
 *
 * Design principles:
 * - Server-side deduplication (24h window per user/session)
 * - Bot filtering by user-agent
 * - Atomic counter increments
 * - Cookie-based anonymous session tracking
 * - user_id population for authenticated users
 */

import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'

const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i,
  /curl/i, /wget/i, /python/i, /node-fetch/i,
  /google/i, /bing/i, /yandex/i, /baidu/i, /duckduck/i,
  /facebookexternalhit/i, /twitterbot/i, /slackbot/i,
  /linkedinbot/i, /whatsapp/i, /telegram/i,
  /pingdom/i, /uptime/i, /monitor/i, /healthcheck/i,
  /statuscake/i, /newrelic/i, /datadog/i,
  /headless/i, /puppeteer/i, /playwright/i, /selenium/i,
  /automation/i, /httpclient/i, /axios/i, /got/i,
  /chromium/i, /firefox.*headless/i, /chrome.*headless/i,
  /screenshot/i, /jsdom/i, /nightmare/i, /casper/i,
  /simplecrawler/i, /scrapy/i, /colly/i, /scraperman/i,
]

const SUSPICIOUS_PATTERNS = [
  /\b(python|java|go|rust|c\+\+)\b/i,
  /\b(requests|urllib|httpx|aiohttp)\b/i,
  /\b(cheerio|jsdom|puppeteer|playwright)\b/i,
]

export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true
  if (BOT_PATTERNS.some((pattern) => pattern.test(userAgent))) return true
  
  const userAgentLower = userAgent.toLowerCase()
  if (
    userAgentLower.includes('chrome') && 
    (userAgentLower.includes('headless') || userAgentLower.includes('Automation'))
  ) return true
  
  return false
}

export function isSuspiciousRequest(userAgent: string | null): boolean {
  if (!userAgent) return true
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(userAgent))
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

export function getSessionId(request: NextRequest, cookieName: string): { id: string; isNew: boolean } {
  const existing = request.cookies.get(cookieName)?.value
  if (existing) return { id: existing, isNew: false }
  const newId = crypto.randomUUID()
  return { id: newId, isNew: true }
}

export function setSessionCookie(
  response: NextResponse,
  cookieName: string,
  sessionId: string
) {
  response.cookies.set(cookieName, sessionId, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })
}

/**
 * Record a view with 24h deduplication per session/user.
 * Uses optimized database RPCs for performance and atomicity.
 */

// --- BLOG VIEW TRACKING ---

export async function recordBlogView(
  supabase: SupabaseClient,
  blogId: string,
  sessionId: string,
  userId: string | null,
): Promise<{ views: number; uniqueViews: number; viewIncremented: boolean }> {
  console.debug(`[recordBlogView] Calling RPC: blogId="${blogId}", sessionId="${sessionId}", userId="${userId}"`)
  
  const { data, error } = await supabase.rpc('record_blog_view', {
    p_blog_id: blogId,
    p_session_id: sessionId,
    p_user_id: userId,
  })

  if (error) {
    console.error('[recordBlogView] RPC error:', error)
    // Fallback or rethrow? Usually non-critical, but let's at least return something
    return { views: 0, uniqueViews: 0, viewIncremented: false }
  }

  console.debug('[recordBlogView] RPC success:', data)
  return {
    views: Number(data.views),
    uniqueViews: Number(data.unique_views),
    viewIncremented: data.view_incremented,
  }
}

export async function getBlogViewCounts(
  supabase: SupabaseClient,
  blogId: string,
): Promise<{ views: number; uniqueViews: number }> {
  console.debug(`[getBlogViewCounts] Fetching stats for blogId="${blogId}"`)
  
  const { data, error } = await supabase.rpc('get_blog_stats_v2', {
    p_blog_id: blogId,
  })

  if (error) {
    console.error('[getBlogViewCounts] RPC error:', error)
    return { views: 0, uniqueViews: 0 }
  }

  console.debug('[getBlogViewCounts] RPC success:', data)
  return {
    views: Number(data.views),
    uniqueViews: Number(data.unique_views),
  }
}

// --- EVENT/VACANCY VIEW TRACKING ---

export async function recordContentView(
  supabase: SupabaseClient,
  contentType: 'event' | 'vacancy',
  contentId: string,
  sessionId: string,
  userId: string | null,
): Promise<{ views: number; uniqueViews: number; viewIncremented: boolean }> {
  const { data, error } = await supabase.rpc('record_content_view', {
    p_content_type: contentType,
    p_content_id: contentId,
    p_session_id: sessionId,
    p_user_id: userId,
  })

  if (error) {
    console.error(`Error recording ${contentType} view:`, error)
    return { views: 0, uniqueViews: 0, viewIncremented: false }
  }

  return {
    views: Number(data.views),
    uniqueViews: Number(data.unique_views),
    viewIncremented: data.view_incremented,
  }
}

export async function getContentViewCounts(
  supabase: SupabaseClient,
  contentType: 'event' | 'vacancy',
  contentId: string,
): Promise<{ views: number; uniqueViews: number }> {
  const { data, error } = await supabase.rpc('get_content_stats_v2', {
    p_content_type: contentType,
    p_content_id: contentId,
  })

  if (error) {
    console.error(`Error getting ${contentType} view counts:`, error)
    return { views: 0, uniqueViews: 0 }
  }

  return {
    views: Number(data.views),
    uniqueViews: Number(data.unique_views),
  }
}

