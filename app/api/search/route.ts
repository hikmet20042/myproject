import { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { cache, generateCacheKey, withCache } from '@/lib/cache'
import { applyRateLimit } from '@/lib/rateLimit'

type SearchType = 'event' | 'vacancy' | 'blog' | 'organization'

type SearchItem = {
  id: string
  type: SearchType
  title: string
  snippet: string
  href: string
  imageUrl: string | null
  date: string | null
  ownerLabel: string | null
  locationLabel: string | null
  score: number
}

const SEARCH_TYPES: SearchType[] = ['event', 'vacancy', 'blog', 'organization']
const DEFAULT_LIMIT = 12
const MAX_LIMIT = 30

const normalizeQuery = (raw: string | null): string => (raw || '').trim()

const normalizeTypeList = (raw: string | null): SearchType[] => {
  if (!raw) return SEARCH_TYPES
  const values = raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  const mapped = values
    .map((value) => {
      if (value === 'events') return 'event'
      if (value === 'vacancies') return 'vacancy'
      if (value === 'blogs') return 'blog'
      if (value === 'organizations') return 'organization'
      return value as SearchType
    })
    .filter((value): value is SearchType => SEARCH_TYPES.includes(value))

  return mapped.length > 0 ? Array.from(new Set(mapped)) : SEARCH_TYPES
}

const normalizeImage = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const maybeUrl = (value as Record<string, unknown>).url
    if (typeof maybeUrl === 'string' && maybeUrl.trim()) return maybeUrl.trim()
  }
  return null
}

const toSnippet = (value: unknown): string => {
  if (typeof value !== 'string') return ''
  const plain = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return plain.slice(0, 180)
}

const scoreItem = (queryLower: string, title: string, snippet: string): number => {
  const titleLower = title.toLowerCase()
  const snippetLower = snippet.toLowerCase()
  let score = 0

  if (titleLower === queryLower) score += 100
  else if (titleLower.startsWith(queryLower)) score += 65
  else if (titleLower.includes(queryLower)) score += 40

  if (snippetLower.includes(queryLower)) score += 20

  return score
}

const parseLimit = (raw: string | null): number => {
  const value = Number.parseInt(raw || String(DEFAULT_LIMIT), 10)
  if (!Number.isFinite(value) || value < 1) return DEFAULT_LIMIT
  return Math.min(value, MAX_LIMIT)
}

const parsePage = (raw: string | null): number => {
  const value = Number.parseInt(raw || '1', 10)
  if (!Number.isFinite(value) || value < 1) return 1
  return value
}

