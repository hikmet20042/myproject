import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function buildUnifiedSaveUrl(request: NextRequest, slug: string): URL {
  const nextUrl = new URL(request.url)
  nextUrl.pathname = `/api/content/vacancy/${encodeURIComponent(slug)}/save`
  return nextUrl
}

// Legacy compatibility route. Canonical save API is /api/content/vacancy/[idOrSlug]/save.
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  return NextResponse.redirect(buildUnifiedSaveUrl(request, params.slug), 307)
}

// Legacy compatibility route. Canonical save API is /api/content/vacancy/[idOrSlug]/save.
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  return NextResponse.redirect(buildUnifiedSaveUrl(request, params.slug), 307)
}