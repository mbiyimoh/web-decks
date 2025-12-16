import { ImageResponse } from 'next/og';

// Image metadata
export const alt = '33 Strategies - Build brilliant things with brilliant people';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Brand colors
const GOLD = '#d4a54a';
const BG_PRIMARY = '#0a0a0f';
const TEXT_PRIMARY = '#f5f5f5';
const TEXT_MUTED = '#71717a';
const TEXT_DIM = '#52525b';

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
          backgroundColor: BG_PRIMARY,
          padding: '60px 80px',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Background glow effect - centered */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '800px',
            height: '800px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${GOLD}12 0%, transparent 50%)`,
          }}
        />

        {/* Secondary glow - top right */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            right: '-150px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${GOLD}10 0%, transparent 60%)`,
          }}
        />

        {/* Main content - centered */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '32px',
            zIndex: 10,
          }}
        >
          {/* 33 Strategies brand mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <span
              style={{
                fontSize: '72px',
                fontFamily: 'Georgia, serif',
                color: GOLD,
                lineHeight: 1,
                fontStyle: 'italic',
              }}
            >
              33
            </span>
            <span
              style={{
                fontSize: '28px',
                fontFamily: 'monospace',
                color: TEXT_MUTED,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
              }}
            >
              Strategies
            </span>
          </div>

          {/* Tagline - two lines */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                fontFamily: 'Georgia, serif',
                color: TEXT_PRIMARY,
                display: 'flex',
                gap: '12px',
              }}
            >
              <span>Build</span>
              <span style={{ color: GOLD }}>brilliant</span>
              <span>things</span>
            </div>
            <div
              style={{
                fontSize: '48px',
                fontFamily: 'Georgia, serif',
                color: TEXT_PRIMARY,
                display: 'flex',
                gap: '12px',
              }}
            >
              <span>with</span>
              <span style={{ color: GOLD }}>brilliant</span>
              <span>people</span>
            </div>
          </div>

          {/* Subtitle */}
          <span
            style={{
              fontSize: '28px',
              color: TEXT_DIM,
              letterSpacing: '0.1em',
            }}
          >
            AI Strategy & Product Development
          </span>
        </div>

        {/* Bottom section - Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: GOLD,
            }}
          />
          <span
            style={{
              fontSize: '28px',
              color: TEXT_DIM,
            }}
          >
            33strategies.ai
          </span>
        </div>

        {/* Decorative gold line at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: `linear-gradient(90deg, transparent, ${GOLD}60, ${GOLD}, ${GOLD}60, transparent)`,
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
