import { ImageResponse } from 'next/og';

// Image metadata
export const runtime = 'edge';
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
  // Load fonts
  const instrumentSerifData = await fetch(
    new URL('https://fonts.gstatic.com/s/instrumentserif/v4/jizBRFtNs2ka5fXjeivQ4LroWlx-2zIZj1bIkNo.woff2')
  ).then((res) => res.arrayBuffer());

  const dmSansData = await fetch(
    new URL('https://fonts.gstatic.com/s/dmsans/v14/rP2Hp2ywxg089UriCZOIHTWEBlw.woff2')
  ).then((res) => res.arrayBuffer());

  const jetbrainsMonoData = await fetch(
    new URL('https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2')
  ).then((res) => res.arrayBuffer());

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
                fontSize: '96px',
                fontFamily: 'Instrument Serif',
                color: GOLD,
                lineHeight: 1,
              }}
            >
              33
            </span>
            <span
              style={{
                fontSize: '18px',
                fontFamily: 'JetBrains Mono',
                color: TEXT_MUTED,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
              }}
            >
              Strategies
            </span>
          </div>

          {/* Tagline */}
          <span
            style={{
              fontSize: '32px',
              fontFamily: 'Instrument Serif',
              color: TEXT_PRIMARY,
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.3,
            }}
          >
            Build <span style={{ color: GOLD }}>brilliant</span> things with{' '}
            <span style={{ color: GOLD }}>brilliant</span> people
          </span>

          {/* Subtitle */}
          <span
            style={{
              fontSize: '15px',
              fontFamily: 'DM Sans',
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
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: GOLD,
            }}
          />
          <span
            style={{
              fontSize: '15px',
              fontFamily: 'DM Sans',
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
      fonts: [
        {
          name: 'Instrument Serif',
          data: instrumentSerifData,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'DM Sans',
          data: dmSansData,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'JetBrains Mono',
          data: jetbrainsMonoData,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}
