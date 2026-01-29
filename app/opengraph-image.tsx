import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = 'icma360 - Azerbaijan\'s #1 Youth Opportunity Platform'
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
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            padding: '60px',
            textAlign: 'center',
          }}
        >
          {/* Logo/Title */}
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: '#ffffff',
              marginBottom: 30,
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            icma360
          </div>
          
          {/* Tagline */}
          <div
            style={{
              fontSize: 42,
              fontWeight: 600,
              color: '#fef08a',
              marginBottom: 40,
              maxWidth: '900px',
              lineHeight: 1.3,
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}
          >
            Azərbaycanda Gənclər üçün #1 İmkan Platforması
          </div>
          
          {/* Description */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: '#e0e7ff',
              maxWidth: '800px',
              lineHeight: 1.5,
            }}
          >
            İş • Təcrübə • Təlim • Tədbirlər • QHT
          </div>
          
          {/* Stats */}
          <div
            style={{
              display: 'flex',
              marginTop: 50,
              gap: 40,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.15)',
                padding: '20px 40px',
                borderRadius: 16,
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ fontSize: 48, fontWeight: 900, color: '#fff' }}>500+</div>
              <div style={{ fontSize: 18, color: '#e0e7ff' }}>Opportunities</div>
            </div>
            
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.15)',
                padding: '20px 40px',
                borderRadius: 16,
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ fontSize: 48, fontWeight: 900, color: '#fff' }}>1000+</div>
              <div style={{ fontSize: 18, color: '#e0e7ff' }}>Members</div>
            </div>
            
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.15)',
                padding: '20px 40px',
                borderRadius: 16,
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ fontSize: 48, fontWeight: 900, color: '#fff' }}>100+</div>
              <div style={{ fontSize: 18, color: '#e0e7ff' }}>NGO Partners</div>
            </div>
          </div>
        </div>
        
        {/* Bottom Brand */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            fontSize: 20,
            color: '#e0e7ff',
            fontWeight: 500,
          }}
        >
          🇦🇿 Azərbaycan Gəncliyini Gücləndiririk
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
