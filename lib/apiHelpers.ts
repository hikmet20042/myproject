/**
 * API route helpers combining rate limiting, validation, and auth.
 * Provides a clean interface for building secure API endpoints.
 */

import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { applyRateLimit, RATE_LIMIT_PRESETS, RateLimitPreset, RateLimitResult, getClientIp } from '@/lib/rateLimit'
import { validateSchema, validationErrorResponse, Schema, ValidationResult } from '@/lib/validation'
import { errorResponse } from '@/lib/apiResponse'

/**
 * Options for handling an API request
 */
export interface ApiRequestOptions {
  /** Rate limit preset or custom config */
  rateLimit?: RateLimitPreset | { maxRequests: number; windowMs: number }
  /** Require authentication */
  requireAuth?: boolean
  /** Require admin role */
  requireAdmin?: boolean
  /** Request body schema for validation */
  bodySchema?: Schema
  /** Query parameter schema for validation */
  querySchema?: Schema
  /** Allow unknown fields in body */
  allowUnknownFields?: boolean
  /** Custom endpoint name for rate limiting */
  endpoint?: string
}

/**
 * Result of processing API request options
 */
export interface ApiRequestResult {
  session: Awaited<ReturnType<typeof getServerSession>>
  rateLimitResult: RateLimitResult
  rateLimitHeaders: Record<string, string>
  body?: unknown
  validatedBody?: Record<string, unknown>
  validatedQuery?: Record<string, unknown>
}

/**
 * Process common API request concerns (auth, rate limiting, validation).
 * Returns either an error Response or the processed result.
 * 
 * Usage:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const result = await handleApiRequest(request, {
 *     rateLimit: 'write',
 *     requireAuth: true,
 *     bodySchema: { title: { required: true, type: 'string', minLength: 5 } },
 *   })
 *   if (result instanceof Response) return result
 *   
 *   // Access result.session, result.validatedBody, etc.
 * }
 * ```
 */
export async function handleApiRequest(
  request: NextRequest,
  options: ApiRequestOptions = {}
): Promise<Response | ApiRequestResult> {
  const {
    rateLimit = 'api',
    requireAuth = false,
    requireAdmin = false,
    bodySchema,
    querySchema,
    allowUnknownFields = true,
    endpoint,
  } = options
  
  // 1. Rate limiting
  const userId = requireAuth ? (await getServerSession())?.user?.id : undefined
  const rateLimitConfig = typeof rateLimit === 'string' 
    ? undefined 
    : rateLimit
  const preset = typeof rateLimit === 'string' ? rateLimit : 'api'
  
  const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
    request,
    userId,
    preset,
    customLimit: rateLimitConfig,
    endpoint,
  })
  
  if (!rateLimitResult.allowed) {
    const response = errorResponse(
      'Too many requests. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      {
        retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        limit: rateLimitResult.limit,
      },
      429
    )
    // Add rate limit headers
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }
  
  // 2. Authentication
  let session = null
  if (requireAuth || requireAdmin) {
    session = await getServerSession()
    if (!session?.user?.id) {
      const response = errorResponse('Authentication required', 'AUTH_REQUIRED', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    
    if (requireAdmin && session.user.role !== 'admin') {
      const response = errorResponse('Admin access required', 'ADMIN_ACCESS_REQUIRED', {}, 403)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
  }
  
  // 3. Body validation
  let validatedBody: Record<string, unknown> | undefined
  if (bodySchema) {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      const response = errorResponse('Yanlış JSON sorğu gövdəsi', 'INVALID_JSON', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    
    const validationResult = validateSchema(body, bodySchema, { allowUnknownFields })
    if (!validationResult.success) {
      const response = validationErrorResponse(validationResult.errors!)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    validatedBody = validationResult.data as Record<string, unknown>
  }
  
  // 4. Query validation
  let validatedQuery: Record<string, unknown> | undefined
  if (querySchema) {
    const { searchParams } = new URL(request.url)
    const queryObj: Record<string, string | undefined> = {}
    for (const [key, value] of searchParams.entries()) {
      queryObj[key] = value
    }
    
    const queryResult = validateSchema(queryObj, querySchema)
    if (!queryResult.success) {
      const response = validationErrorResponse(queryResult.errors!)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    validatedQuery = queryResult.data as Record<string, unknown>
  }
  
  return {
    session,
    rateLimitResult,
    rateLimitHeaders,
    body: validatedBody,
    validatedBody,
    validatedQuery,
  }
}

/**
 * Add rate limit headers to a response
 */
export function withRateLimitHeaders(
  response: Response,
  headers: Record<string, string>
): Response {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
  return response
}

/**
 * Create a rate-limited response helper
 */
export function createRateLimitedResponse(
  body: BodyInit | null,
  init: ResponseInit & { rateLimitHeaders?: Record<string, string> } = {}
): Response {
  const { rateLimitHeaders, ...restInit } = init
  const response = new Response(body, restInit)
  if (rateLimitHeaders) {
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
  }
  return response
}
