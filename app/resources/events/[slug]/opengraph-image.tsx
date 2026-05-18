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
      .from('events')
      .select('title, organization_name, event_date, event_type, location')
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .single()

    const title = data?.title || 'Tədbir'
    const org = data?.organization_name || 'Təşkilat'
    const eventType = data?.event_type || 'Tədbir'
    const location = data?.location?.city || 'Bakı'
    
    const eventDate = data?.event_date 
      ? new Date(data.event_date).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' })
      : ''

    const typeLabels: Record<string, string> = {
      training_workshop: 'Vörkşop',
      webinar: 'Vebinar',
      training_course: 'Təlim kursu',
      bootcamp: 'Bootcamp',
      panel_discussion: 'Panel müzakirəsi',
      camp: 'Düşərgə',
      forum: 'Forum',
      conference: 'Konfrans',
      flashmob: 'Fləşmob',
      meetup: 'Meetup',
    }

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)',
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
              {typeLabels[eventType] || eventType}
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
            {eventDate && <span>{eventDate}</span>}
            <span>•</span>
            <span>{location}</span>
            <span>•</span>
            <span>{org}</span>
          </div>
        </div>
      ),
      { ...size }
    )
  } catch (error) {
    console.error('Error generating event OG image:', error)
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)',
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
            Tədbirlər
          </div>
        </div>
      ),
      { ...size }
    )
  }
}
