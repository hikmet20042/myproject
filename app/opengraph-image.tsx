import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'icma360 — Azərbaycanda Gənclər üçün #1 İmkan Platforması'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1e3a8a',
          backgroundImage: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            icma360
          </div>
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: '#dbeafe',
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.4,
            padding: '0 40px',
          }}
        >
          Azərbaycanda Gənclər üçün #1 İmkan Platforması
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: '#93c5fd',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.5,
            marginTop: 16,
            padding: '0 40px',
          }}
        >
          İş, Təcrübə, Təlim, Könüllülük və Tədbirlər
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 40,
            padding: '12px 32px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 9999,
          }}
        >
          <span style={{ fontSize: 18, color: '#bfdbfe' }}>🇦🇿</span>
          <span style={{ fontSize: 18, color: '#bfdbfe' }}>icma360.org</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
