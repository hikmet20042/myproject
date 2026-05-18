import { ImageResponse } from 'next/og'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  try {
    const supabase = createSupabaseAdminClient()
    const { data: resolved } = await resolveEntityBySlugOrId(supabase, 'vacancies', params.slug, 'id, title, organization, city, type')

    const title = resolved?.title || 'Vakansiya'
    const org = (resolved as any)?.organization || 'Təşkilat'
    const city = (resolved as any)?.city || 'Bakı'
    const type = (resolved as any)?.type || 'Tam ştat'

    const typeLabels: Record<string, string> = {
      full_time: 'Tam ştat',
      part_time: 'Yarım ştat',
      intern: 'Təcrübəçi',
      volunteer: 'Könüllülük',
    }

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #7c3aed 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 80,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 40,
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                padding: '8px 16px',
                fontSize: 24,
                color: '#fef08a',
                fontWeight: 700,
              }}
            >
              icma360
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 20,
                color: '#fff',
                fontWeight: 600,
              }}
            >
              {typeLabels[type] || type}
            </div>
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: '#fff',
              textAlign: 'center',
              maxWidth: 900,
              lineHeight: 1.2,
              marginBottom: 24,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 24,
              fontSize: 28,
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 500,
            }}
          >
            <span>{org}</span>
            <span>•</span>
            <span>{city}</span>
          </div>
        </div>
      ),
      { ...size }
    )
  } catch (error) {
    console.error('Error generating vacancy OG image:', error)
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #7c3aed 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 80,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: '#fff',
              textAlign: 'center',
            }}
          >
            icma360
          </div>
          <div
            style={{
              fontSize: 32,
              color: 'rgba(255,255,255,0.7)',
              marginTop: 16,
            }}
          >
            Vakansiyalar
          </div>
        </div>
      ),
      { ...size }
    )
  }
}