export async function GET(request: NextRequest) {
  const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
    request,
    preset: 'publicRead',
    endpoint: '/api/search',
  })

  if (!rateLimitResult.allowed) {
    const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMITED', {}, 429)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }

  try {
    const supabase = createSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    const query = normalizeQuery(searchParams.get('q'))
    const page = parsePage(searchParams.get('page'))
    const limit = parseLimit(searchParams.get('limit'))
    const types = normalizeTypeList(searchParams.get('types'))

    if (!query) {
      const response = successResponse({
        items: [],
        pagination: { page, limit, total: 0, pages: 0 },
        totalsByType: { event: 0, vacancy: 0, blog: 0, organization: 0 },
      })
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (query.length > 100) {
      const response = errorResponse('Sorğu maksimum 100 simvol ola bilər', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const cacheKey = generateCacheKey.search(query, types, page, limit)

    const payload = await withCache(cache.search, cacheKey, async () => {
      const wildcard = `%${query}%`
      const perTypeFetchLimit = Math.min(40, limit * 4)

      const eventPromise = types.includes('event')
        ? supabase
            .from('events_with_stats')
            .select('id, slug, title, description, event_date, location, image_url, organization_name, created_by_organization, status, is_published, created_at')
            .eq('status', 'approved')
            .eq('is_published', true)
            .or(`title.ilike.${wildcard},description.ilike.${wildcard}`)
            .order('created_at', { ascending: false })
            .limit(perTypeFetchLimit)
        : Promise.resolve({ data: [] as any[] })

      const vacancyPromise = types.includes('vacancy')
        ? supabase
            .from('vacancies_with_stats')
            .select('id, slug, title, description, application_deadline, city, address, image_url, created_by, created_by_organization, status, is_published, created_at')
            .eq('status', 'approved')
            .eq('is_published', true)
            .or(`title.ilike.${wildcard},description.ilike.${wildcard}`)
            .order('created_at', { ascending: false })
            .limit(perTypeFetchLimit)
        : Promise.resolve({ data: [] as any[] })

      const blogPromise = types.includes('blog')
        ? supabase
            .from('blogs_with_stats')
            .select('id, slug, title, abstract, content_html, featured_image, author_name, status, created_at')
            .eq('status', 'approved')
            .or(`title.ilike.${wildcard},abstract.ilike.${wildcard},content_html.ilike.${wildcard}`)
            .order('created_at', { ascending: false })
            .limit(perTypeFetchLimit)
        : Promise.resolve({ data: [] as any[] })

      const orgPromise = types.includes('organization')
        ? supabase
            .from('organization_profiles')
            .select('account_id, url_handle, organization_name, description, profile_image, address, moderation_status, created_at')
            .eq('moderation_status', 'approved')
            .or(`organization_name.ilike.${wildcard},description.ilike.${wildcard},address.ilike.${wildcard}`)
            .order('created_at', { ascending: false })
            .limit(perTypeFetchLimit)
        : Promise.resolve({ data: [] as any[] })

      const [eventResult, vacancyResult, blogResult, orgResult] = await Promise.all([
        eventPromise,
        vacancyPromise,
        blogPromise,
        orgPromise,
      ])

      const queryLower = query.toLowerCase()

      const eventItems: SearchItem[] = (eventResult.data || []).map((row: any) => {
        const location = row?.location && typeof row.location === 'object' ? row.location : {}
        const org = row?.created_by_organization && typeof row.created_by_organization === 'object'
          ? row.created_by_organization
          : null

        const snippet = toSnippet(row?.description)
        return {
          id: String(row.id),
          type: 'event',
          title: String(row.title || ''),
          snippet,
          href: `/resources/events/${row.slug}`,
          imageUrl: normalizeImage(row.image_url),
          date: row.event_date || row.created_at || null,
          ownerLabel: row.organization_name || org?.organization_name || null,
          locationLabel: location?.city || null,
          score: scoreItem(queryLower, String(row.title || ''), snippet),
        }
      })

      const vacancyItems: SearchItem[] = (vacancyResult.data || []).map((row: any) => {
        const createdByOrg = row?.created_by_organization && typeof row.created_by_organization === 'object'
          ? row.created_by_organization
          : null
        const createdBy = row?.created_by && typeof row.created_by === 'object' ? row.created_by : null
        const snippet = toSnippet(row?.description)

        return {
          id: String(row.id),
          type: 'vacancy',
          title: String(row.title || ''),
          snippet,
          href: `/resources/vacancies/${row.slug}`,
          imageUrl: normalizeImage(row.image_url),
          date: row.application_deadline || row.created_at || null,
          ownerLabel: createdByOrg?.organization_name || createdBy?.name || null,
          locationLabel: row.city || row.address || null,
          score: scoreItem(queryLower, String(row.title || ''), snippet),
        }
      })

      const blogItems: SearchItem[] = (blogResult.data || []).map((row: any) => {
        const snippet = toSnippet(row?.abstract || row?.content_html)
        return {
          id: String(row.id),
          type: 'blog',
          title: String(row.title || ''),
          snippet,
          href: `/blogs/${row.slug}`,
          imageUrl: normalizeImage(row.featured_image),
          date: row.created_at || null,
          ownerLabel: row.author_name || null,
          locationLabel: null,
          score: scoreItem(queryLower, String(row.title || ''), snippet),
        }
      })

      const orgItems: SearchItem[] = (orgResult.data || []).map((row: any) => {
        const snippet = toSnippet(row?.description)
        return {
          id: String(row.account_id),
          type: 'organization',
          title: String(row.organization_name || ''),
          snippet,
          href: `/o/${row.url_handle || row.account_id}`,
          imageUrl: normalizeImage(row.profile_image),
          date: row.created_at || null,
          ownerLabel: null,
          locationLabel: row.address || null,
          score: scoreItem(queryLower, String(row.organization_name || ''), snippet),
        }
      })

      const totalsByType = {
        event: eventItems.length,
        vacancy: vacancyItems.length,
        blog: blogItems.length,
        organization: orgItems.length,
      }

      const allItems = [...eventItems, ...vacancyItems, ...blogItems, ...orgItems]
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          return (new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
        })

      const total = allItems.length
      const start = (page - 1) * limit
      const end = start + limit
      const paginatedItems = allItems.slice(start, end)

      return {
        items: paginatedItems,
        pagination: {
          page,
          limit,
          total,
          pages: total > 0 ? Math.ceil(total / limit) : 0,
        },
        totalsByType,
      }
    })

    const response = successResponse(payload)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  } catch (error) {
    console.error('GET /api/search error:', error)
    const response = errorResponse('Qlobal axtarış zamanı xəta baş verdi', 'SEARCH_FAILED', {}, 500)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }
}
