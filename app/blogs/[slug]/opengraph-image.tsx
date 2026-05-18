import { ImageResponse } from 'next/og'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const supabase = createSupabaseAdminClient()
    const { data } = await supabase
      .from('blogs')
      .select('title, author_name')
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .single()

    const title = data?.title || 'icma360 İcma Hekayəsi'
    const author = data?.author_name || 'İcma Müəllifi'

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #059669 100%)',
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
                fontSize: 24,
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500,
              }}
            >
              İcma Hekayəsi
            </div>
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: '#fff',
              textAlign: 'center',
              maxWidth: 900,
              lineHeight: 1.2,
              marginBottom: 32,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 32,
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 500,
            }}
          >
            {author}
          </div>
        </div>
      ),
      { ...size }
    )
  } catch (error) {
    console.error('Error generating blog OG image:', error)
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #059669 100%)',
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
            İcma Hekayələri
          </div>
        </div>
      ),
      { ...size }
    )
  }
}
